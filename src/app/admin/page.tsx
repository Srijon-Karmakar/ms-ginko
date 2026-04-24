import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminDashboardClient } from "@/app/admin/dashboard/admin-dashboard-client";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Admin overview for reservations and restaurant activity.",
};

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/reserve");
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return <AdminDashboardClient />;
}
