import type { MarketBand } from "@/lib/domain";

export const SAMPLE_SOURCE_NOTE =
  "Sample dataset shaped like Dubai Pulse / DLD open Ejari rental-contract aggregates. Not a live extract. Figures are illustrative for this pilot.";

const PERIOD = "2025-H2 sample";

function band(
  communityCode: string,
  beds: number,
  furnished: boolean,
  medianAnnualAed: number,
  p25AnnualAed: number,
  p75AnnualAed: number,
  sampleContracts: number,
): MarketBand {
  return {
    communityCode,
    beds,
    furnished,
    medianAnnualAed,
    p25AnnualAed,
    p75AnnualAed,
    sampleContracts,
    period: PERIOD,
    sourceNote: SAMPLE_SOURCE_NOTE,
  };
}

/** Illustrative medians for the pilot. Replace via the market adapter when a live feed exists. */
export const SAMPLE_MARKET: MarketBand[] = [
  band("JVC", 0, true, 52000, 44000, 61000, 640),
  band("JVC", 0, false, 46000, 39000, 54000, 510),
  band("JVC", 1, true, 78000, 64000, 96000, 860),
  band("JVC", 1, false, 68000, 56000, 82000, 1120),
  band("JVC", 2, true, 112000, 96000, 132000, 430),
  band("JVC", 2, false, 98000, 84000, 116000, 690),
  band("MARINA", 1, true, 132000, 112000, 158000, 740),
  band("MARINA", 2, false, 155000, 132000, 184000, 610),
  band("JLT", 1, true, 108000, 92000, 128000, 520),
  band("BUSINESS_BAY", 1, true, 118000, 98000, 142000, 480),
  band("DUBAI_HILLS", 1, true, 128000, 110000, 152000, 390),
  band("ARJAN", 1, true, 70000, 58000, 84000, 450),
  band("SPORTS_CITY", 1, true, 62000, 52000, 76000, 310),
];

export function findSampleBand(
  communityCode: string,
  beds: number,
  furnished: boolean,
): MarketBand | null {
  return (
    SAMPLE_MARKET.find(
      (row) =>
        row.communityCode === communityCode &&
        row.beds === beds &&
        row.furnished === furnished,
    ) ?? null
  );
}
