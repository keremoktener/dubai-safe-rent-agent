import type { ListingCardModel, RentalIntent } from "@/lib/domain";
import { intentSummary, parseRentalRequest } from "@/lib/intent/parse";
import { searchListings } from "@/lib/tools/search";
import { templateNarrative } from "@/lib/agent/narrate";

export interface SearchRun {
  intent: RentalIntent;
  listings: ListingCardModel[];
  narrative: string;
  steps: { id: string; label: string; detail: string }[];
}

export function buildSearchRun(message: string): SearchRun {
  const intent = parseRentalRequest(message);
  if (intent.gaps.length >= 2 && !intent.communityCode) {
    return {
      intent,
      listings: [],
      narrative: `Name ${intent.gaps.join(", ")}. For example: furnished 1BR in JVC around 7,000 AED/month, newer building with gym.`,
      steps: [
        {
          id: "understand",
          label: "Understanding the request",
          detail: "The brief is too thin to search the sample registry.",
        },
      ],
    };
  }

  const listings = searchListings(intent);
  const trusted = listings.filter((listing) => listing.trust.band === "trusted").length;
  const flagged = listings.filter((listing) => listing.trust.flags.some((flag) => flag.severity === "critical")).length;
  const priced = listings.filter((listing) => listing.price.position !== "unknown").length;

  return {
    intent,
    listings,
    narrative: templateNarrative(intent, listings),
    steps: [
      {
        id: "understand",
        label: "Understanding the request",
        detail: intentSummary(intent),
      },
      {
        id: "search",
        label: "Gathering candidate listings",
        detail: listings.length
          ? `${listings.length} sample listings kept after matching area, size, furnishing, budget, and amenities.`
          : "No sample listing matched.",
      },
      {
        id: "permit",
        label: "Checking listing permits",
        detail: "Each permit is shape-checked and looked up in the sample Trakheesi registry.",
      },
      {
        id: "licence",
        label: "Checking broker licence fields",
        detail: "ORN and BRN are checked for presence and sample format. This is not a live RERA call.",
      },
      {
        id: "price",
        label: "Comparing price with the sample Ejari band",
        detail: priced
          ? `${priced} of the shortlist have a sample median for their community, size, and furnishing.`
          : "No sample median applied.",
      },
      {
        id: "flags",
        label: "Scanning Dubai Police fraud warnings",
        detail: flagged
          ? `${flagged} listing${flagged === 1 ? " trips" : "s trip"} a critical warning.`
          : "No critical fraud warning on this shortlist.",
      },
      {
        id: "score",
        label: "Writing the trust scores",
        detail: `${trusted} trusted on the sample checks. Open a card to read the reasons.`,
      },
    ],
  };
}
