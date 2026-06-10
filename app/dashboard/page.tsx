import type { Metadata } from "next";

import { DashboardSeatManager } from "@/components/dashboard-seat-manager";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return <DashboardSeatManager />;
}
