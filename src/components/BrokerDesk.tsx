"use client";

import Link from "next/link";
import { useState } from "react";
import { TrustBadge } from "@/components/TrustBadge";
import type { DealRecord, DocumentStatus } from "@/lib/domain";
import { documentProgress, progressFor } from "@/lib/deals/progress";
import { formatAed } from "@/lib/format";
import { STAGES } from "@/lib/deals/guidance";

export function BrokerDesk({ initialDeals }: { initialDeals: DealRecord[] }) {
  const [deals, setDeals] = useState(initialDeals);
  const [error, setError] = useState<string | null>(null);

  async function cycle(deal: DealRecord, documentId: string, status: DocumentStatus) {
    const next: DocumentStatus =
      status === "missing" ? "prepared" : status === "prepared" ? "ready_to_submit" : "missing";
    setError(null);
    const response = await fetch(`/api/deals/${deal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId, documentStatus: next }),
    });
    const body = (await response.json()) as { deal?: DealRecord; error?: string };
    if (!response.ok || !body.deal) {
      setError(body.error ?? "Could not update the checklist.");
      return;
    }
    setDeals((current) => current.map((item) => (item.id === body.deal?.id ? body.deal : item)));
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 lg:py-14">
      <p className="eyebrow">Broker desk</p>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
        <h1 className="display max-w-xl text-5xl leading-[0.95] tracking-[-0.03em] sm:text-6xl">
          Active files, without the identity documents.
        </h1>
        <p className="max-w-sm text-sm leading-relaxed text-muted">
          Passport, visa, and Emirates ID are statuses. The copies stay outside this app. Form F is the sales memorandum, so it stays off a rental file.
        </p>
      </div>

      {deals.length === 0 ? (
        <div className="mt-14 rounded-[1.5rem] border border-dashed border-line bg-paper/70 px-6 py-16 text-center">
          <p className="display text-3xl">The desk is clear.</p>
          <p className="mx-auto mt-3 max-w-md text-muted">
            Run the JVC brief and open a guided deal. The file will land here, with the trust score frozen from that moment.
          </p>
          <Link href="/agent" className="btn btn-primary mt-8">
            Start from the JVC brief
          </Link>
        </div>
      ) : (
        <ul className="mt-12 space-y-6">
          {deals.map((deal) => {
            const progress = progressFor(deal);
            const docs = documentProgress(deal);
            const stage = STAGES.find((item) => item.id === progress.currentStageId);
            return (
              <li key={deal.id} className="rounded-[1.4rem] border border-line bg-paper p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="eyebrow">{deal.renterLabel}</p>
                    <h2 className="display mt-2 text-4xl tracking-[-0.03em]">
                      <Link href={`/deals/${deal.id}`} className="hover:text-accent">
                        {deal.listing.title}
                      </Link>
                    </h2>
                    <p className="mt-2 text-sm text-muted">
                      {deal.listing.community} · {formatAed(deal.listing.priceAnnualAed)} a year · Now at{" "}
                      {stage?.title ?? "Viewing"} · {progress.done}/{progress.total} stages
                    </p>
                  </div>
                  <TrustBadge
                    score={deal.listing.trust.score}
                    band={deal.listing.trust.band}
                    label={deal.listing.trust.bandLabel}
                  />
                </div>
                <p className="mt-4 text-sm text-muted">
                  Documents prepared or ready: {docs.ready} of {docs.tracked}
                </p>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {deal.documents.map((doc) => (
                    <li key={doc.id}>
                      {doc.status === "not_applicable" ? (
                        <div className="rounded-xl bg-sand px-3 py-2 text-sm text-muted">
                          {doc.label}
                          <span className="block text-xs">Not used on a rental</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="w-full rounded-xl bg-sand px-3 py-2 text-start text-sm hover:bg-sand-2"
                          onClick={() => void cycle(deal, doc.id, doc.status)}
                        >
                          <span className="block">{doc.label}</span>
                          <span className="block text-xs text-muted">{statusLabel(doc.status)} · tap to advance</span>
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
      {error ? (
        <p role="alert" className="mt-4 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function statusLabel(status: DocumentStatus): string {
  if (status === "missing") return "Missing";
  if (status === "prepared") return "Prepared";
  if (status === "ready_to_submit") return "Ready to submit";
  return "Not used";
}
