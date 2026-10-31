import type { RentalIntent } from "@/lib/domain";

const COMMUNITIES: { code: string; name: string; aliases: string[] }[] = [
  { code: "JVC", name: "Jumeirah Village Circle", aliases: ["jumeirah village circle", "jvc"] },
  { code: "JVT", name: "Jumeirah Village Triangle", aliases: ["jumeirah village triangle", "jvt"] },
  { code: "MARINA", name: "Dubai Marina", aliases: ["dubai marina", "the marina", "marina"] },
  { code: "JLT", name: "Jumeirah Lake Towers", aliases: ["jumeirah lake towers", "jumeirah lakes towers", "jlt"] },
  { code: "DOWNTOWN", name: "Downtown Dubai", aliases: ["downtown dubai", "downtown"] },
  { code: "BUSINESS_BAY", name: "Business Bay", aliases: ["business bay"] },
  { code: "DUBAI_HILLS", name: "Dubai Hills", aliases: ["dubai hills estate", "dubai hills"] },
  { code: "ARJAN", name: "Arjan", aliases: ["arjan"] },
  { code: "SPORTS_CITY", name: "Dubai Sports City", aliases: ["dubai sports city", "sports city"] },
  { code: "AL_BARSHA", name: "Al Barsha", aliases: ["al barsha", "barsha"] },
];

const AMENITIES = ["gym", "pool", "parking", "balcony", "maid"] as const;

const PERIOD =
  "(?:\\/|per|a)?\\s*(month|monthly|mo|year|yearly|annum|annual|yr)";

export function parseRentalRequest(raw: string): RentalIntent {
  const text = raw.trim();
  const lower = text.toLowerCase();
  const community = matchCommunity(lower);
  const beds = matchBeds(lower);
  const furnished = matchFurnished(lower);
  const budget = matchBudget(text);
  const amenities = AMENITIES.filter((item) => new RegExp(`\\b${item}\\b`, "i").test(lower));
  const wantsNewer = /newer|new building|recently built|recent building/.test(lower);

  const gaps: string[] = [];
  if (!community) gaps.push("an area");
  if (beds == null) gaps.push("a size, such as studio or 1BR");
  if (budget.monthly == null) gaps.push("a budget");

  return {
    raw: text,
    communityCode: community?.code ?? null,
    communityName: community?.name ?? null,
    beds,
    furnished,
    budgetMonthlyAed: budget.monthly,
    budgetAnnualAed: budget.annual,
    wantsNewer,
    amenities: [...amenities],
    gaps,
  };
}

export function intentSummary(intent: RentalIntent): string {
  const parts: string[] = [];
  if (intent.furnished === true) parts.push("furnished");
  if (intent.furnished === false) parts.push("unfurnished");
  if (intent.beds === 0) parts.push("studio");
  else if (intent.beds != null) parts.push(`${intent.beds}BR`);
  if (intent.communityName) parts.push(`in ${intent.communityName}`);
  if (intent.budgetMonthlyAed != null) {
    parts.push(`around AED ${intent.budgetMonthlyAed.toLocaleString("en-AE")} a month`);
  }
  if (intent.wantsNewer) parts.push("newer building");
  if (intent.amenities.length) parts.push(intent.amenities.join(", "));
  return parts.join(" · ") || "a rental brief";
}

function matchCommunity(lower: string) {
  const ranked = COMMUNITIES.flatMap((community) =>
    community.aliases.map((alias) => ({ alias, community })),
  ).sort((a, b) => b.alias.length - a.alias.length);
  return ranked.find((row) => lower.includes(row.alias))?.community ?? null;
}

function matchBeds(lower: string): number | null {
  if (/\bstudio\b/.test(lower)) return 0;
  const match = lower.match(/\b(\d)\s*[- ]?\s*(?:br|bed(?:room)?s?)\b/);
  if (!match) return null;
  const beds = Number(match[1]);
  return beds >= 0 && beds <= 8 ? beds : null;
}

function matchFurnished(lower: string): boolean | null {
  if (/\bunfurnished\b/.test(lower)) return false;
  if (/\bfurnished\b/.test(lower)) return true;
  return null;
}

function matchBudget(text: string): { monthly: number | null; annual: number | null } {
  const patterns = [
    new RegExp(`(?:aed|dh|dhs)\\s*(\\d[\\d,]*)(\\s*k)?\\s*${PERIOD}`, "i"),
    new RegExp(`(\\d[\\d,]*)(\\s*k)?\\s*(?:aed|dh|dhs)?\\s*${PERIOD}`, "i"),
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const amount = parseAmount(match[1], Boolean(match[2]));
    const period = match[3]?.toLowerCase() ?? "";
    if (amount == null) continue;
    if (period.startsWith("y") || period.startsWith("ann")) {
      return { annual: amount, monthly: Math.round(amount / 12) };
    }
    return { monthly: amount, annual: amount * 12 };
  }
  return { monthly: null, annual: null };
}

function parseAmount(raw: string, thousands: boolean): number | null {
  const value = Number(raw.replace(/,/g, ""));
  if (!Number.isFinite(value) || value <= 0) return null;
  return thousands ? value * 1000 : value;
}
