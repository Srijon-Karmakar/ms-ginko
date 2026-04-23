"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validateReservationPayload } from "@/lib/reservation-rules";

export type ReservationActionState = {
  ok: boolean;
  message: string;
};

export const initialReservationState: ReservationActionState = {
  ok: false,
  message: "",
};

export async function createReservationAction(
  _: ReservationActionState,
  formData: FormData,
): Promise<ReservationActionState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Please sign in with Google before reserving." };
  }

  const payload = {
    guestName: String(formData.get("guestName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    partySize: Number(formData.get("partySize") ?? 0),
    reservationDate: String(formData.get("reservationDate") ?? ""),
    reservationTime: String(formData.get("reservationTime") ?? ""),
    specialRequest: String(formData.get("specialRequest") ?? "").trim(),
  };

  const errors = validateReservationPayload(payload);
  if (errors.length > 0) {
    return { ok: false, message: errors[0] };
  }

  const { error } = await supabase.from("reservations").insert({
    user_id: user.id,
    guest_name: payload.guestName,
    phone: payload.phone,
    party_size: payload.partySize,
    reservation_date: payload.reservationDate,
    reservation_time: payload.reservationTime,
    special_request: payload.specialRequest || null,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/admin/dashboard");

  return { ok: true, message: "Reservation received. We will confirm it shortly." };
}
