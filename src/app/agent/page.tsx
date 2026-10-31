import type { Metadata } from "next";
import { AgentWorkspace } from "@/components/AgentWorkspace";

export const metadata: Metadata = {
  title: "Agent",
};

export default function AgentPage() {
  return <AgentWorkspace />;
}
