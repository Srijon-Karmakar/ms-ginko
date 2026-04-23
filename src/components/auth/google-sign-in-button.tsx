"use client";

import { useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type GoogleSignInButtonProps = {
  nextPath?: string;
  className?: string;
  children?: React.ReactNode;
};

export function GoogleSignInButton({
  nextPath = "/reserve",
  className,
  children,
}: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);

  const onSignIn = async () => {
    setLoading(true);

    const supabase = createSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    if (error) {
      setLoading(false);
      window.alert(error.message);
    }
  };

  return (
    <button
      type="button"
      onClick={onSignIn}
      disabled={loading}
      className={
        className ??
        "ui-btn-primary inline-flex items-center justify-center px-6 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
      }
    >
      {loading ? "Connecting..." : children ?? "Continue with Google"}
    </button>
  );
}
