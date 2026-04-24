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

  if (message.includes("permission")) {
    return { status: 403, message: "You are not allowed to update this reservation." };
  }

  if (message.includes("not found")) {
    return { status: 404, message: "Reservation not found." };
  }

  if (message.includes("capacity")) {
    return { status: 400, message: "Selected table cannot fit this party size." };
  }

  return { status: 400, message };
};

const isLegacyRescheduleSignatureError = (message: string) =>
  message.includes("reschedule_reservation") && message.includes("does not exist");

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
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

  const action = String((body as Record<string, unknown>)?.action ?? "edit");

  if (action === "cancel") {
    const { data, error } = await supabase.rpc("cancel_reservation", {
      p_reservation_id: id,
    });

    if (error) {
      const mapped = mapReservationError(error.message);
      return NextResponse.json({ error: mapped.message }, { status: mapped.status });
    }

    return NextResponse.json({ reservation: data });
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

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Could not validate table availability. Please configure SUPABASE_SERVICE_ROLE_KEY." },
      { status: 500 },
    );
  }

  const modernCurrentReservation = await admin
    .from("reservations")
    .select("table_id, special_request")
    .eq("id", id)
    .maybeSingle();

  let currentReservation: { table_id: string | null; special_request: string | null } | null = null;
  if (!modernCurrentReservation.error) {
    currentReservation = modernCurrentReservation.data;
  } else {
    const legacyCurrentReservation = await admin
      .from("reservations")
      .select("special_request")
      .eq("id", id)
      .maybeSingle();

    if (legacyCurrentReservation.error) {
      return NextResponse.json({ error: legacyCurrentReservation.error.message }, { status: 400 });
    }

    currentReservation = {
      table_id: null,
      special_request: legacyCurrentReservation.data?.special_request ?? null,
    };
  }

  const legacyTable = parseReservationTableMeta(currentReservation?.special_request ?? null).tableId;
  const selectedTableId = payload.selectedTableId || currentReservation?.table_id || legacyTable || "";

  if (!selectedTableId) {
    return NextResponse.json({ error: "Please select a table." }, { status: 400 });
  }

  const selectedTableResult = await admin
    .from("restaurant_tables")
    .select("id, capacity, active")
    .eq("id", selectedTableId)
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
    const fallbackTable = getRestaurantTableById(selectedTableId);
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
    .eq("table_id", selectedTableId)
    .in("status", ["pending", "confirmed"]);

  let tableTaken = false;
  if (!modernExistingResult.error) {
    tableTaken = (modernExistingResult.data ?? []).some((reservation) => reservation.id !== id);
  } else {
    const legacyExistingResult = await admin
      .from("reservations")
      .select("id, special_request")
      .eq("reservation_date", payload.reservationDate)
      .eq("reservation_time", `${payload.reservationTime}:00`)
      .eq("status", "confirmed");

    if (legacyExistingResult.error) {
      return NextResponse.json({ error: legacyExistingResult.error.message }, { status: 400 });
    }

    tableTaken = (legacyExistingResult.data ?? []).some((reservation) => {
      if (reservation.id === id) return false;
      const parsed = parseReservationTableMeta(reservation.special_request ?? null);
      return parsed.tableId === selectedTableId;
    });
  }

  if (tableTaken) {
    return NextResponse.json({ error: "Selected table is already booked for this slot." }, { status: 409 });
  }

  const { data, error } = await supabase.rpc("reschedule_reservation", {
    p_reservation_id: id,
    p_guest_name: payload.guestName,
    p_guest_email: payload.guestEmail,
    p_phone: payload.phone,
    p_party_size: payload.partySize,
    p_reservation_date: payload.reservationDate,
    p_reservation_time: payload.reservationTime,
    p_table_id: selectedTableId,
    p_special_request: payload.specialRequest || null,
  });

  if (error && isLegacyRescheduleSignatureError(error.message)) {
    const legacySpecialRequest = buildReservationSpecialRequest({
      tableId: selectedTableId,
      seats: payload.partySize,
      note: payload.specialRequest,
    });

    const legacyUpdate = await (supabase as never as { rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }> }).rpc("update_reservation", {
      p_reservation_id: id,
      p_guest_name: payload.guestName,
      p_guest_email: payload.guestEmail,
      p_phone: payload.phone,
      p_party_size: payload.partySize,
      p_reservation_date: payload.reservationDate,
      p_reservation_time: payload.reservationTime,
      p_special_request: legacySpecialRequest,
    });

    if (legacyUpdate.error) {
      const mapped = mapReservationError(legacyUpdate.error.message);
      return NextResponse.json({ error: mapped.message }, { status: mapped.status });
    }

    return NextResponse.json({ reservation: legacyUpdate.data, replacedReservationId: null, legacyUpdated: true });
  }

  if (error) {
    const mapped = mapReservationError(error.message);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }

  return NextResponse.json({ reservation: data, replacedReservationId: id });
}
