import { clamp, formatAed, percentDelta } from "@/lib/format";
import type { TrustBand, TrustCheck, TrustFlag, TrustInput, TrustResult } from "@/lib/domain";

/**
 * Point weights for the pilot trust model.
 * A clean listing starts at 100. Deductions stack, then the score is clamped.
 * Critical flags also cap the band, so a high arithmetic score cannot read as trusted.
 */
export const SCORE = {
  missingPermit: 40,
  badPermitFormat: 28,
  permitUnlisted: 12,
  missingOrn: 22,
  badOrn: 14,
  missingBrn: 8,
  badBrn: 6,
  wayBelow: 30,
  below: 12,
  above: 6,
  upfront: 25,
  noEjari: 18,
  personalAccount: 15,
  socialOnly: 10,
  pressure: 8,
} as const;

/** Share of the sample median. Below 70% is the "way below market" fraud pattern. */
export const PRICE_RATIO = {
  wayBelow: 0.7,
  below: 0.85,
  above: 1.35,
} as const;

const BAND_LABEL: Record<TrustBand, string> = {
  trusted: "Trusted",
  review: "Review",
  caution: "Caution",
  avoid: "Avoid",
};

function flag(
  code: string,
  severity: TrustFlag["severity"],
  title: string,
  detail: string,
): TrustFlag {
  return { code, severity, title, detail };
}

export function isPermitFormat(value: string | null | undefined): boolean {
  if (!value) return false;
  return /^\d{10,12}$/.test(value.trim());
}

export function isOfficeNumberFormat(value: string | null | undefined): boolean {
  if (!value) return false;
  return /^\d{4,6}$/.test(value.trim());
}

/** Sample-mode shape check only. It is not an official DLD validation rule. */
export function isBrnFormat(value: string | null | undefined): boolean {
  return isOfficeNumberFormat(value);
}

