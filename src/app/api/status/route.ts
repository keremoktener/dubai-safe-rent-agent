import { resolveLlmKind } from "@/lib/agent/provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({
    llm: resolveLlmKind(),
    dataMode: "sample",
    trakheesi: process.env.TRAKHEESI_ADAPTER === "live" ? "live-unwired" : "sample",
    market: process.env.MARKET_ADAPTER === "live" ? "live-unwired" : "sample",
  });
}
