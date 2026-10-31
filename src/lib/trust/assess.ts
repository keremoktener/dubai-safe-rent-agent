import { getMarketAdapter, getTrakheesiAdapter } from "@/lib/adapters";
import { findSampleBand } from "@/lib/data/market";
import type { Listing, PriceComparison, TrustInput, TrustResult } from "@/lib/domain";
import { percentDelta } from "@/lib/format";
import { isBrnFormat, isOfficeNumberFormat, isPermitFormat, PRICE_RATIO, scoreTrust } from "@/lib/trust/score";

export interface Assessment {
  trust: TrustResult;
  price: PriceComparison;
}

export function assessListing(listing: Listing): Assessment {
  const trakheesi = getTrakheesiAdapter();
  let inRegistry = false;
  try {
    inRegistry = listing.permitNumber
      ? trakheesi.lookupPermit(listing.permitNumber) != null
      : false;
  } catch {
    inRegistry = false;
  }

  const market = getMarketAdapter();
  let band = null;
  try {
    band = market.getBand({
      communityCode: listing.communityCode,
      beds: listing.beds,
      furnished: listing.furnished,
    });
  } catch {
    band = findSampleBand(listing.communityCode, listing.beds, listing.furnished);
  }

  const annual = listing.priceMonthlyAed * 12;
  const furnishedLabel = listing.furnished ? "furnished" : "unfurnished";
  const sizeLabel = listing.beds === 0 ? "studio" : `${listing.beds}BR`;
  const marketLabel = `${furnishedLabel} ${sizeLabel} in ${listing.communityCode}`;

  const input: TrustInput = {
    permitNumber: listing.permitNumber,
    permitFormatValid: isPermitFormat(listing.permitNumber),
    permitInRegistry: inRegistry,
    orn: listing.orn,
    ornFormatValid: isOfficeNumberFormat(listing.orn),
    brn: listing.brn,
    brnFormatValid: isBrnFormat(listing.brn),
    priceAnnualAed: annual,
    marketMedianAnnualAed: band?.medianAnnualAed ?? null,
    marketLabel,
    asksUpfrontBeforeViewing: listing.asksUpfrontBeforeViewing,
    refusesEjari: listing.refusesEjari,
    personalAccountOnly: listing.personalAccountOnly,
    socialOnly: listing.socialOnly,
    pressureToDecide: listing.pressureToDecide,
  };

  const trust = scoreTrust(input);
  const price = toPrice(annual, listing.priceMonthlyAed, band, marketLabel);
  return { trust, price };
}

function toPrice(
  annual: number,
  monthly: number,
  band: ReturnType<typeof findSampleBand>,
  marketLabel: string,
): PriceComparison {
  if (!band) {
    return {
      annualAed: annual,
      monthlyAed: monthly,
      medianAnnualAed: null,
      p25AnnualAed: null,
      p75AnnualAed: null,
      deltaPct: null,
      position: "unknown",
      period: null,
      sampleContracts: null,
      sourceNote: "No sample band for this community and size.",
      label: marketLabel,
    };
  }
  const ratio = annual / band.medianAnnualAed;
  const position =
    ratio < PRICE_RATIO.wayBelow
      ? "way_below"
      : ratio < PRICE_RATIO.below
        ? "below"
        : ratio > PRICE_RATIO.above
          ? "above"
          : "within";
  return {
    annualAed: annual,
    monthlyAed: monthly,
    medianAnnualAed: band.medianAnnualAed,
    p25AnnualAed: band.p25AnnualAed,
    p75AnnualAed: band.p75AnnualAed,
    deltaPct: percentDelta(annual, band.medianAnnualAed),
    position,
    period: band.period,
    sampleContracts: band.sampleContracts,
    sourceNote: band.sourceNote,
    label: marketLabel,
  };
}
