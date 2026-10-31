import { assessListing } from "@/lib/trust/assess";
import { SAMPLE_LISTINGS } from "@/lib/data/listings";
import type { Listing, ListingCardModel, RentalIntent } from "@/lib/domain";

const NEWER_FROM_YEAR = 2019;

export function searchListings(intent: RentalIntent): ListingCardModel[] {
  const ranked = SAMPLE_LISTINGS.map((listing) => scoreMatch(listing, intent))
    .filter((row) => row.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore || b.trust.score - a.trust.score);

  const top = ranked.slice(0, 5);
  for (const row of ranked) {
    if (top.length >= 6) break;
    const critical = row.trust.flags.some((flag) => flag.severity === "critical");
    if (critical && !top.some((item) => item.listing.id === row.listing.id)) {
      top.push({ ...row, warningInclusion: true });
    }
  }

  return top.map(toCard);
}

function toCard(row: Scored): ListingCardModel {
  const { listing, trust, price, matchReasons, warningInclusion } = row;
  return {
    id: listing.id,
    title: listing.title,
    community: listing.community,
    communityCode: listing.communityCode,
    building: listing.building,
    buildingYear: listing.buildingYear,
    beds: listing.beds,
    baths: listing.baths,
    sizeSqft: listing.sizeSqft,
    furnished: listing.furnished,
    amenities: listing.amenities,
    priceMonthlyAed: listing.priceMonthlyAed,
    priceAnnualAed: listing.priceMonthlyAed * 12,
    permitNumber: listing.permitNumber,
    orn: listing.orn,
    brn: listing.brn,
    office: listing.office,
    blurb: listing.blurb,
    matchReasons,
    warningInclusion,
    trust,
    price,
  };
}

interface Scored {
  listing: Listing;
  matchScore: number;
  matchReasons: string[];
  warningInclusion: boolean;
  trust: ReturnType<typeof assessListing>["trust"];
  price: ReturnType<typeof assessListing>["price"];
}

function scoreMatch(listing: Listing, intent: RentalIntent): Scored {
  let matchScore = 0;
  const matchReasons: string[] = [];
  const assessment = assessListing(listing);

  if (intent.communityCode) {
    if (listing.communityCode === intent.communityCode) {
      matchScore += 40;
      matchReasons.push(listing.communityCode);
    }
  } else {
    matchScore += 8;
  }

  if (intent.beds != null) {
    if (listing.beds === intent.beds) {
      matchScore += 25;
      matchReasons.push(intent.beds === 0 ? "Studio" : `${intent.beds} bed`);
    } else if (Math.abs(listing.beds - intent.beds) === 1) {
      matchScore += 6;
    }
  }

  if (intent.furnished != null) {
    if (listing.furnished === intent.furnished) {
      matchScore += 15;
      matchReasons.push(listing.furnished ? "Furnished" : "Unfurnished");
    }
  } else {
    matchScore += 4;
  }

  if (intent.budgetMonthlyAed != null) {
    const gap = Math.abs(listing.priceMonthlyAed - intent.budgetMonthlyAed) / intent.budgetMonthlyAed;
    if (gap <= 0.08) {
      matchScore += 15;
      matchReasons.push("Near budget");
    } else if (gap <= 0.15) {
      matchScore += 10;
      matchReasons.push("Close to budget");
    } else if (gap <= 0.25) {
      matchScore += 4;
    }
  }

  if (intent.wantsNewer) {
    if (listing.buildingYear >= NEWER_FROM_YEAR) {
      matchScore += 10;
      matchReasons.push(String(listing.buildingYear));
    }
  }

  for (const amenity of intent.amenities) {
    if (listing.amenities.includes(amenity)) {
      matchScore += 5;
      matchReasons.push(amenity[0].toUpperCase() + amenity.slice(1));
    }
  }

  if (intent.communityCode && listing.communityCode !== intent.communityCode) {
    matchScore = Math.min(matchScore, 12);
  }

  return {
    listing,
    matchScore,
    matchReasons,
    warningInclusion: false,
    trust: assessment.trust,
    price: assessment.price,
  };
}

export const NEWER_YEAR = NEWER_FROM_YEAR;
