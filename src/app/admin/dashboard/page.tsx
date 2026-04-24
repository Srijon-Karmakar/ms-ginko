import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Admin overview for reservations and restaurant activity.",
};

export default async function AdminDashboardPage() {
  redirect("/admin");
}
