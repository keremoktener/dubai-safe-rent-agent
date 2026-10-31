import Link from "next/link";
import { AuditPreview } from "@/components/AuditPreview";
import { STAGES } from "@/lib/deals/guidance";
import { JVC_BRIEF } from "@/lib/demo";
import type { ListingCardModel } from "@/lib/domain";
import { formatAed } from "@/lib/format";

const checks = [
  {
    n: "01",
    title: "The request, in plain words",
    body: "A furnished one-bedroom in JVC, near 7,000 dirhams, a newer building, a gym. The agent reads size, place, budget, and the extras before it searches.",
  },
  {
    n: "02",
    title: "A shortlist, not a dump",
    body: "Candidate homes come from the sample registry. Fit is separate from trust. A cheap match is not hidden. It is labelled.",
  },
  {
    n: "03",
    title: "Permit, licence, price, pattern",
    body: "Trakheesi permit and RERA licence fields, a sample Ejari-style median, and the fraud patterns Dubai Police describe: a price far under the market, money before a viewing, no permit.",
  },
  {
    n: "04",
    title: "A file a person can finish",
    body: "Viewing, offer, contract, Ejari pack, DEWA move-in, deposit and cheques. The app prepares. A human submits. Ejari and DEWA have no public API here.",
  },
];

export function HomeView({
  lead,
  risk,
}: {
  lead: ListingCardModel;
  risk: ListingCardModel | undefined;
}) {
  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-14 px-6 pt-14 pb-20 lg:grid-cols-[1.12fr_0.88fr] lg:pt-20 lg:pb-28">
        <div>
          <p className="eyebrow">Dubai rental pilot</p>
          <h1 className="display mt-5 text-[clamp(3.5rem,7.6vw,6.7rem)] leading-[0.9] tracking-[-0.04em]">
            Check the permit
            <span className="block">
              <span className="italic text-accent">before</span> the cheque.
            </span>
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted">
            Dubai Safe Rent reads a rental request, lines up candidate homes, and scores each one.
            Listing permit, broker licence, price against a sample market band, and the warnings Dubai Police publish.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/agent" className="btn btn-primary">
              Try the JVC brief
              <span aria-hidden="true" className="arrow">
                →
              </span>
            </Link>
            <a href="#method" className="btn btn-ghost">
              How a deal is checked
            </a>
          </div>
          <dl className="mt-14 grid max-w-xl grid-cols-3 gap-4 border-t border-line pt-6">
            <div>
              <dt className="eyebrow">Brief</dt>
              <dd className="display mt-2 text-2xl tabular-nums">7,000</dd>
              <dd className="mt-1 text-xs leading-snug text-muted">AED a month</dd>
            </div>
            <div>
              <dt className="eyebrow">Sample median</dt>
              <dd className="display mt-2 text-2xl tabular-nums">
                {lead.price.medianAnnualAed ? Math.round(lead.price.medianAnnualAed / 1000) : "—"}k
              </dd>
              <dd className="mt-1 text-xs leading-snug text-muted">AED a year, JVC</dd>
            </div>
            <div>
              <dt className="eyebrow">Held back</dt>
              <dd className="display mt-2 text-2xl tabular-nums text-danger">{risk?.trust.score ?? "—"}</dd>
              <dd className="mt-1 text-xs leading-snug text-muted">Score of the lure</dd>
            </div>
          </dl>
        </div>
        <AuditPreview listing={lead} />
      </section>

      <section id="method" className="border-t border-line">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
          <p className="eyebrow">Method</p>
          <h2 className="display mt-4 max-w-3xl text-4xl leading-[1.05] tracking-[-0.03em] sm:text-5xl">
            The shortlist is not the product. The reasons are.
          </h2>
          <ol className="mt-14 divide-y divide-line border-y border-line">
            {checks.map((item) => (
              <li key={item.n} className="grid gap-3 py-7 sm:grid-cols-[5rem_16rem_1fr] sm:gap-8 sm:py-8">
                <span className="display text-xl text-accent">{item.n}</span>
                <h3 className="text-lg">{item.title}</h3>
                <p className="text-muted leading-relaxed">{item.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow">The file</p>
              <h2 className="display mt-4 max-w-xl text-4xl leading-[1.05] tracking-[-0.03em] sm:text-5xl">
                Six steps, from the viewing to the cheques.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-muted">
              {lead.title} in the sample set is {formatAed(lead.priceMonthlyAed)} a month, trust {lead.trust.score}.{" "}
              {risk
                ? `${risk.title} scores ${risk.trust.score} and stays on the page so the warning is visible.`
                : null}{" "}
              The quote you can run: “{JVC_BRIEF}”.
            </p>
          </div>
          <ol className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {STAGES.map((stage, index) => (
              <li key={stage.id} className="bg-paper p-6">
                <p className="eyebrow">0{index + 1}</p>
                <h3 className="display mt-3 text-3xl">{stage.title}</h3>
                <p className="mt-2 text-sm text-accent">{stage.kicker}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted">{stage.intro}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-accent text-[#f3efe8]">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:py-24">
          <h2 className="display text-4xl leading-[1.05] tracking-[-0.03em] sm:text-5xl">
            What this pilot will not pretend.
          </h2>
          <ul className="space-y-5 text-[#d5e4df]">
            <li className="border-t border-white/15 pt-5">
              Market figures are a labelled sample, shaped like Dubai Pulse and DLD open Ejari aggregates. They are not a live extract.
            </li>
            <li className="border-t border-white/15 pt-5">
              Permit numbers in the demo are fictional. A live Trakheesi lookup is for licensed entities, and the adapter is ready for that credential.
            </li>
            <li className="border-t border-white/15 pt-5">
              Ejari and DEWA are prepared packs. A person files them. This app does not submit identity documents anywhere.
            </li>
            <li className="border-t border-white/15 pt-5">
              The desk stores a nickname and checklist statuses. Not a passport number, not a visa number, not a file of the Emirates ID.
            </li>
            <li className="border-t border-white/15 pt-5">
              Guidance follows public tenancy practice. It is not legal advice.
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}
