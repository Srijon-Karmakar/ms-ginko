import { NextRequest, NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const safeNextPath = (value: string | null) => {
  if (!value) return "/reserve";
  if (!value.startsWith("/")) return "/reserve";
  if (value.startsWith("//")) return "/reserve";
  return value;
};

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const code = request.nextUrl.searchParams.get("code");
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));
  const redirectUrl = new URL(next, origin);

  if (!code) {
    redirectUrl.searchParams.set("authError", "missing_code");
    return NextResponse.redirect(redirectUrl);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    redirectUrl.searchParams.set("authError", "oauth_exchange_failed");
  }

  return NextResponse.redirect(redirectUrl);
}
