"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { parseReservationTableMeta } from "@/lib/reservation-table-meta";
import { getReservationDateBounds, getReservationTimeSlots, reservationRules } from "@/lib/reservation-rules";
import type { Database } from "@/lib/supabase/types";

type Reservation = Database["public"]["Tables"]["reservations"]["Row"];
type ReservationView = Reservation & {
  table_label?: string | null;
};

type ReservationResponse = {
  reservations: ReservationView[];
  error?: string;
};

type TableOption = {
  id: string;
  label: string;
  capacity: number;
  isAvailable: boolean;
};

const toDateTime = (reservation: ReservationView) => {
  return new Date(`${reservation.reservation_date}T${reservation.reservation_time}`);
};

const isUpcoming = (reservation: ReservationView) => {
  if (reservation.status === "cancelled" || reservation.status === "completed") {
    return false;
  }

  return toDateTime(reservation).getTime() >= Date.now();
};

const editableStatuses: ReservationView["status"][] = ["pending", "confirmed"];
const slots = getReservationTimeSlots();

const getTableMeta = (booking: ReservationView) => {
  const legacy = parseReservationTableMeta(booking.special_request);
  return {
    tableId: booking.table_id ?? legacy.tableId ?? "-",
    tableLabel: booking.table_label ?? (booking.table_id ? booking.table_id.toUpperCase() : legacy.tableId?.toUpperCase() ?? "-"),
  };
};

