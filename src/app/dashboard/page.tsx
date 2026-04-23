import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your personal booking dashboard at Ms Ginko.",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/reserve");
  }

  const { data: reservations, error } = await supabase
    .from("reservations")
    .select("id, guest_name, party_size, reservation_date, reservation_time, status, created_at")
    .eq("user_id", user.id)
    .order("reservation_date", { ascending: true })
    .order("reservation_time", { ascending: true });

  return (
    <div className="page-wrapper space-y-8">
      <section className="ui-panel p-8 sm:p-10">
        <p className="ui-eyebrow reveal-text">Customer Dashboard</p>
        <h1 className="reveal-text mt-3 text-5xl text-[var(--foreground)]" style={{ animationDelay: "120ms" }}>
          Your Reservations
        </h1>
        <p className="ui-copy mt-4 text-sm">Manage upcoming dining plans and revisit booking details.</p>
      </section>

      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</p>
      ) : null}

      <section className="space-y-4">
        {reservations && reservations.length > 0 ? (
          reservations.map((booking) => (
            <article key={booking.id} className="ui-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl text-[var(--foreground)]">{booking.guest_name}</h2>
                <p className="rounded-full bg-[var(--surface-alt)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--foreground)]">
                  {booking.status}
                </p>
              </div>

              <p className="ui-copy mt-2 text-sm">
                {booking.reservation_date} at {booking.reservation_time} for {booking.party_size} guests
              </p>
              <p className="ui-eyebrow mt-1">Request created on {booking.created_at.slice(0, 10)}</p>
            </article>
          ))
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
    </div>
  );
}
