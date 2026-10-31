import { createDeal, readDeals } from "@/lib/deals/service";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  listingId: z.string().regex(/^lst_[a-z0-9_]+$/),
  renterLabel: z.string().max(40).optional(),
});

export function GET() {
  return Response.json({ deals: readDeals() });
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Send a JSON body." }, { status: 400 });
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Choose a sample listing." }, { status: 400 });
  }
  try {
    const deal = createDeal(parsed.data.listingId, parsed.data.renterLabel);
    return Response.json({ deal }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not open the file.";
    return Response.json({ error: message }, { status: 400 });
  }
}
