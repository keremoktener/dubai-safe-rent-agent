"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { ListingCardModel } from "@/lib/domain";
import { formatAed } from "@/lib/format";

export function AuditPreview({ listing }: { listing: ListingCardModel }) {
  const checks = listing.trust.checks.slice(0, 5);
  const [count, setCount] = useState(checks.length);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;
    setCount(1);
    const id = window.setInterval(() => {
      setCount((value) => (value >= checks.length ? 1 : value + 1));
    }, 1200);
    return () => window.clearInterval(id);
  }, [checks.length]);

  return (
    <aside
      aria-label="Sample trust check"
      className="relative rounded-[1.6rem] border border-line bg-paper p-6 shadow-[0_30px_70px_-40px_rgba(28,25,21,0.55)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Sample · {listing.communityCode}</p>
          <h2 className="display mt-2 text-4xl leading-none tracking-[-0.03em]">{listing.title}</h2>
          <p className="mt-2 text-sm text-muted">Furnished 1 bedroom · {listing.buildingYear}</p>
        </div>
        <div className="text-end">
          <p className="eyebrow">Trust</p>
          <p className="display text-5xl leading-none tabular-nums text-accent">{listing.trust.score}</p>
        </div>
      </div>
      <p className="display mt-6 text-3xl tabular-nums">
        {formatAed(listing.priceMonthlyAed)}
        <span className="ms-2 font-sans text-sm text-muted">/ month</span>
      </p>
      <ul className="mt-6 space-y-3" aria-live="polite">
        <AnimatePresence initial={false}>
          {checks.slice(0, count).map((check) => (
            <motion.li
              key={check.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="grid grid-cols-[0.8rem_1fr] gap-3 text-sm"
            >
              <span
                className={`mt-1 h-2 w-2 rounded-full ${check.status === "pass" ? "bg-accent" : "bg-warn"}`}
                aria-hidden="true"
              />
              <span>
                <span className="block">{check.label}</span>
                <span className="block text-muted">{check.detail}</span>
              </span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      <p className="mt-6 border-t border-line pt-4 text-xs leading-relaxed text-muted">
        Not a live Trakheesi call. The permit is in this pilot’s sample registry, and the rent is compared with a labelled sample Ejari band.
      </p>
    </aside>
  );
}
