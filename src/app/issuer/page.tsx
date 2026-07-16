import type { Metadata } from "next";
import { IssuerDashboardView } from "@/components/issuer/issuer-dashboard-view";

export const metadata: Metadata = {
  title: "Issuer Dashboard",
  description: "Create membership programs, issue passes, and manage their validity.",
};

export default function IssuerPage() {
  return <IssuerDashboardView />;
}