export function DashboardClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionInfo, setActionInfo] = useState<string | null>(null);
  const [reservations, setReservations] = useState<ReservationView[]>([]);
  const [actionId, setActionId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tableOptions, setTableOptions] = useState<TableOption[]>([]);
  const [loadingTableOptions, setLoadingTableOptions] = useState(false);
  const [draft, setDraft] = useState({
    guestName: "",
    guestEmail: "",
    phone: "",
    partySize: 2,
    reservationDate: "",
    reservationTime: "",
    selectedTableId: "",
    specialRequest: "",
  });
  const { min, max } = getReservationDateBounds();

  const fetchReservations = useCallback(async () => {
    const response = await fetch("/api/reservations", { method: "GET" });
    const payload = (await response.json()) as ReservationResponse;
    return { response, payload };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      const { response, payload } = await fetchReservations();
      if (!isMounted) return;

      if (!response.ok) {
        if (response.status === 401) {
          router.replace("/reserve");
          return;
        }
        setError(payload.error ?? "Could not load reservations.");
        setLoading(false);
        return;
      }

      setReservations(payload.reservations ?? []);
      setLoading(false);
    };

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, [fetchReservations, router]);

  const loadReservations = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { response, payload } = await fetchReservations();
    if (!response.ok) {
      if (response.status === 401) {
        router.replace("/reserve");
        return;
      }
      setError(payload.error ?? "Could not load reservations.");
      setLoading(false);
      return;
    }

    setReservations(payload.reservations ?? []);
    setLoading(false);
  }, [fetchReservations, router]);

  useEffect(() => {
    if (!editingId) return;

    const controller = new AbortController();
    const loadTableOptions = async () => {
      setLoadingTableOptions(true);
      try {
        const params = new URLSearchParams({
          date: draft.reservationDate,
          time: draft.reservationTime,
          partySize: String(draft.partySize),
          ignoreReservationId: editingId,
        });

        const response = await fetch(`/api/reservations/tables?${params.toString()}`, {
          method: "GET",
          signal: controller.signal,
        });
        const payload = (await response.json()) as { error?: string; tables?: TableOption[] };

        if (!response.ok) {
          setTableOptions([]);
          setActionError(payload.error ?? "Could not load table options.");
          return;
        }

        const options = payload.tables ?? [];
        setTableOptions(options);

        setDraft((prev) => {
          if (options.some((table) => table.id === prev.selectedTableId && table.isAvailable)) {
            return prev;
          }
          const firstAvailable = options.find((table) => table.isAvailable);
          return { ...prev, selectedTableId: firstAvailable?.id ?? prev.selectedTableId };
        });
      } catch (fetchError) {
        if ((fetchError as Error).name !== "AbortError") {
          setTableOptions([]);
          setActionError("Could not load table options.");
        }
      } finally {
        setLoadingTableOptions(false);
      }
    };

    if (draft.reservationDate && draft.reservationTime) {
      void loadTableOptions();
    }

    return () => {
      controller.abort();
    };
  }, [draft.partySize, draft.reservationDate, draft.reservationTime, editingId]);

  const upcomingReservations = useMemo(() => reservations.filter(isUpcoming), [reservations]);
  const pastReservations = useMemo(() => reservations.filter((reservation) => !isUpcoming(reservation)), [reservations]);

  const startEdit = (reservation: ReservationView) => {
    setEditingId(reservation.id);
    setTableOptions([]);
    setActionError(null);
    setActionInfo(null);
    const legacy = parseReservationTableMeta(reservation.special_request);
    setDraft({
      guestName: reservation.guest_name,
      guestEmail: reservation.guest_email ?? "",
      phone: reservation.phone,
      partySize: reservation.party_size,
      reservationDate: reservation.reservation_date,
      reservationTime: reservation.reservation_time.slice(0, 5),
      selectedTableId: reservation.table_id ?? legacy.tableId ?? "",
      specialRequest: legacy.note,
    });
  };

  const saveEdit = async (reservationId: string) => {
    setActionId(reservationId);
    setActionError(null);
    setActionInfo(null);

    const response = await fetch(`/api/reservations/${reservationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "edit",
        ...draft,
      }),
    });
    const payload = (await response.json()) as { error?: string };

    setActionId(null);
    if (!response.ok) {
      setActionError(payload.error ?? "Could not update reservation.");
      return;
    }

    setEditingId(null);
    setTableOptions([]);
    setActionInfo("Reservation updated: previous booking was cancelled and a new booking was created.");
    await loadReservations();
  };

  const cancelReservation = async (reservationId: string) => {
    setActionId(reservationId);
    setActionError(null);
    setActionInfo(null);

    const response = await fetch(`/api/reservations/${reservationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel" }),
    });
    const payload = (await response.json()) as { error?: string };

    setActionId(null);
    if (!response.ok) {
      setActionError(payload.error ?? "Could not cancel reservation.");
      return;
    }

    if (editingId === reservationId) {
      setEditingId(null);
      setTableOptions([]);
    }

    await loadReservations();
  };

  if (loading) {
    return <div className="ui-panel p-6 text-sm text-[var(--muted)]">Loading your dashboard...</div>;
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="ui-panel p-6 sm:p-8">
        <p className="ui-eyebrow">Customer Dashboard</p>
        <h1 className="mt-3 text-4xl text-[var(--foreground)] sm:text-5xl">Your Reservations</h1>
        <p className="ui-copy mt-3 text-sm">Edit creates a new booking and cancels the previous booking automatically.</p>
      </section>

      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>
      ) : null}
      {actionError ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{actionError}</p>
      ) : null}
      {actionInfo ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{actionInfo}</p>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-2xl text-[var(--foreground)] sm:text-3xl">Upcoming Reservations</h2>
        {upcomingReservations.length > 0 ? (
          upcomingReservations.map((booking) => {
            const tableMeta = getTableMeta(booking);
            const availableDraftTables = tableOptions.filter((table) => table.isAvailable);

            return (
              <article key={booking.id} className="ui-card p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl text-[var(--foreground)] sm:text-2xl">{booking.guest_name}</h2>
                  <p className="rounded-full bg-[var(--surface-alt)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--foreground)]">
                    {booking.status}
                  </p>
                </div>

                <p className="ui-copy mt-2 text-sm">
                  {booking.reservation_date} at {booking.reservation_time.slice(0, 5)} for {booking.party_size} guests
                </p>
                <p className="ui-copy mt-1 text-xs">
                  Table: {tableMeta.tableLabel} (ID: {tableMeta.tableId})
                </p>
                <p className="ui-eyebrow mt-1">Created on {booking.created_at.slice(0, 10)}</p>

                {editableStatuses.includes(booking.status) ? (
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      className="ui-btn-secondary px-4 py-2 text-xs"
                      onClick={() => startEdit(booking)}
                      disabled={actionId === booking.id}
                    >
                      Reschedule
                    </button>
                    <button
                      type="button"
                      className="ui-btn-secondary px-4 py-2 text-xs"
                      onClick={() => void cancelReservation(booking.id)}
                      disabled={actionId === booking.id}
                    >
                      {actionId === booking.id ? "Working..." : "Cancel"}
                    </button>
                  </div>
                ) : null}

                {editingId === booking.id ? (
                  <div className="mt-5 space-y-4 rounded-xl border border-[var(--border)] p-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-1 block text-sm font-medium">Guest name</span>
                        <input
                          className="ui-field"
                          value={draft.guestName}
                          onChange={(event) => setDraft((prev) => ({ ...prev, guestName: event.currentTarget.value }))}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-sm font-medium">Email</span>
                        <input
                          className="ui-field"
                          type="email"
                          value={draft.guestEmail}
                          onChange={(event) => setDraft((prev) => ({ ...prev, guestEmail: event.currentTarget.value }))}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-sm font-medium">Phone</span>
                        <input
                          className="ui-field"
                          value={draft.phone}
                          onChange={(event) => setDraft((prev) => ({ ...prev, phone: event.currentTarget.value }))}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-sm font-medium">Party size</span>
                        <input
                          className="ui-field"
                          type="number"
                          min={reservationRules.minPartySize}
                          max={reservationRules.maxPartySize}
                          value={draft.partySize}
                          onChange={(event) =>
                            setDraft((prev) => ({ ...prev, partySize: Number(event.currentTarget.value) }))
                          }
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-sm font-medium">Date</span>
                        <input
                          className="ui-field"
                          type="date"
                          min={min}
                          max={max}
                          value={draft.reservationDate}
                          onChange={(event) =>
                            setDraft((prev) => ({ ...prev, reservationDate: event.currentTarget.value }))
                          }
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-sm font-medium">Time</span>
                        <select
                          className="ui-field"
                          value={draft.reservationTime}
                          onChange={(event) =>
                            setDraft((prev) => ({ ...prev, reservationTime: event.currentTarget.value }))
                          }
                        >
                          <option value="">Select a slot</option>
                          {slots.map((slot) => (
                            <option key={slot} value={slot}>
                              {slot}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block sm:col-span-2">
                        <span className="mb-1 block text-sm font-medium">Select table</span>
                        <select
                          className="ui-field"
                          value={draft.selectedTableId}
                          onChange={(event) =>
                            setDraft((prev) => ({ ...prev, selectedTableId: event.currentTarget.value }))
                          }
                          disabled={loadingTableOptions || !draft.reservationDate || !draft.reservationTime}
                        >
                          <option value="">
                            {loadingTableOptions
                              ? "Loading tables..."
                              : !draft.reservationDate || !draft.reservationTime
                                ? "Pick date/time first"
                                : "Select a table"}
                          </option>
                          {availableDraftTables.map((table) => (
                            <option key={table.id} value={table.id}>
                              {table.label} ({table.id.toUpperCase()}) - up to {table.capacity}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <label className="block">
                      <span className="mb-1 block text-sm font-medium">Special request</span>
                      <textarea
                        className="ui-field"
                        rows={3}
                        value={draft.specialRequest}
                        onChange={(event) =>
                          setDraft((prev) => ({ ...prev, specialRequest: event.currentTarget.value }))
                        }
                      />
                    </label>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        className="ui-btn-primary px-5 py-2 text-xs"
                        onClick={() => void saveEdit(booking.id)}
                        disabled={actionId === booking.id || !draft.selectedTableId}
                      >
                        {actionId === booking.id ? "Saving..." : "Save as new reservation"}
                      </button>
                      <button
                        type="button"
                        className="ui-btn-secondary px-5 py-2 text-xs"
                        onClick={() => {
                          setEditingId(null);
                          setTableOptions([]);
                        }}
                        disabled={actionId === booking.id}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })
        ) : (
          <div className="ui-card ui-copy p-6 text-sm">
            No reservations yet.
            <div className="mt-4">
              <Link href="/reserve" className="ui-btn-primary px-5 py-2 text-xs">
                Book now
              </Link>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl text-[var(--foreground)] sm:text-3xl">Booking History</h2>
        {pastReservations.length > 0 ? (
          pastReservations.map((booking) => {
            const tableMeta = getTableMeta(booking);
            return (
              <article key={booking.id} className="ui-card p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-xl text-[var(--foreground)] sm:text-2xl">{booking.guest_name}</h3>
                  <p className="rounded-full bg-[var(--surface-alt)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--foreground)]">
                    {booking.status}
                  </p>
                </div>
                <p className="ui-copy mt-2 text-sm">
                  {booking.reservation_date} at {booking.reservation_time.slice(0, 5)} for {booking.party_size} guests
                </p>
                <p className="ui-copy mt-1 text-xs">
                  Table: {tableMeta.tableLabel} (ID: {tableMeta.tableId})
                </p>
              </article>
            );
          })
        ) : (
          <div className="ui-card ui-copy p-6 text-sm">No past bookings yet.</div>
        )}
      </section>
    </div>
  );
}
