import type { DealRecord } from "@/lib/domain";

export function progressFor(deal: DealRecord): {
  done: number;
  total: number;
  currentStageId: string;
} {
  const total = deal.stageOrder.length;
  let done = 0;
  let currentStageId = deal.stageOrder[0] ?? "viewing";
  let foundOpen = false;
  for (const stageId of deal.stageOrder) {
    const items = deal.checks.filter((check) => check.stageId === stageId);
    const complete = items.length > 0 && items.every((item) => item.done);
    if (complete) done += 1;
    else if (!foundOpen) {
      currentStageId = stageId;
      foundOpen = true;
    }
  }
  if (!foundOpen && deal.stageOrder.length > 0) {
    currentStageId = deal.stageOrder[deal.stageOrder.length - 1];
  }
  return { done, total, currentStageId };
}

export function documentProgress(deal: DealRecord): { ready: number; tracked: number } {
  const tracked = deal.documents.filter((doc) => doc.status !== "not_applicable");
  const ready = tracked.filter((doc) => doc.status === "prepared" || doc.status === "ready_to_submit");
  return { ready: ready.length, tracked: tracked.length };
}
