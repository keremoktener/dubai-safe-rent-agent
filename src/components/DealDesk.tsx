"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { TrustBadge } from "@/components/TrustBadge";
import { STAGES } from "@/lib/deals/guidance";
import type { DealRecord, DocumentStatus } from "@/lib/domain";
import { bedsLabel, formatAed, formatDay } from "@/lib/format";
import { progressFor } from "@/lib/deals/progress";

const CHEQUES = [1, 2, 4, 6, 12];
const NEXT_STATUS: Record<DocumentStatus, DocumentStatus> = {
  missing: "prepared",
  prepared: "ready_to_submit",
  ready_to_submit: "missing",
  not_applicable: "not_applicable",
};

export function DealDesk({ initial }: { initial: DealRecord }) {
  const [deal, setDeal] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [nickname, setNickname] = useState(initial.renterLabel);
  const progress = useMemo(() => progressFor(deal), [deal]);
  const [active, setActive] = useState(progress.currentStageId);

  async function patch(body: object) {
    setError(null);
    const response = await fetch(`/api/deals/${deal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json()) as { deal?: DealRecord; error?: string };
    if (!response.ok || !payload.deal) {
      setError(payload.error ?? "Could not save that change.");
      return;
    }
    setDeal(payload.deal);
  }

  const stage = STAGES.find((item) => item.id === active) ?? STAGES[0];
  const checks = deal.checks.filter((check) => check.stageId === stage.id);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 lg:py-14">
      <p className="eyebrow">
        <Link href="/broker" className="hover:text-ink">
          Desk
        </Link>
        <span aria-hidden="true"> · </span>
        Guided file
      </p>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
        <div>
          <h1 className="display text-4xl tracking-[-0.03em] sm:text-6xl">{deal.listing.title}</h1>
          <p className="mt-3 max-w-2xl text-muted">
            {bedsLabel(deal.listing.beds)} · {deal.listing.community} · {formatAed(deal.listing.priceMonthlyAed)} a month ·{" "}
            {formatAed(deal.listing.priceAnnualAed)} a year
          </p>
        </div>
        <TrustBadge
          score={deal.listing.trust.score}
          band={deal.listing.trust.band}
          label={deal.listing.trust.bandLabel}
        />
      </div>

      <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted">{deal.listing.trust.summary}</p>

      <div className="mt-8 flex flex-wrap items-end gap-4">
        <form
          className="flex items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void patch({ renterLabel: nickname });
          }}
        >
          <label className="text-sm">
            <span className="eyebrow block">Nickname</span>
            <input
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              maxLength={40}
              className="mt-2 min-h-11 rounded-full border border-line bg-paper px-4"
            />
          </label>
          <button type="submit" className="btn btn-ghost">
            Save
          </button>
        </form>
        <p className="pb-3 text-sm text-muted">
          {progress.done} of {progress.total} stages complete. No identity numbers on this file.
        </p>
      </div>

      <ol className="mt-8 flex gap-2 overflow-x-auto pb-2" aria-label="Deal stages">
        {STAGES.map((item, index) => {
          const items = deal.checks.filter((check) => check.stageId === item.id);
          const complete = items.every((check) => check.done);
          const current = item.id === progress.currentStageId;
          const selected = item.id === active;
          return (
            <li key={item.id} className="min-w-[9.5rem] flex-1">
              <button
                type="button"
                onClick={() => setActive(item.id)}
                aria-current={selected ? "step" : undefined}
                className={`h-full w-full rounded-2xl border px-3 py-3 text-start ${
                  selected ? "border-accent bg-paper" : "border-line bg-transparent"
                }`}
              >
                <span className="eyebrow">
                  0{index + 1}
                  {complete ? " · Done" : current ? " · Now" : ""}
                </span>
                <span className="mt-1 block text-sm">{item.title}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="rounded-2xl border border-line bg-paper p-5 sm:p-6">
          <p className="eyebrow">{stage.kicker}</p>
          <h2 className="display mt-2 text-4xl">{stage.title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{stage.intro}</p>
          <ul className="mt-6 space-y-4">
            {checks.map((check) => (
              <li key={check.id}>
                <label className="grid cursor-pointer grid-cols-[1.25rem_1fr] gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-[#143f3a]"
                    checked={check.done}
                    onChange={(event) => void patch({ checkId: check.id, checked: event.target.checked })}
                  />
                  <span>
                    <span className="block">{check.label}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted">{check.detail}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <button type="button" className="btn btn-ghost mt-6" onClick={() => void patch({ completeStageId: stage.id })}>
            Mark this stage done
          </button>
        </section>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-line bg-paper p-5">
            <h2 className="display text-2xl">Money picture</h2>
            <p className="mt-2 text-sm text-muted">Illustrative. Nothing here moves money.</p>
            <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Number of cheques">
              {CHEQUES.map((count) => (
                <button
                  key={count}
                  type="button"
                  aria-pressed={deal.schedule.chequeCount === count}
                  className={`rounded-full px-3 py-1.5 text-sm ${
                    deal.schedule.chequeCount === count ? "bg-accent text-[#f4efe6]" : "bg-sand text-ink"
                  }`}
                  onClick={() => void patch({ chequeCount: count })}
                >
                  {count}
                </button>
              ))}
            </div>
            <ul className="mt-4 space-y-3">
              {deal.schedule.lines.map((line) => (
                <li key={line.id} className="border-t border-line pt-3 text-sm">
                  <div className="flex items-baseline justify-between gap-3">
                    <span>{line.label}</span>
                    <span className="tabular-nums">
                      {line.amountAed == null ? "Confirm" : formatAed(line.amountAed)}
                    </span>
                  </div>
                  <p className="mt-1 text-muted">
                    {line.due ? formatDay(line.due) : "Date not fixed"}
                    {line.refundable ? " · Refundable" : ""}
                  </p>
                  {line.note ? <p className="mt-1 text-muted">{line.note}</p> : null}
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      <section className="mt-6 rounded-2xl border border-line bg-paper p-5 sm:p-6">
        <h2 className="display text-3xl">Document statuses</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Tick a status when the paper exists. This screen does not upload it. Form F is the sales memorandum and stays off a rental file.
        </p>
        <ul className="mt-5 divide-y divide-line">
          {deal.documents.map((doc) => (
            <li key={doc.id} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p>
                  {doc.label}
                  <span className="text-muted"> · {doc.holder}</span>
                </p>
                <p className="mt-1 text-sm text-muted">{doc.note}</p>
              </div>
              {doc.status === "not_applicable" ? (
                <span className="text-sm text-muted">Not used</span>
              ) : (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() =>
                    void patch({ documentId: doc.id, documentStatus: NEXT_STATUS[doc.status] })
                  }
                >
                  {labelFor(doc.status)}
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>
      {error ? (
        <p role="alert" className="mt-4 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function labelFor(status: DocumentStatus): string {
  if (status === "missing") return "Missing";
  if (status === "prepared") return "Prepared";
  if (status === "ready_to_submit") return "Ready to submit";
  return "Not used";
}
