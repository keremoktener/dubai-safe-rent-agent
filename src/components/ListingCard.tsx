"use client";

import { TrustBadge } from "@/components/TrustBadge";
import type { ListingCardModel } from "@/lib/domain";
import { bedsLabel, formatAed } from "@/lib/format";

export function ListingCard({
  listing,
  opening,
  onOpen,
  compact = false,
}: {
  listing: ListingCardModel;
  opening?: boolean;
  onOpen?: (id: string) => void;
  compact?: boolean;
}) {
  const attention = listing.trust.flags.filter((flag) => flag.severity !== "note");
  const shown = compact ? attention.slice(0, 3) : attention;
  return (
    <article className="rounded-2xl border border-line bg-paper p-5 shadow-[0_20px_40px_-36px_rgba(28,25,21,0.7)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">
            {listing.communityCode} · Sample listing
          </p>
          <h3 className="display mt-2 text-balance text-[1.65rem] leading-[1.05] tracking-[-0.03em]">
            {listing.title}
          </h3>
          <p className="mt-2 text-sm text-muted">{listing.office}</p>
        </div>
        <TrustBadge score={listing.trust.score} band={listing.trust.band} label={listing.trust.bandLabel} />
      </div>

      <p className="mt-4 text-sm text-muted">
        {bedsLabel(listing.beds)} · {listing.baths} bath · {listing.sizeSqft.toLocaleString("en-AE")} sqft ·{" "}
        {listing.furnished ? "Furnished" : "Unfurnished"} · {listing.buildingYear}
      </p>

      <p className="display mt-4 text-4xl tracking-[-0.03em] tabular-nums">
        {formatAed(listing.priceMonthlyAed)}
        <span className="ms-2 font-sans text-base tracking-normal text-muted">/ month</span>
      </p>
      <p className="text-sm text-muted">{formatAed(listing.priceAnnualAed)} a year</p>
      <p className="mt-3 text-sm leading-relaxed">{priceLine(listing)}</p>

      <ul className="mt-4 flex flex-wrap gap-2">
        {listing.matchReasons.map((reason) => (
          <li key={reason} className="rounded-full bg-sand px-2.5 py-1 text-xs text-muted">
            {reason}
          </li>
        ))}
      </ul>

      <p className="mt-4 text-sm leading-relaxed text-ink">{listing.trust.summary}</p>
      {listing.warningInclusion ? (
        <p className="mt-2 text-sm text-muted">
          Included because it matches the area and size. The score is why it is held back.
        </p>
      ) : null}

      {shown.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {shown.map((flag) => (
            <li key={flag.code} className="text-sm leading-relaxed">
              <span className="font-medium">{flag.title}. </span>
              <span className="text-muted">{flag.detail}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <details className="mt-4 border-t border-line pt-3">
        <summary className="cursor-pointer text-sm text-accent">All checks</summary>
        <ul className="mt-3 space-y-2">
          {listing.trust.checks.map((check) => (
            <li key={check.id} className="grid grid-cols-[4.5rem_1fr] gap-3 text-sm">
              <span
                className={
                  check.status === "pass" ? "text-ok" : check.status === "warn" ? "text-warn" : "text-danger"
                }
              >
                {check.status === "pass" ? "Pass" : check.status === "warn" ? "Review" : "Fail"}
              </span>
              <span>
                <span className="block">{check.label}</span>
                <span className="block text-muted">{check.detail}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs leading-relaxed text-muted">{listing.price.sourceNote}</p>
      </details>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {onOpen ? (
          <button type="button" className="btn btn-primary" disabled={opening} onClick={() => onOpen(listing.id)}>
            {opening ? "Opening the file" : "Open guided deal"}
            <span aria-hidden="true" className="arrow">
              →
            </span>
          </button>
        ) : null}
        <p className="text-xs text-muted">
          Permit {listing.permitNumber ?? "not provided"}
          {" · "}ORN {listing.orn ?? "missing"}
          {" · "}BRN {listing.brn ?? "missing"}
        </p>
      </div>
    </article>
  );
}

function priceLine(listing: ListingCardModel): string {
  if (listing.price.deltaPct == null || listing.price.medianAnnualAed == null) {
    return "No sample median for this community and size.";
  }
  const median = formatAed(listing.price.medianAnnualAed);
  const delta = listing.price.deltaPct;
  if (delta === 0) return `At the sample median of ${median} a year.`;
  const direction = delta > 0 ? "above" : "under";
  return `${Math.abs(delta)}% ${direction} the sample median of ${median} a year.`;
}
