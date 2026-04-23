"use client";

import { useActionState } from "react";

import {
  createReservationAction,
  initialReservationState,
  type ReservationActionState,
} from "@/app/reserve/actions";
import { getReservationDateBounds, reservationRules } from "@/lib/reservation-rules";

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
  const [state, formAction, isPending] = useActionState<ReservationActionState, FormData>(
    createReservationAction,
    initialReservationState,
  );
  const { min, max } = getReservationDateBounds();

  return (
    <form action={formAction} className="ui-panel space-y-5 p-6">
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
