import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DealDesk } from "@/components/DealDesk";
import { readDeal } from "@/lib/deals/service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Deal",
};

export default async function DealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deal = readDeal(id);
  if (!deal) notFound();
  return <DealDesk initial={deal} />;
}
