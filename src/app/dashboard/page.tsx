import type { Metadata } from "next";

import { DashboardClient } from "@/app/dashboard/dashboard-client";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your personal booking dashboard at Ms Ginko.",
};

export default function DashboardPage() {
  return <DashboardClient />;
}

