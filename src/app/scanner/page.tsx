import type { Metadata } from "next";
import { IssuerScannerView } from "@/components/checkin/issuer-scanner-view";

export const metadata: Metadata = {
  title: "Scanner Mode",
  description: "Generate a temporary issuer challenge and verify a member's signed response.",
};

export default async function ScannerPage({
  searchParams,
}: {
  searchParams: Promise<{ programId?: string }>;
}) {
  const { programId } = await searchParams;
  return <IssuerScannerView preferredProgramId={programId} />;
}
