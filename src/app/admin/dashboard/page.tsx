import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Admin overview for reservations and restaurant activity.",
};

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/reserve");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const { data: reservations, error } = await supabase
    .from("reservations")
    .select("id, guest_name, phone, party_size, reservation_date, reservation_time, status, created_at")
    .order("created_at", { ascending: false });

  const totals = {
    pending: reservations?.filter((booking) => booking.status === "pending").length ?? 0,
    confirmed: reservations?.filter((booking) => booking.status === "confirmed").length ?? 0,
    cancelled: reservations?.filter((booking) => booking.status === "cancelled").length ?? 0,
  };

  return (
    <div className="page-wrapper space-y-8">
      <section className="ui-panel p-8 sm:p-10">
        <p className="ui-eyebrow reveal-text">Admin Dashboard</p>
        <h1 className="reveal-text mt-3 text-5xl text-[var(--foreground)]" style={{ animationDelay: "120ms" }}>
          Reservation Operations
        </h1>
        <p className="ui-copy mt-4 text-sm">Track booking pipeline and monitor incoming table requests.</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ["Pending", totals.pending],
          ["Confirmed", totals.confirmed],
          ["Cancelled", totals.cancelled],
        ].map(([label, value]) => (
          <article key={String(label)} className="ui-card p-5">
            <p className="ui-eyebrow">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-[var(--foreground)]">{value}</p>
          </article>
        ))}
      </section>

      {error ? <p className="text-sm text-red-700">{error.message}</p> : null}

      <section className="ui-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[var(--surface-alt)] text-xs uppercase tracking-[0.14em] text-[var(--label)]">
              <tr>
                <th className="px-4 py-3">Guest</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Party</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {reservations?.map((booking) => (
                <tr key={booking.id} className="border-t border-[var(--border)] text-[var(--foreground)]">
                  <td className="px-4 py-3">{booking.guest_name}</td>
                  <td className="px-4 py-3">{booking.phone}</td>
                  <td className="px-4 py-3">{booking.reservation_date}</td>
                  <td className="px-4 py-3">{booking.reservation_time}</td>
                  <td className="px-4 py-3">{booking.party_size}</td>
                  <td className="px-4 py-3">{booking.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
