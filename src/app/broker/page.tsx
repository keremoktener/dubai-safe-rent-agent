import type { Metadata } from "next";
import { BrokerDesk } from "@/components/BrokerDesk";
import { readDeals } from "@/lib/deals/service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Broker desk",
};

export default function BrokerPage() {
  const deals = readDeals();
  return <BrokerDesk initialDeals={deals} />;
}
