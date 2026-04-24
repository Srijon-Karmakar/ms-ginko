import type { Metadata } from "next";

import { AdminDashboardClient } from "@/app/admin/dashboard/admin-dashboard-client";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Admin overview for reservations and restaurant activity.",
};

export default function AdminPage() {
  return <AdminDashboardClient />;
}
