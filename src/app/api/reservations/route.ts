import { NextRequest, NextResponse } from "next/server";

import { validateReservationPayload } from "@/lib/reservation-rules";
import { buildReservationSpecialRequest, parseReservationTableMeta } from "@/lib/reservation-table-meta";
import { getRestaurantTableById } from "@/lib/restaurant-tables";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const normalizeDate = (value: string) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
    const [day, month, year] = value.split("-");
    return `${year}-${month}-${day}`;
  }
  return value;
};

const mapReservationError = (message: string) => {
  if (message.includes("No seats available")) {
    return { status: 409, message: "Selected slot is full. Please choose another time." };
  }

  if (message.includes("already booked") || message.includes("duplicate key value")) {
    return { status: 409, message: "Selected table is already booked for this slot." };
  }

  if (message.includes("Authentication required")) {
    return { status: 401, message: "Please sign in to continue." };
  }

  if (message.includes("capacity")) {
    return { status: 400, message: "Selected table cannot fit this party size." };
  }

  if (message.includes("invalid")) {
    return { status: 400, message: "Please check date, time, and party size." };
  }

  return { status: 400, message };
};

const isLegacyCreateSignatureError = (message: string) =>
  message.includes("create_reservation") &&
  (message.includes("does not exist") || message.includes("p_table_id"));

