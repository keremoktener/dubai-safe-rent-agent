import { randomBytes } from "node:crypto";
import { getListing } from "@/lib/data/listings";
import { getDeal, insertDeal, listDeals, saveDeal } from "@/lib/data/db";
import type { DealRecord, DocumentStatus, ListingCardModel } from "@/lib/domain";
import { initialChecks, initialDocuments } from "@/lib/deals/guidance";
import { nextFirstOfMonth } from "@/lib/format";
import { searchListings } from "@/lib/tools/search";
import { buildChequeSchedule, isChequeCount } from "@/lib/tools/schedule";
import { assessListing } from "@/lib/trust/assess";
import { parseRentalRequest } from "@/lib/intent/parse";

export function createDeal(listingId: string, renterLabel = "Pilot renter"): DealRecord {
  const listing = getListing(listingId);
  if (!listing) {
    throw new Error("Unknown listing.");
  }
  const card = cardFor(listingId);
  const now = new Date().toISOString();
  const label = sanitizeLabel(renterLabel);
  return insertDeal({
    id: `deal_${randomBytes(4).toString("hex")}`,
    createdAt: now,
    updatedAt: now,
    renterLabel: label,
    listingId,
    listing: card,
    checks: initialChecks(),
    documents: initialDocuments(),
    schedule: buildChequeSchedule({
      annualRentAed: card.priceAnnualAed,
      chequeCount: 4,
      furnished: card.furnished,
      startDate: nextFirstOfMonth(),
    }),
  });
}

export function readDeal(id: string): DealRecord | null {
  return getDeal(id);
}

export function readDeals(): DealRecord[] {
  return listDeals();
}

export function patchDeal(
  id: string,
  patch: {
    checkId?: string;
    checked?: boolean;
    documentId?: string;
    documentStatus?: DocumentStatus;
    chequeCount?: number;
    renterLabel?: string;
    completeStageId?: string;
  },
): DealRecord {
  const deal = getDeal(id);
  if (!deal) throw new Error("Unknown deal.");
  const next: DealRecord = {
    ...deal,
    checks: deal.checks.map((check) => ({ ...check })),
    documents: deal.documents.map((doc) => ({ ...doc })),
    updatedAt: new Date().toISOString(),
  };

  if (patch.renterLabel != null) {
    next.renterLabel = sanitizeLabel(patch.renterLabel);
  }

  if (patch.checkId) {
    next.checks = next.checks.map((check) =>
      check.id === patch.checkId ? { ...check, done: Boolean(patch.checked) } : check,
    );
  }

  if (patch.completeStageId) {
    next.checks = next.checks.map((check) =>
      check.stageId === patch.completeStageId ? { ...check, done: true } : check,
    );
  }

  if (patch.documentId && patch.documentStatus) {
    if (patch.documentId === "form_f" && patch.documentStatus !== "not_applicable") {
      throw new Error("Form F stays off a rental file.");
    }
    next.documents = next.documents.map((doc) =>
      doc.id === patch.documentId ? { ...doc, status: patch.documentStatus! } : doc,
    );
  }

  if (patch.chequeCount != null) {
    if (!isChequeCount(patch.chequeCount)) {
      throw new Error("Cheque count must be 1, 2, 4, 6, or 12.");
    }
    next.schedule = buildChequeSchedule({
      annualRentAed: next.listing.priceAnnualAed,
      chequeCount: patch.chequeCount,
      furnished: next.listing.furnished,
      startDate: next.schedule.startDate,
    });
  }

  return saveDeal(next);
}

function cardFor(listingId: string): ListingCardModel {
  const listing = getListing(listingId);
  if (!listing) throw new Error("Unknown listing.");
  const loose = searchListings({
    ...parseRentalRequest(
      `${listing.furnished ? "furnished" : "unfurnished"} ${listing.beds === 0 ? "studio" : `${listing.beds}BR`} in ${listing.community}`,
    ),
    communityCode: listing.communityCode,
    beds: listing.beds,
    furnished: listing.furnished,
  });
  const found = loose.find((item) => item.id === listingId);
  if (found) return found;
  const assessment = assessListing(listing);
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
    matchReasons: [listing.communityCode],
    warningInclusion: assessment.trust.flags.some((flag) => flag.severity === "critical"),
    trust: assessment.trust,
    price: assessment.price,
  };
}

export function sanitizeLabel(value: string): string {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (!cleaned) return "Pilot renter";
  if (cleaned.length > 40) {
    throw new Error("Use a short nickname.");
  }
  if (/\d{4,}/.test(cleaned)) {
    throw new Error("Use a nickname. Do not enter an ID or passport number.");
  }
  return cleaned;
}
