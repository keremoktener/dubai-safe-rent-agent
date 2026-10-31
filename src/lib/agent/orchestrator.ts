import type { AgentEvent, AgentResult } from "@/lib/domain";
import { resolveLlmKind } from "@/lib/agent/provider";
import { narrateSearch } from "@/lib/agent/narrate";
import { buildSearchRun } from "@/lib/agent/search-run";
import { guidanceFor, stageFromMessage, STAGES } from "@/lib/deals/guidance";
import { createDeal } from "@/lib/deals/service";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function* runAgent(message: string, paceMs = 220): AsyncGenerator<AgentEvent> {
  const text = message.trim();
  if (!text) {
    yield { type: "error", message: "Write a short brief first." };
    return;
  }

  const dealMatch = text.match(/\b(lst_[a-z0-9_]+)\b/);
  const wantsDeal = /guided deal|start a deal|open a deal|open the file|guide this/i.test(text);
  if (wantsDeal && dealMatch) {
    yield* streamSteps(
      [
        {
          id: "file",
          label: "Opening a guided deal",
          detail: "A local file is created. No identity document is stored.",
        },
        {
          id: "pack",
          label: "Preparing the viewing checklist and cheque picture",
          detail: "Ejari and DEWA stay as packs for a person to submit.",
        },
      ],
      paceMs,
    );
    try {
      const deal = createDeal(dealMatch[1]);
      const result: AgentResult = {
        kind: "deal",
        narrative: `The file for ${deal.listing.title} is open. Work through the viewing checklist before any payment. The cheque picture assumes four cheques and can be changed on the deal.`,
        listings: [deal.listing],
        intent: null,
        llm: "mock",
        dataMode: "sample",
        dealId: deal.id,
        guidance: guidanceFor("viewing") ?? undefined,
      };
      yield { type: "result", result };
    } catch {
      yield { type: "error", message: "That listing is not in the sample registry." };
    }
    return;
  }

  const stageId = stageFromMessage(text);
  const looksLikeSearch = /\d/.test(text) || /\b(jvc|marina|jlt|br|studio|bedroom)\b/i.test(text);
  if (stageId && !looksLikeSearch) {
    const guidance = guidanceFor(stageId);
    const stage = STAGES.find((item) => item.id === stageId);
    yield* streamSteps(
      [
        {
          id: "guide",
          label: `Opening the ${stage?.title.toLowerCase() ?? "deal"} guidance`,
          detail: "This is a checklist for a person. It does not submit anything to a government system.",
        },
      ],
      paceMs,
    );
    yield {
      type: "result",
      result: {
        kind: "guidance",
        narrative: guidance?.intro ?? "Here is the step.",
        listings: [],
        intent: null,
        llm: resolveLlmKind(),
        dataMode: "sample",
        guidance: guidance ?? undefined,
      },
    };
    return;
  }

  const run = buildSearchRun(text);
  if (run.listings.length === 0 && run.steps.length === 1) {
    yield* streamSteps(run.steps, paceMs);
    yield {
      type: "result",
      result: {
        kind: "clarify",
        narrative: run.narrative,
        listings: [],
        intent: run.intent,
        llm: "mock",
        dataMode: "sample",
      },
    };
    return;
  }

  for (const step of run.steps) {
    yield { type: "step", step: { ...step, status: "running", detail: "" } };
    if (paceMs > 0) await wait(paceMs);
    yield { type: "step", step: { ...step, status: "complete" } };
  }

  const narration = await narrateSearch(run.intent, run.listings);
  yield {
    type: "result",
    result: {
      kind: "search",
      narrative: narration.text,
      listings: run.listings,
      intent: run.intent,
      llm: narration.llm,
      dataMode: "sample",
    },
  };
}

async function* streamSteps(
  steps: { id: string; label: string; detail: string }[],
  paceMs: number,
): AsyncGenerator<AgentEvent> {
  for (const step of steps) {
    yield { type: "step", step: { ...step, status: "running", detail: "" } };
    if (paceMs > 0) await wait(paceMs);
    yield { type: "step", step: { ...step, status: "complete" } };
  }
}
