"use client";

import { useEffect, useState } from "react";

import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { ReservationForm } from "@/components/reservations/reservation-form";
import { reservationRules } from "@/lib/reservation-rules";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ReserveClient() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const supabase = createSupabaseBrowserClient();

    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!isMounted) return;
      setUserEmail(user?.email ?? null);
      setLoading(false);
    };

    void loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadUser();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="space-y-8">
      <section className="ui-panel p-8 sm:p-10">
        <p className="ui-eyebrow reveal-text">Reservations</p>
        <h1 className="reveal-text mt-3 text-5xl text-[var(--foreground)]" style={{ animationDelay: "120ms" }}>
          Book Your Table
        </h1>
        <p className="ui-copy mt-4 max-w-3xl text-base leading-7">
          Guests can browse freely, but reservation requests require Google sign-in for secure booking history.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div>
          {loading ? (
            <div className="ui-panel p-6 text-sm text-[var(--muted)]">Checking sign-in status...</div>
          ) : userEmail ? (
            <ReservationForm userEmail={userEmail} />
          ) : (
            <div className="ui-panel p-6">
              <h2 className="text-3xl text-[var(--foreground)]">Sign in to continue</h2>
              <p className="ui-copy mt-3 text-sm leading-6">
                Login is only required for reservations. This helps you track all your upcoming bookings in one place.
              </p>
              <div className="mt-6">
                <GoogleSignInButton nextPath="/reserve">Continue with Google</GoogleSignInButton>
              </div>
            </div>
          )}
        </div>

        <aside className="ui-card p-6">
          <p className="ui-eyebrow">Reservation Rules</p>
          <ul className="ui-copy mt-4 space-y-3 text-sm">
            <li>Open Tuesday to Sunday. Closed on Mondays.</li>
            <li>Booking windows: 12:00-15:00 and 18:00-22:30.</li>
            <li>Slot interval: {reservationRules.slotIntervalMinutes} minutes.</li>
            <li>
              Party size: {reservationRules.minPartySize}-{reservationRules.maxPartySize} guests.
            </li>
            <li>Bookings open up to {reservationRules.maxAdvanceDays} days in advance.</li>
          </ul>
        </aside>
      </section>
    </div>
  );
}

