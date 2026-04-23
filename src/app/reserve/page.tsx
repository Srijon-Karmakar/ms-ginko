import type { Metadata } from "next";

import { ReserveClient } from "@/app/reserve/reserve-client";

export const metadata: Metadata = {
  title: "Reserve",
  description: "Reserve your table at Ms Ginko. Login with Google required for booking.",
};

export default function ReservePage() {
  return <ReserveClient />;
}

