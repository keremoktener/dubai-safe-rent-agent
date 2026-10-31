import { describe, expect, it } from "vitest";
import { buildSearchRun } from "@/lib/agent/search-run";

describe("JVC search run", () => {
  const run = buildSearchRun(
    "furnished 1BR in JVC around 7,000 AED/month, newer building with gym",
  );

  it("keeps a trusted home at the top of the shortlist", () => {
    expect(run.listings[0]?.id).toBe("lst_jvc_court");
    expect(run.listings[0]?.trust.band).toBe("trusted");
    expect(run.listings[0]?.matchReasons).toEqual(
      expect.arrayContaining(["JVC", "1 bed", "Furnished", "Gym"]),
    );
  });

  it("still surfaces the avoid listing so the warning is visible", () => {
    const scam = run.listings.find((listing) => listing.id === "lst_jvc_direct");
    expect(scam).toBeTruthy();
    expect(scam?.trust.band).toBe("avoid");
    expect(scam?.trust.score).toBe(0);
    expect(scam?.warningInclusion).toBe(true);
    expect(scam?.trust.flags.map((flag) => flag.code)).toEqual(
      expect.arrayContaining(["missing_permit", "way_below_market", "upfront_before_viewing"]),
    );
  });

  it("names the sample basis in the narrative", () => {
    expect(run.narrative.toLowerCase()).toContain("sample");
    expect(run.steps.map((step) => step.id)).toEqual([
      "understand",
      "search",
      "permit",
      "licence",
      "price",
      "flags",
      "score",
    ]);
  });
});
