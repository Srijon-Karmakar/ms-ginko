"use client";

import { FormEvent, useState } from "react";

import { getReservationDateBounds, reservationRules, validateReservationPayload } from "@/lib/reservation-rules";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const toTimeString = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const mins = (minutes % 60).toString().padStart(2, "0");
  return `${hours}:${mins}`;
};

const slots = reservationRules.windows.flatMap((window) => {
  const [startHours, startMinutes] = window.start.split(":").map(Number);
  const [endHours, endMinutes] = window.end.split(":").map(Number);

  const start = startHours * 60 + startMinutes;
  const end = endHours * 60 + endMinutes;

  const values: string[] = [];
  for (let minute = start; minute <= end; minute += reservationRules.slotIntervalMinutes) {
    values.push(toTimeString(minute));
  }

  return values;
});

type ReservationFormProps = {
  userEmail: string;
};

export function ReservationForm({ userEmail }: ReservationFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [state, setState] = useState<{ ok: boolean; message: string }>({
    ok: false,
    message: "",
  });
  const { min, max } = getReservationDateBounds();

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
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
      setState({ ok: false, message: errors[0] });
      return;
    }

    setIsPending(true);
    setState({ ok: false, message: "" });

    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setIsPending(false);
      setState({ ok: false, message: "Please sign in before reserving." });
      return;
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

    setIsPending(false);
    if (error) {
      setState({ ok: false, message: error.message });
      return;
    }

    event.currentTarget.reset();
    setState({ ok: true, message: "Reservation received. We will confirm it shortly." });
  };

  return (
    <form onSubmit={onSubmit} className="ui-panel space-y-5 p-6">
      <div className="ui-card ui-copy p-3 text-sm">Signed in as {userEmail}</div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-[var(--foreground)]">Guest name</span>
          <input required minLength={2} name="guestName" className="ui-field" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-[var(--foreground)]">Phone</span>
          <input required name="phone" minLength={8} className="ui-field" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-[var(--foreground)]">Party size</span>
          <input
            required
            type="number"
            name="partySize"
            min={reservationRules.minPartySize}
            max={reservationRules.maxPartySize}
            defaultValue={2}
            className="ui-field"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-[var(--foreground)]">Reservation date</span>
          <input
            required
            type="date"
            name="reservationDate"
            min={min}
            max={max}
            className="ui-field"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-[var(--foreground)]">Reservation time</span>
        <select required name="reservationTime" className="ui-field">
          <option value="">Select a slot</option>
          {slots.map((slot) => (
            <option key={slot} value={slot}>
              {slot}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-[var(--foreground)]">Special request (optional)</span>
        <textarea name="specialRequest" rows={4} className="ui-field" />
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="ui-btn-primary px-7 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Submitting..." : "Request Reservation"}
      </button>

      {state.message ? (
        <p className={`text-sm ${state.ok ? "text-emerald-700" : "text-red-700"}`}>{state.message}</p>
      ) : null}
    </form>
  );
}
