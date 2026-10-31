import type { ListingCardModel, LlmKind, RentalIntent } from "@/lib/domain";
import { bedsLabel, formatAed } from "@/lib/format";
import { intentSummary } from "@/lib/intent/parse";
import { getLlmProvider, type LlmMessage } from "@/lib/agent/provider";

export function templateNarrative(intent: RentalIntent, listings: ListingCardModel[]): string {
  const lead = listings.find((listing) => listing.trust.band === "trusted") ?? listings[0];
  const avoid = listings.filter((listing) => listing.trust.band === "avoid");
  const paragraphs = [openingSentence(intent)];
  if (!listings.length) {
    paragraphs.push("Nothing in the sample registry matches that brief.");
  } else if (lead) {
    paragraphs.push(
      `${listings.length} sample ${listings.length === 1 ? "listing matches" : "listings match"}. The clearest fit is ${lead.title} at ${formatAed(lead.priceMonthlyAed)} a month, ${bedsLabel(lead.beds).toLowerCase()}, trust ${lead.trust.score} (${lead.trust.bandLabel.toLowerCase()}). ${lead.trust.summary}`,
    );
  }
  if (avoid.length) {
    paragraphs.push(
      `${avoid[0].title} stays on the page because it matches the area and size. It is marked avoid. Dubai Police have warned about this pattern: a price far under the market, no permit, and money asked for before a viewing.`,
    );
  }
  paragraphs.push("Market bands and permits are sample data. Open a guided deal only after the checks sit right with you.");
  return paragraphs.join("\n\n");
}

function openingSentence(intent: RentalIntent): string {
  const furnishing =
    intent.furnished === true ? "a furnished" : intent.furnished === false ? "an unfurnished" : "a";
  const size =
    intent.beds === 0 ? "studio" : intent.beds === 1 ? "one-bedroom" : intent.beds != null ? `${intent.beds}-bedroom` : "home";
  let sentence = `I read this as ${furnishing} ${size}`;
  if (intent.communityName) sentence += ` in ${intent.communityName}`;
  if (intent.budgetMonthlyAed != null) sentence += `, near ${formatAed(intent.budgetMonthlyAed)} a month`;
  if (intent.wantsNewer && intent.amenities.includes("gym")) {
    sentence += ", in a newer building with a gym";
  } else if (intent.wantsNewer) {
    sentence += ", in a newer building";
  } else if (intent.amenities.length) {
    sentence += `, with ${intent.amenities.join(" and ")}`;
  }
  return `${sentence}.`;
}

export async function narrateSearch(
  intent: RentalIntent,
  listings: ListingCardModel[],
): Promise<{ text: string; llm: LlmKind }> {
  const fallback = templateNarrative(intent, listings);
  const provider = getLlmProvider();
  if (provider.id === "mock") return { text: fallback, llm: "mock" };

  const facts = listings.map((listing) => ({
    title: listing.title,
    community: listing.communityCode,
    beds: listing.beds,
    furnished: listing.furnished,
    priceMonthlyAed: listing.priceMonthlyAed,
    trust: listing.trust.score,
    band: listing.trust.band,
    summary: listing.trust.summary,
    flags: listing.trust.flags.map((flag) => flag.code),
  }));

  const messages: LlmMessage[] = [
    {
      role: "system",
      content:
        "You write a short brief for a Dubai rental agent. Use only the JSON facts. Do not invent permit status, prices, neighbourhoods, or legal outcomes. 80 to 130 words. Plain sentences. No headings. Mention that the figures are sample data.",
    },
    {
      role: "user",
      content: JSON.stringify({ brief: intentSummary(intent), listings: facts }),
    },
  ];

  try {
    const text = await provider.complete(messages);
    return { text, llm: provider.id };
  } catch {
    return {
      text: `${fallback} The language model was unavailable, so this note is the deterministic summary.`,
      llm: "mock",
    };
  }
}
