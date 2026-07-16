import type { Metadata } from "next";
import { MemberPassesView } from "@/components/member-passes-view";

export const metadata: Metadata = {
  title: "My Passes",
  description: "See every active, upcoming, expired, and revoked Unisky Pass held by your wallet.",
};

export default function PassesPage() {
  return <MemberPassesView />;
}
