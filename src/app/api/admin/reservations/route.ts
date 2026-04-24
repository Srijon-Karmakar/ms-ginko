import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  await supabase.rpc("mark_past_reservations_completed");

  const modernReservationsResult = await supabase
    .from("reservations")
    .select(
      "id, user_id, table_id, guest_name, guest_email, phone, party_size, reservation_date, reservation_time, special_request, status, created_at, updated_at, cancelled_at, completed_at",
    )
    .order("reservation_date", { ascending: true })
    .order("reservation_time", { ascending: true });

  const legacyReservationsResult =
    modernReservationsResult.error
      ? await supabase
          .from("reservations")
          .select(
            "id, user_id, guest_name, guest_email, phone, party_size, reservation_date, reservation_time, special_request, status, created_at, updated_at, cancelled_at, completed_at",
          )
          .order("reservation_date", { ascending: true })
          .order("reservation_time", { ascending: true })
      : null;

  if (modernReservationsResult.error && legacyReservationsResult?.error) {
    return NextResponse.json({ error: legacyReservationsResult.error.message }, { status: 400 });
  }

  const tablesResult = await supabase.from("restaurant_tables").select("id, label");
  const tableLabelById = new Map<string, string>();
  if (!tablesResult.error) {
    for (const table of tablesResult.data ?? []) {
      tableLabelById.set(table.id, table.label);
    }
  }

  const rows =
    !modernReservationsResult.error
      ? modernReservationsResult.data ?? []
      : (legacyReservationsResult?.data ?? []).map((row) => ({ ...row, table_id: null }));

  const reservations = rows.map((reservation) => ({
    ...reservation,
    table_label: reservation.table_id ? tableLabelById.get(reservation.table_id) ?? null : null,
  }));

  return NextResponse.json({ reservations });
}
