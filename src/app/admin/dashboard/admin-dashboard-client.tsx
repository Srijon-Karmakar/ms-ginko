"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { parseReservationTableMeta } from "@/lib/reservation-table-meta";
import type { Database } from "@/lib/supabase/types";

type Reservation = Database["public"]["Tables"]["reservations"]["Row"] & {
  table_label?: string | null;
};

type ReservationResponse = {
  reservations: Reservation[];
  error?: string;
};

const getTableMeta = (booking: Reservation) => {
  const legacy = parseReservationTableMeta(booking.special_request);
  return {
    tableId: booking.table_id ?? legacy.tableId ?? "-",
    tableLabel: booking.table_label ?? (booking.table_id ? booking.table_id.toUpperCase() : legacy.tableId?.toUpperCase() ?? "-"),
  };
};

export function AdminDashboardClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const response = await fetch("/api/admin/reservations", { method: "GET" });
      const payload = (await response.json()) as ReservationResponse;
      if (!response.ok) {
        if (response.status === 401) {
          router.replace("/reserve");
          return;
        }
        if (response.status === 403) {
          router.replace("/dashboard");
          return;
        }
        setError(payload.error ?? "Could not load reservations.");
        setLoading(false);
        return;
      }

      setReservations(payload.reservations ?? []);
      setLoading(false);
    };

    void loadData();
  }, [router]);

  const totals = useMemo(
    () => ({
      pending: reservations.filter((booking) => booking.status === "pending").length,
      confirmed: reservations.filter((booking) => booking.status === "confirmed").length,
      cancelled: reservations.filter((booking) => booking.status === "cancelled").length,
      completed: reservations.filter((booking) => booking.status === "completed").length,
    }),
    [reservations],
  );

  if (loading) {
    return <div className="ui-panel p-6 text-sm text-[var(--muted)]">Loading admin dashboard...</div>;
  }

  return (
    <div className="page-wrapper space-y-6 sm:space-y-8">
      <section className="ui-panel p-6 sm:p-8">
        <p className="ui-eyebrow">Admin Dashboard</p>
        <h1 className="mt-3 text-4xl text-[var(--foreground)] sm:text-5xl">Reservation Operations</h1>
        <p className="ui-copy mt-3 text-sm">Live pipeline with explicit table assignment and status audit.</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Pending", totals.pending],
          ["Confirmed", totals.confirmed],
          ["Cancelled", totals.cancelled],
          ["Completed", totals.completed],
        ].map(([label, value]) => (
          <article key={String(label)} className="ui-card p-5">
            <p className="ui-eyebrow">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-[var(--foreground)]">{value}</p>
          </article>
        ))}
      </section>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <section className="space-y-3 sm:hidden">
        {reservations.map((booking) => {
          const tableMeta = getTableMeta(booking);
          return (
            <article key={booking.id} className="ui-card p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg text-[var(--foreground)]">{booking.guest_name}</h3>
                <span className="rounded-full bg-[var(--surface-alt)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]">
                  {booking.status}
                </span>
              </div>
              <p className="ui-copy mt-2 text-xs">{booking.guest_email ?? "-"}</p>
              <p className="ui-copy text-xs">{booking.phone}</p>
              <p className="ui-copy mt-2 text-sm">
                {booking.reservation_date} at {booking.reservation_time.slice(0, 5)}
              </p>
              <p className="ui-copy text-sm">Party: {booking.party_size}</p>
              <p className="ui-copy text-sm">
                Table: {tableMeta.tableLabel} (ID: {tableMeta.tableId})
              </p>
            </article>
          );
        })}
        {reservations.length === 0 ? <p className="ui-card p-4 text-sm text-[var(--muted)]">No reservations found.</p> : null}
      </section>

      <section className="ui-card hidden overflow-hidden sm:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[var(--surface-alt)] text-xs uppercase tracking-[0.14em] text-[var(--label)]">
              <tr>
                <th className="px-4 py-3">Guest</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Party</th>
                <th className="px-4 py-3">Table Label</th>
                <th className="px-4 py-3">Table ID</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((booking) => {
                const tableMeta = getTableMeta(booking);
                return (
                  <tr key={booking.id} className="border-t border-[var(--border)] text-[var(--foreground)]">
                    <td className="px-4 py-3">{booking.guest_name}</td>
                    <td className="px-4 py-3">{booking.guest_email ?? "-"}</td>
                    <td className="px-4 py-3">{booking.phone}</td>
                    <td className="px-4 py-3">{booking.reservation_date}</td>
                    <td className="px-4 py-3">{booking.reservation_time.slice(0, 5)}</td>
                    <td className="px-4 py-3">{booking.party_size}</td>
                    <td className="px-4 py-3">{tableMeta.tableLabel}</td>
                    <td className="px-4 py-3">{tableMeta.tableId}</td>
                    <td className="px-4 py-3">{booking.status}</td>
                  </tr>
                );
              })}
              {reservations.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-[var(--muted)]" colSpan={9}>
                    No reservations found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
