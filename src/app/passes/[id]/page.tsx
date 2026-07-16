import type { Metadata } from "next";
import { PassDetailView } from "@/components/pass-detail-view";

export const metadata: Metadata = { title: "Pass details" };

export default async function PassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PassDetailView passId={id} />;
}
