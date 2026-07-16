import type { Metadata } from "next";
import { MemberCheckInView } from "@/components/checkin/member-check-in-view";

export const metadata: Metadata = {
  title: "Member Check-in",
  description: "Scan an issuer challenge and prove an active membership with a wallet signature.",
};

export default async function CheckInPage({
  searchParams,
}: {
  searchParams: Promise<{ passId?: string }>;
}) {
  const { passId } = await searchParams;
  return <MemberCheckInView preferredPassId={passId} />;
}