type ReservationListRow = {
  id: string;
  user_id: string;
  table_id: string | null;
  guest_name: string;
  guest_email: string | null;
  phone: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  special_request: string | null;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  created_at: string;
  updated_at: string;
  cancelled_at: string | null;
  completed_at: string | null;
};

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  await supabase.rpc("mark_past_reservations_completed");

  const modernReservationsResult = await supabase
    .from("reservations")
    .select(
      "id, user_id, table_id, guest_name, guest_email, phone, party_size, reservation_date, reservation_time, special_request, status, created_at, updated_at, cancelled_at, completed_at",
    )
    .eq("user_id", user.id)
    .order("reservation_date", { ascending: true })
    .order("reservation_time", { ascending: true });

  let reservationRows: ReservationListRow[] = [];
  if (!modernReservationsResult.error) {
    reservationRows = (modernReservationsResult.data ?? []) as ReservationListRow[];
  } else {
    const legacyReservationsResult = await supabase
      .from("reservations")
      .select(
        "id, user_id, guest_name, guest_email, phone, party_size, reservation_date, reservation_time, special_request, status, created_at, updated_at, cancelled_at, completed_at",
      )
      .eq("user_id", user.id)
      .order("reservation_date", { ascending: true })
      .order("reservation_time", { ascending: true });

    if (legacyReservationsResult.error) {
      return NextResponse.json({ error: legacyReservationsResult.error.message }, { status: 400 });
    }

    reservationRows = (legacyReservationsResult.data ?? []).map((row) => ({
      ...row,
      table_id: null,
    })) as ReservationListRow[];
  }

  const tablesResult = await supabase.from("restaurant_tables").select("id, label");
  const tableLabelById = new Map<string, string>();
  if (!tablesResult.error) {
    for (const table of tablesResult.data ?? []) {
      tableLabelById.set(table.id, table.label);
    }
  }

  const reservations = reservationRows.map((reservation) => ({
    ...reservation,
    table_label: reservation.table_id ? tableLabelById.get(reservation.table_id) ?? null : null,
  }));

  return NextResponse.json({ reservations });
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const rawDate = String((body as Record<string, unknown>)?.reservationDate ?? "");
  const rawTime = String((body as Record<string, unknown>)?.reservationTime ?? "");
  const payload = {
    guestName: String((body as Record<string, unknown>)?.guestName ?? ""),
    guestEmail: String((body as Record<string, unknown>)?.guestEmail ?? user.email ?? ""),
    phone: String((body as Record<string, unknown>)?.phone ?? ""),
    partySize: Number((body as Record<string, unknown>)?.partySize ?? 0),
    reservationDate: normalizeDate(rawDate),
    reservationTime: rawTime.slice(0, 5),
    selectedTableId: String((body as Record<string, unknown>)?.selectedTableId ?? "").toLowerCase(),
    specialRequest: String((body as Record<string, unknown>)?.specialRequest ?? "").trim(),
  };

  const errors = validateReservationPayload(payload);
  if (errors.length > 0) {
    return NextResponse.json({ error: errors[0] }, { status: 400 });
  }

  if (!payload.selectedTableId) {
    return NextResponse.json({ error: "Please select a table." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Could not validate table availability. Please configure SUPABASE_SERVICE_ROLE_KEY." },
      { status: 500 },
    );
  }

  const selectedTableResult = await admin
    .from("restaurant_tables")
    .select("id, capacity, active")
    .eq("id", payload.selectedTableId)
    .maybeSingle();

  let selectedTable: { id: string; capacity: number; active: boolean } | null = null;
  if (!selectedTableResult.error) {
    selectedTable = selectedTableResult.data
      ? {
          id: selectedTableResult.data.id,
          capacity: Number(selectedTableResult.data.capacity),
          active: Boolean(selectedTableResult.data.active),
        }
      : null;
  } else {
    const fallbackTable = getRestaurantTableById(payload.selectedTableId);
    if (fallbackTable) {
      selectedTable = { id: fallbackTable.id, capacity: fallbackTable.capacity, active: true };
    } else {
      return NextResponse.json({ error: selectedTableResult.error.message }, { status: 400 });
    }
  }

  if (!selectedTable || !selectedTable.active) {
    return NextResponse.json({ error: "Selected table does not exist." }, { status: 400 });
  }

  if (payload.partySize > Number(selectedTable.capacity)) {
    return NextResponse.json(
      { error: `Selected table seats up to ${selectedTable.capacity} guests.` },
      { status: 400 },
    );
  }

  const modernExistingResult = await admin
    .from("reservations")
    .select("id")
    .eq("reservation_date", payload.reservationDate)
    .eq("reservation_time", `${payload.reservationTime}:00`)
    .eq("table_id", payload.selectedTableId)
    .in("status", ["pending", "confirmed"])
    .limit(1);

  let tableTaken = false;
  if (!modernExistingResult.error) {
    tableTaken = (modernExistingResult.data ?? []).length > 0;
  } else {
    const legacyExistingResult = await admin
      .from("reservations")
      .select("special_request")
      .eq("reservation_date", payload.reservationDate)
      .eq("reservation_time", `${payload.reservationTime}:00`)
      .eq("status", "confirmed");

    if (legacyExistingResult.error) {
      return NextResponse.json({ error: legacyExistingResult.error.message }, { status: 400 });
    }

    tableTaken = (legacyExistingResult.data ?? []).some((reservation) => {
      const parsed = parseReservationTableMeta(reservation.special_request ?? null);
      return parsed.tableId === payload.selectedTableId;
    });
  }

  if (tableTaken) {
    return NextResponse.json({ error: "Selected table is already booked for this slot." }, { status: 409 });
  }

  const { data, error } = await supabase.rpc("create_reservation", {
    p_guest_name: payload.guestName,
    p_guest_email: payload.guestEmail,
    p_phone: payload.phone,
    p_party_size: payload.partySize,
    p_reservation_date: payload.reservationDate,
    p_reservation_time: payload.reservationTime,
    p_table_id: payload.selectedTableId,
    p_special_request: payload.specialRequest || null,
  });

  if (error && isLegacyCreateSignatureError(error.message)) {
    const legacySpecialRequest = buildReservationSpecialRequest({
      tableId: payload.selectedTableId,
      seats: payload.partySize,
      note: payload.specialRequest,
    });

    const legacyCreate = await (supabase as never as { rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }> }).rpc("create_reservation", {
      p_guest_name: payload.guestName,
      p_guest_email: payload.guestEmail,
      p_phone: payload.phone,
      p_party_size: payload.partySize,
      p_reservation_date: payload.reservationDate,
      p_reservation_time: payload.reservationTime,
      p_special_request: legacySpecialRequest,
    });

    if (legacyCreate.error) {
      const mapped = mapReservationError(legacyCreate.error.message);
      return NextResponse.json({ error: mapped.message }, { status: mapped.status });
    }

    return NextResponse.json({ reservation: legacyCreate.data }, { status: 201 });
  }

  if (error) {
    const mapped = mapReservationError(error.message);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }

  return NextResponse.json({ reservation: data }, { status: 201 });
}
