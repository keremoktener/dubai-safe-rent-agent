import { describe, expect, it } from "vitest";
import { getListing } from "@/lib/data/listings";
import { assessListing } from "@/lib/trust/assess";
import { SCORE, scoreTrust } from "@/lib/trust/score";
import type { TrustInput } from "@/lib/domain";

function clean(overrides: Partial<TrustInput> = {}): TrustInput {
  return {
    permitNumber: "7100284419",
    permitFormatValid: true,
    permitInRegistry: true,
    orn: "24518",
    ornFormatValid: true,
    brn: "51820",
    brnFormatValid: true,
    priceAnnualAed: 88800,
    marketMedianAnnualAed: 78000,
    marketLabel: "furnished 1BR in JVC",
    asksUpfrontBeforeViewing: false,
    refusesEjari: false,
    personalAccountOnly: false,
    socialOnly: false,
    pressureToDecide: false,
    ...overrides,
  };
}

describe("scoreTrust", () => {
  it("scores a complete, in-band listing as trusted", () => {
    const result = scoreTrust(clean());
    expect(result.score).toBe(100);
    expect(result.band).toBe("trusted");
    expect(result.flags).toHaveLength(0);
    expect(result.checks.find((check) => check.id === "permit")?.status).toBe("pass");
    expect(result.summary.length).toBeGreaterThan(10);
  });

  it("treats a missing permit as critical and will not call the listing trusted", () => {
    const result = scoreTrust(clean({ permitNumber: null, permitFormatValid: false, permitInRegistry: false }));
    expect(result.score).toBe(100 - SCORE.missingPermit);
    expect(result.flags.map((flag) => flag.code)).toContain("missing_permit");
    expect(result.flags.find((flag) => flag.code === "missing_permit")?.severity).toBe("critical");
    expect(result.band).toBe("avoid");
    expect(result.summary.toLowerCase()).toContain("do not transfer");
  });

  it("flags a price under 70% of the sample median as way below market, without a second price penalty", () => {
    const result = scoreTrust(clean({ priceAnnualAed: 50000, marketMedianAnnualAed: 78000 }));
    expect(result.score).toBe(100 - SCORE.wayBelow);
    expect(result.flags.map((flag) => flag.code)).toEqual(["way_below_market"]);
    expect(result.band).toBe("caution");
  });

  it("flags payment before a viewing even when the paperwork looks tidy", () => {
    const result = scoreTrust(clean({ asksUpfrontBeforeViewing: true }));
    expect(result.score).toBe(100 - SCORE.upfront);
    expect(result.band).toBe("caution");
    expect(result.band).not.toBe("trusted");
    expect(result.checks.find((check) => check.id === "upfront")?.status).toBe("fail");
  });

  it("flags a refusal to register Ejari", () => {
    const result = scoreTrust(clean({ refusesEjari: true }));
    expect(result.flags.map((flag) => flag.code)).toContain("refuses_ejari");
    expect(result.score).toBe(100 - SCORE.noEjari);
    expect(result.band).not.toBe("trusted");
  });

  it("clamps a stacked fraud pattern at zero", () => {
    const result = scoreTrust(
      clean({
        permitNumber: null,
        permitFormatValid: false,
        permitInRegistry: false,
        orn: null,
        ornFormatValid: false,
        brn: null,
        brnFormatValid: false,
        priceAnnualAed: 49200,
        asksUpfrontBeforeViewing: true,
        refusesEjari: true,
        personalAccountOnly: true,
        socialOnly: true,
        pressureToDecide: true,
      }),
    );
    expect(result.score).toBe(0);
    expect(result.band).toBe("avoid");
    expect(result.flags.map((flag) => flag.code)).toEqual(
      expect.arrayContaining([
        "missing_permit",
        "missing_orn",
        "way_below_market",
        "upfront_before_viewing",
        "refuses_ejari",
        "personal_account",
        "social_only",
        "pressure",
      ]),
    );
  });

  it("penalises a malformed permit less than a missing one, and does not also mark it unlisted", () => {
    const result = scoreTrust(clean({ permitNumber: "ABC", permitFormatValid: false, permitInRegistry: false }));
    expect(result.score).toBe(100 - SCORE.badPermitFormat);
    expect(result.flags.map((flag) => flag.code)).toContain("bad_permit_format");
    expect(result.flags.map((flag) => flag.code)).not.toContain("permit_not_in_sample_registry");
    expect(result.band).toBe("review");
  });

  it("warns when a well-formed permit is outside the sample registry", () => {
    const result = scoreTrust(clean({ permitInRegistry: false }));
    expect(result.score).toBe(100 - SCORE.permitUnlisted);
    expect(result.band).toBe("review");
    expect(result.checks.find((check) => check.id === "permit")?.status).toBe("warn");
  });

  it("uses the below-market penalty between 70% and 85% of the median, not the way-below penalty", () => {
    const below = scoreTrust(clean({ priceAnnualAed: 64000, marketMedianAnnualAed: 78000 }));
    expect(below.score).toBe(100 - SCORE.below);
    expect(below.flags.map((flag) => flag.code)).toEqual(["below_market"]);
    expect(below.band).toBe("review");
  });

  it("treats a price above the band as a note, not a fraud flag", () => {
    const result = scoreTrust(clean({ priceAnnualAed: 120000, marketMedianAnnualAed: 78000 }));
    expect(result.score).toBe(100 - SCORE.above);
    expect(result.flags[0]?.severity).toBe("note");
    expect(result.band).toBe("trusted");
  });

  it("does not call a listing trusted when the sample market band is missing", () => {
    const result = scoreTrust(clean({ marketMedianAnnualAed: null }));
    expect(result.score).toBe(100);
    expect(result.band).toBe("review");
    expect(result.checks.find((check) => check.id === "price")?.status).toBe("warn");
  });

  it("explains every check in plain language", () => {
    const result = scoreTrust(clean());
    expect(result.checks.length).toBeGreaterThanOrEqual(8);
    for (const check of result.checks) {
      expect(check.detail.trim().length).toBeGreaterThan(8);
      expect(check.label.trim().length).toBeGreaterThan(3);
    }
  });
});

describe("assessListing sample registry", () => {
  it("trusts Court Eight and rejects the social-only listing", () => {
    const court = getListing("lst_jvc_court");
    const direct = getListing("lst_jvc_direct");
    const orchard = getListing("lst_jvc_orchard");
    const block = getListing("lst_jvc_block");
    expect(court && direct && orchard && block).toBeTruthy();

    const trusted = assessListing(court!);
    expect(trusted.trust.band).toBe("trusted");
    expect(trusted.trust.score).toBe(100);
    expect(trusted.price.position).toBe("within");
    expect(trusted.price.medianAnnualAed).toBe(78000);

    const avoid = assessListing(direct!);
    expect(avoid.trust.score).toBe(0);
    expect(avoid.trust.band).toBe("avoid");
    expect(avoid.price.position).toBe("way_below");

    const soft = assessListing(orchard!);
    expect(soft.trust.band).toBe("review");
    expect(soft.price.position).toBe("below");
    expect(soft.trust.flags.map((flag) => flag.code)).toContain("below_market");

    const partial = assessListing(block!);
    expect(partial.trust.band).toBe("review");
    expect(partial.trust.flags.map((flag) => flag.code)).toEqual(
      expect.arrayContaining(["permit_not_in_sample_registry", "missing_brn"]),
    );
  });
});
