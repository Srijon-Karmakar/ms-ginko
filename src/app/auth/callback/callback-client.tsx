"use client";

import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const safeNextPath = (value: string | null) => {
  if (!value) return "/reserve";
  if (!value.startsWith("/")) return "/reserve";
  if (value.startsWith("//")) return "/reserve";
  return value;
};

const withAuthError = (path: string, code: string) => {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}authError=${code}`;
};

export function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  useEffect(() => {
    const next = safeNextPath(searchParams.get("next"));
    const authCode = searchParams.get("code");

    const exchange = async () => {
      if (!authCode) {
        router.replace(withAuthError(next, "missing_code"));
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(authCode);
      if (error) {
        router.replace(withAuthError(next, "oauth_exchange_failed"));
        return;
      }

      router.replace(next);
    };

    void exchange();
  }, [router, searchParams, supabase]);

  return (
    <div className="page-wrapper">
      <div className="ui-panel p-6 text-sm text-[var(--muted)]">Signing you in...</div>
    </div>
  );
}
