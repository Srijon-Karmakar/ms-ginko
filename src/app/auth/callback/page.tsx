import { Suspense } from "react";

import { AuthCallbackClient } from "@/app/auth/callback/callback-client";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="page-wrapper">
          <div className="ui-panel p-6 text-sm text-[var(--muted)]">Signing you in...</div>
        </div>
      }
    >
      <AuthCallbackClient />
    </Suspense>
  );
}
