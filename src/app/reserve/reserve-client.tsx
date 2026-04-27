"use client";

import { useEffect, useState } from "react";

import { AuthModal } from "@/components/auth/auth-modal";
import { ReservationForm } from "@/components/reservations/reservation-form";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ReserveClient() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);

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

  useEffect(() => {
    const openRecoveryModal = async () => {
      if (window.location.hash.includes("type=recovery")) {
        setAuthOpen(true);
      }
    };

    void openRecoveryModal();
  }, []);

  return (
    <div className="page-wrapper py-6 sm:py-8">
      {loading ? (
        <div className="mx-auto max-w-2xl rounded-2xl border border-[color-mix(in_srgb,var(--border)_35%,transparent)] bg-[var(--surface)] p-6 text-sm text-[var(--muted)]">
          Checking sign-in status...
        </div>
      ) : userEmail ? (
        <ReservationForm userEmail={userEmail} />
      ) : (
        <section className="relative mx-auto max-w-3xl overflow-hidden rounded-[1.75rem] border border-[color-mix(in_srgb,var(--border)_38%,transparent)] bg-[var(--surface)] p-6 sm:p-8">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute -right-14 -top-16 h-40 w-40 rounded-full bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] blur-2xl" />
            <div className="absolute -bottom-16 -left-10 h-36 w-36 rounded-full bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)] blur-2xl" />
          </div>

          <div className="relative grid gap-6 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
            <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--accent)_45%,transparent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)] md:mx-0">
              <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                <rect x="4.5" y="10.3" width="15" height="10" rx="2.6" />
                <path d="M8 10.2V8a4 4 0 1 1 8 0v2.2" />
                <circle cx="12" cy="15.2" r="1.2" fill="currentColor" stroke="none" />
              </svg>
            </div>

            <div className="text-center md:text-left">
              <p className="ui-eyebrow">Member Access</p>
              <h2 className="mt-2 text-3xl tracking-tight text-[var(--foreground)] sm:text-4xl">Login Required</h2>
              <p className="ui-copy mt-3 max-w-xl text-sm leading-6 sm:text-base">
                Please sign in to view live table availability and complete your reservation in real time.
              </p>

              <div className="mt-5 flex flex-col items-center gap-2 md:items-start">
                <button
                  type="button"
                  onClick={() => setAuthOpen(true)}
                  className="ui-btn-primary w-full justify-center px-6 py-3 text-xs sm:w-auto"
                >
                  Login / Sign Up
                </button>
                <p className="ui-copy text-xs">You will return to this booking page after sign in.</p>
              </div>
            </div>
          </div>
        </section>
      )}
      {authOpen ? <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} nextPath="/reserve" /> : null}
    </div>
  );
}
