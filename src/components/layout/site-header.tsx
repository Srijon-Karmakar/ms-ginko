import { SiteHeaderClient } from "@/components/layout/site-header-client";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function SiteHeader() {
  let headerUser: {
    email: string | null;
    fullName: string | null;
    role: "customer" | "admin";
  } | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .maybeSingle();

      headerUser = {
        email: user.email ?? null,
        fullName: profile?.full_name ?? null,
        role: profile?.role ?? "customer",
      };
    }
  } catch {
    headerUser = null;
  }

  return <SiteHeaderClient user={headerUser} />;
}
