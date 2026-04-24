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
    <div className="page-wrapper py-4 sm:py-6">
      <div className="rounded-xl border border-[#e2e2e2] bg-[#f5f5f5] p-3 sm:p-4">
        {loading ? (
          <div className="rounded-lg border border-[#dfdfdf] bg-white p-5 text-sm text-[#666666]">
            Checking sign-in status...
          </div>
        ) : userEmail ? (
          <ReservationForm userEmail={userEmail} />
        ) : (
          <div className="mx-auto max-w-md rounded-lg border border-[#dfdfdf] bg-white p-5">
            <h2 className="text-3xl text-[#2f2f2f]">Login Required</h2>
            <p className="mt-2 text-sm text-[#666666]">
              Please sign in to view live table availability and complete your booking.
            </p>
            <button
              type="button"
              onClick={() => setAuthOpen(true)}
              className="mt-4 w-full rounded-xl bg-[#f4c716] px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[#2b2300]"
            >
              Login / Sign Up
            </button>
          </div>
        )}
      </div>
      {authOpen ? <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} nextPath="/reserve" /> : null}
    </div>
  );
}
