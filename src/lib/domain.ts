export type TrustBand = "trusted" | "review" | "caution" | "avoid";

export type CheckStatus = "pass" | "warn" | "fail";

export interface TrustCheck {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
}

export interface TrustFlag {
  code: string;
  severity: "critical" | "warning" | "note";
  title: string;
  detail: string;
}

export interface TrustInput {
  permitNumber: string | null;
  permitFormatValid: boolean;
  permitInRegistry: boolean;
  orn: string | null;
  ornFormatValid: boolean;
  brn: string | null;
  brnFormatValid: boolean;
  priceAnnualAed: number;
  marketMedianAnnualAed: number | null;
  marketLabel: string | null;
  asksUpfrontBeforeViewing: boolean;
  refusesEjari: boolean;
  personalAccountOnly: boolean;
  socialOnly: boolean;
  pressureToDecide: boolean;
}

export interface TrustResult {
  score: number;
  band: TrustBand;
  bandLabel: string;
  flags: TrustFlag[];
  checks: TrustCheck[];
  summary: string;
}

export interface MarketBand {
  communityCode: string;
  beds: number;
  furnished: boolean;
  medianAnnualAed: number;
  p25AnnualAed: number;
  p75AnnualAed: number;
  sampleContracts: number;
  period: string;
  sourceNote: string;
}

export type PricePosition = "way_below" | "below" | "within" | "above" | "unknown";

export interface PriceComparison {
  annualAed: number;
  monthlyAed: number;
  medianAnnualAed: number | null;
  p25AnnualAed: number | null;
  p75AnnualAed: number | null;
  deltaPct: number | null;
  position: PricePosition;
  period: string | null;
  sampleContracts: number | null;
  sourceNote: string;
  label: string;
}

export interface Listing {
  id: string;
  title: string;
  community: string;
  communityCode: string;
  building: string;
  buildingYear: number;
  beds: number;
  baths: number;
  sizeSqft: number;
  furnished: boolean;
  amenities: string[];
  priceMonthlyAed: number;
  permitNumber: string | null;
  madmounQr: boolean;
  office: string;
  orn: string | null;
  brn: string | null;
  asksUpfrontBeforeViewing: boolean;
  refusesEjari: boolean;
  personalAccountOnly: boolean;
  socialOnly: boolean;
  pressureToDecide: boolean;
  blurb: string;
}

export interface RentalIntent {
  raw: string;
  communityCode: string | null;
  communityName: string | null;
  beds: number | null;
  furnished: boolean | null;
  budgetMonthlyAed: number | null;
  budgetAnnualAed: number | null;
  wantsNewer: boolean;
  amenities: string[];
  gaps: string[];
}

export interface ListingCardModel {
  id: string;
  title: string;
  community: string;
  communityCode: string;
  building: string;
  buildingYear: number;
  beds: number;
  baths: number;
  sizeSqft: number;
  furnished: boolean;
  amenities: string[];
  priceMonthlyAed: number;
  priceAnnualAed: number;
  permitNumber: string | null;
  orn: string | null;
  brn: string | null;
  office: string;
  blurb: string;
  matchReasons: string[];
  warningInclusion: boolean;
  trust: TrustResult;
  price: PriceComparison;
}

export interface ScheduleLine {
  id: string;
  kind: "rent" | "deposit" | "commission" | "ejari" | "dewa" | "cooling" | "housing";
  label: string;
  amountAed: number | null;
  due: string | null;
  refundable: boolean;
  note: string;
}

export interface ChequeSchedule {
  annualRentAed: number;
  chequeCount: number;
  furnished: boolean;
  startDate: string;
  lines: ScheduleLine[];
  assumptions: string[];
}

export type DocumentStatus = "missing" | "prepared" | "ready_to_submit" | "not_applicable";

export interface DealDocument {
  id: string;
  label: string;
  holder: string;
  status: DocumentStatus;
  note: string;
}

export interface DealCheck {
  id: string;
  stageId: string;
  label: string;
  detail: string;
  done: boolean;
}

export interface DealRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  renterLabel: string;
  listingId: string;
  listing: ListingCardModel;
  stageOrder: string[];
  checks: DealCheck[];
  documents: DealDocument[];
  schedule: ChequeSchedule;
}

export type LlmKind = "mock" | "openai" | "anthropic";

export interface GuidanceBlock {
  stageId: string;
  title: string;
  intro: string;
  items: { id: string; label: string; detail: string }[];
}

export interface AgentResult {
  kind: "search" | "guidance" | "clarify" | "deal";
  narrative: string;
  listings: ListingCardModel[];
  intent: RentalIntent | null;
  llm: LlmKind;
  dataMode: "sample";
  dealId?: string;
  guidance?: GuidanceBlock;
}

export interface AgentStep {
  id: string;
  label: string;
  detail: string;
  status: "running" | "complete";
}

export type AgentEvent =
  | { type: "step"; step: AgentStep }
  | { type: "result"; result: AgentResult }
  | { type: "error"; message: string };
