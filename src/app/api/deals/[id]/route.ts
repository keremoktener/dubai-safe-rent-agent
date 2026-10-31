import { patchDeal, readDeal } from "@/lib/deals/service";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Patch = z.object({
  checkId: z.string().max(80).optional(),
  checked: z.boolean().optional(),
  documentId: z.string().max(40).optional(),
  documentStatus: z.enum(["missing", "prepared", "ready_to_submit", "not_applicable"]).optional(),
  chequeCount: z.number().int().optional(),
  renterLabel: z.string().max(40).optional(),
  completeStageId: z.string().max(40).optional(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const deal = readDeal(id);
  if (!deal) return Response.json({ error: "No file with that id." }, { status: 404 });
  return Response.json({ deal });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Send a JSON body." }, { status: 400 });
  }
  const parsed = Patch.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "That update is not valid." }, { status: 400 });
  }
  try {
    const deal = patchDeal(id, parsed.data);
    return Response.json({ deal });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update the file.";
    const status = message === "Unknown deal." ? 404 : 400;
    return Response.json({ error: message }, { status });
  }
}