export function scoreTrust(input: TrustInput): TrustResult {
  let score = 100;
  const flags: TrustFlag[] = [];
  const checks: TrustCheck[] = [];

  if (!input.permitNumber) {
    score -= SCORE.missingPermit;
    flags.push(
      flag(
        "missing_permit",
        "critical",
        "No listing permit",
        "Dubai listings are advertised under a Trakheesi permit, often with a Madmoun QR. A listing with no permit number is a primary fraud warning.",
      ),
    );
    checks.push({
      id: "permit",
      label: "Listing permit",
      status: "fail",
      detail: "No Trakheesi permit number on the listing.",
    });
  } else if (!input.permitFormatValid) {
    score -= SCORE.badPermitFormat;
    flags.push(
      flag(
        "bad_permit_format",
        "warning",
        "Permit number does not match the sample format",
        "Sample mode expects a 10 to 12 digit permit number. This is a shape check, not a live Trakheesi call.",
      ),
    );
    checks.push({
      id: "permit",
      label: "Listing permit",
      status: "fail",
      detail: `${input.permitNumber} does not match the 10–12 digit sample format.`,
    });
  } else if (!input.permitInRegistry) {
    score -= SCORE.permitUnlisted;
    flags.push(
      flag(
        "permit_not_in_sample_registry",
        "warning",
        "Permit not in the sample registry",
        "The number is well formed, but this pilot cannot see the live Trakheesi register. Treat it as unverified until a licensed lookup exists.",
      ),
    );
    checks.push({
      id: "permit",
      label: "Listing permit",
      status: "warn",
      detail: `${input.permitNumber} is well formed and absent from the sample registry.`,
    });
  } else {
    checks.push({
      id: "permit",
      label: "Listing permit",
      status: "pass",
      detail: `${input.permitNumber} is present in the sample Trakheesi registry.`,
    });
  }

  if (!input.orn) {
    score -= SCORE.missingOrn;
    flags.push(
      flag(
        "missing_orn",
        "warning",
        "No broker office licence",
        "RERA office registration (ORN) is missing. Deal with a licensed brokerage, not an unnamed account.",
      ),
    );
    checks.push({
      id: "orn",
      label: "Broker office licence",
      status: "fail",
      detail: "No ORN on the listing.",
    });
  } else if (!input.ornFormatValid) {
    score -= SCORE.badOrn;
    flags.push(
      flag(
        "bad_orn_format",
        "warning",
        "Office licence has an unexpected shape",
        "Sample mode expects a 4 to 6 digit ORN.",
      ),
    );
    checks.push({
      id: "orn",
      label: "Broker office licence",
      status: "fail",
      detail: `${input.orn} does not match the sample ORN shape.`,
    });
  } else {
    checks.push({
      id: "orn",
      label: "Broker office licence",
      status: "pass",
      detail: `ORN ${input.orn} is present and well formed.`,
    });
  }

  if (!input.brn) {
    score -= SCORE.missingBrn;
    flags.push(
      flag(
        "missing_brn",
        "warning",
        "No broker registration number",
        "The individual broker's BRN is missing. Ask for it before a viewing.",
      ),
    );
    checks.push({
      id: "brn",
      label: "Broker registration",
      status: "fail",
      detail: "No BRN on the listing.",
    });
  } else if (!input.brnFormatValid) {
    score -= SCORE.badBrn;
    flags.push(
      flag(
        "bad_brn_format",
        "warning",
        "Broker number has an unexpected shape",
        "Sample mode expects a 4 to 6 digit BRN.",
      ),
    );
    checks.push({
      id: "brn",
      label: "Broker registration",
      status: "fail",
      detail: `${input.brn} does not match the sample BRN shape.`,
    });
  } else {
    checks.push({
      id: "brn",
      label: "Broker registration",
      status: "pass",
      detail: `BRN ${input.brn} is present and well formed.`,
    });
  }

  if (input.marketMedianAnnualAed == null || input.marketMedianAnnualAed <= 0) {
    flags.push(
      flag(
        "no_market_band",
        "warning",
        "No sample market band",
        "There is no sample Ejari band for this community, size, and furnishing. Price was not scored.",
      ),
    );
    checks.push({
      id: "price",
      label: "Price versus sample market",
      status: "warn",
      detail: "No sample band for this home. Price was not scored.",
    });
  } else {
    const median = input.marketMedianAnnualAed;
    const ratio = input.priceAnnualAed / median;
    const delta = percentDelta(input.priceAnnualAed, median);
    const where = input.marketLabel ?? "this segment";
    if (ratio < PRICE_RATIO.wayBelow) {
      score -= SCORE.wayBelow;
      flags.push(
        flag(
          "way_below_market",
          "critical",
          "Price is far below the sample market",
          `Dubai Police warn that rents well under comparable homes are a common lure. This ask is ${Math.abs(delta)}% under the sample median of ${formatAed(median)} a year for ${where}.`,
        ),
      );
      checks.push({
        id: "price",
        label: "Price versus sample market",
        status: "fail",
        detail: `${formatAed(input.priceAnnualAed)} a year is ${Math.abs(delta)}% under the sample median of ${formatAed(median)}.`,
      });
    } else if (ratio < PRICE_RATIO.below) {
      score -= SCORE.below;
      flags.push(
        flag(
          "below_market",
          "warning",
          "Price sits under the sample band",
          `${formatAed(input.priceAnnualAed)} a year is ${Math.abs(delta)}% under the sample median of ${formatAed(median)} for ${where}. Ask why before you treat it as a bargain.`,
        ),
      );
      checks.push({
        id: "price",
        label: "Price versus sample market",
        status: "warn",
        detail: `${Math.abs(delta)}% under the sample median of ${formatAed(median)} a year.`,
      });
    } else if (ratio > PRICE_RATIO.above) {
      score -= SCORE.above;
      flags.push(
        flag(
          "above_market",
          "note",
          "Price sits above the sample band",
          `${delta}% above the sample median of ${formatAed(median)}. That is a negotiation point, not a fraud flag.`,
        ),
      );
      checks.push({
        id: "price",
        label: "Price versus sample market",
        status: "pass",
        detail: `${delta}% above the sample median of ${formatAed(median)}. Not a fraud signal.`,
      });
    } else {
      const direction = delta === 0 ? "at" : delta > 0 ? `${delta}% above` : `${Math.abs(delta)}% under`;
      checks.push({
        id: "price",
        label: "Price versus sample market",
        status: "pass",
        detail: `${formatAed(input.priceAnnualAed)} a year is ${direction} the sample median of ${formatAed(median)} for ${where}.`,
      });
    }
  }

  if (input.asksUpfrontBeforeViewing) {
    score -= SCORE.upfront;
    flags.push(
      flag(
        "upfront_before_viewing",
        "critical",
        "Payment requested before a viewing",
        "Dubai Police warn against booking deposits, documentation fees, or insurance collected before you have seen the home and checked who you are paying.",
      ),
    );
  }
  checks.push({
    id: "upfront",
    label: "No payment before viewing",
    status: input.asksUpfrontBeforeViewing ? "fail" : "pass",
    detail: input.asksUpfrontBeforeViewing
      ? "The listing asks for money before a viewing."
      : "No request for money before a viewing.",
  });

  if (input.refusesEjari) {
    score -= SCORE.noEjari;
    flags.push(
      flag(
        "refuses_ejari",
        "critical",
        "Refuses Ejari registration",
        "A Dubai residential lease is registered on Ejari. A refusal is a reason to walk away.",
      ),
    );
  }
  checks.push({
    id: "ejari",
    label: "Ejari will be registered",
    status: input.refusesEjari ? "fail" : "pass",
    detail: input.refusesEjari
      ? "The counterparty says they will not register Ejari."
      : "Nothing on the listing refuses Ejari.",
  });

  if (input.personalAccountOnly) {
    score -= SCORE.personalAccount;
    flags.push(
      flag(
        "personal_account",
        "warning",
        "Payment only to a personal account",
        "Dubai Police advise against sending rent or deposits to a personal or unknown account.",
      ),
    );
  }
  checks.push({
    id: "account",
    label: "Payment destination",
    status: input.personalAccountOnly ? "fail" : "pass",
    detail: input.personalAccountOnly
      ? "Funds are requested to a personal account."
      : "No demand to pay a personal account.",
  });

  if (input.socialOnly) {
    score -= SCORE.socialOnly;
    flags.push(
      flag(
        "social_only",
        "warning",
        "Contact only through social media",
        "DLD has warned against informal listings that live only on a personal social account, with no licensed office.",
      ),
    );
  }
  checks.push({
    id: "channel",
    label: "Licensed channel",
    status: input.socialOnly ? "warn" : "pass",
    detail: input.socialOnly
      ? "The listing is social-media only."
      : "A brokerage office is named on the listing.",
  });

  if (input.pressureToDecide) {
    score -= SCORE.pressure;
    flags.push(
      flag(
        "pressure",
        "warning",
        "Pressure to pay immediately",
        "Dubai Police note that scammers push a same-day transfer and a story that the home will be gone.",
      ),
    );
  }
  checks.push({
    id: "pressure",
    label: "No urgency pressure",
    status: input.pressureToDecide ? "warn" : "pass",
    detail: input.pressureToDecide
      ? "The listing pressures a same-day decision."
      : "No pressure language on the listing.",
  });

  score = clamp(Math.round(score), 0, 100);
  const band = bandFor(score, flags);

  return {
    score,
    band,
    bandLabel: BAND_LABEL[band],
    flags,
    checks,
    summary: summarize(band, flags),
  };
}

export function bandFor(score: number, flags: TrustFlag[]): TrustBand {
  const critical = flags.some((item) => item.severity === "critical");
  const warning = flags.some((item) => item.severity === "warning");
  if (critical) return score >= 70 ? "caution" : "avoid";
  if (score >= 85 && !warning) return "trusted";
  if (score >= 70) return "review";
  if (score >= 45) return "caution";
  return "avoid";
}

function summarize(band: TrustBand, flags: TrustFlag[]): string {
  if (flags.length === 0) {
    return "Permit, broker licence, and price all sit comfortably on the sample checks.";
  }
  const lead = flags.find((item) => item.severity === "critical") ?? flags[0];
  if (band === "avoid") {
    return `${lead.title}. Do not transfer money on this listing.`;
  }
  if (band === "caution") {
    return `${lead.title}. Pause before any payment.`;
  }
  if (band === "trusted") {
    return "The sample checks are clear. Confirm the permit in person before you offer.";
  }
  return `${lead.title}. Read the checks before you book a viewing.`;
}
