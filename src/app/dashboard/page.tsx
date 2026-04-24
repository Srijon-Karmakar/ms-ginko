import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DashboardClient } from "@/app/dashboard/dashboard-client";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your personal booking dashboard at Ms Ginko.",
};

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/reserve");
  }

  return <DashboardClient />;
}
