import { findSampleBand, SAMPLE_SOURCE_NOTE } from "@/lib/data/market";
import { SAMPLE_PERMITS } from "@/lib/data/listings";
import type { MarketBand } from "@/lib/domain";

export interface PermitRecord {
  permitNumber: string;
  orn: string;
  office: string;
  communityCode: string;
  status: "active";
  mode: "sample" | "live";
}

export interface TrakheesiAdapter {
  readonly id: "sample-trakheesi" | "live-trakheesi";
  readonly mode: "sample" | "live";
  lookupPermit(permitNumber: string): PermitRecord | null;
}

export interface MarketAdapter {
  readonly id: "sample-ejari" | "live-dubai-pulse";
  readonly mode: "sample" | "live";
  readonly sourceNote: string;
  getBand(query: {
    communityCode: string;
    beds: number;
    furnished: boolean;
  }): MarketBand | null;
}

export interface PreparedPack {
  system: "ejari" | "dewa";
  mode: "prepared-pack";
  title: string;
  submitVia: string;
  items: { id: string; label: string; note: string }[];
  caveat: string;
}

export interface RegistrationAdapter {
  readonly system: "ejari" | "dewa";
  readonly mode: "prepared-pack";
  prepare(): PreparedPack;
}

const sampleTrakheesi: TrakheesiAdapter = {
  id: "sample-trakheesi",
  mode: "sample",
  lookupPermit(permitNumber) {
    const row = SAMPLE_PERMITS[permitNumber.trim()];
    if (!row) return null;
    return { permitNumber: permitNumber.trim(), ...row, mode: "sample" };
  },
};

const liveTrakheesi: TrakheesiAdapter = {
  id: "live-trakheesi",
  mode: "live",
  lookupPermit() {
    throw new Error(
      "Trakheesi live lookup is not wired. DLD access is for licensed entities. Keep TRAKHEESI_ADAPTER=sample until a brokerage credential is available.",
    );
  },
};

const sampleMarket: MarketAdapter = {
  id: "sample-ejari",
  mode: "sample",
  sourceNote: SAMPLE_SOURCE_NOTE,
  getBand(query) {
    return findSampleBand(query.communityCode, query.beds, query.furnished);
  },
};

const liveMarket: MarketAdapter = {
  id: "live-dubai-pulse",
  mode: "live",
  sourceNote: "Live Dubai Pulse adapter is not implemented.",
  getBand() {
    throw new Error(
      "Dubai Pulse live market adapter is not implemented. Unset MARKET_ADAPTER or set it to sample.",
    );
  },
};

export function getTrakheesiAdapter(): TrakheesiAdapter {
  if (process.env.TRAKHEESI_ADAPTER === "live") return liveTrakheesi;
  return sampleTrakheesi;
}

export function getMarketAdapter(): MarketAdapter {
  if (process.env.MARKET_ADAPTER === "live") return liveMarket;
  return sampleMarket;
}

export const ejariAdapter: RegistrationAdapter = {
  system: "ejari",
  mode: "prepared-pack",
  prepare() {
    return {
      system: "ejari",
      mode: "prepared-pack",
      title: "Ejari registration pack",
      submitVia: "A person submits this on Dubai REST or at a trustee centre. There is no public Ejari API on this pilot.",
      caveat: "Confirm the current registration fee in Dubai REST before anyone pays. Guides in 2026 cite about AED 178 online and a higher fee at a trustee centre.",
      items: [
        { id: "contract", label: "Signed unified tenancy contract", note: "Names, unit, rent, dates, and cheque schedule must match the IDs and the title deed." },
        { id: "title", label: "Title deed or Oqood, as applicable", note: "The owner name should match the landlord on the contract." },
        { id: "ids", label: "Passport, visa, and Emirates ID", note: "Tenant copies. Do not store the numbers in this app." },
        { id: "premise", label: "DEWA premise number", note: "Often printed at the door. Nine digits. It is not the contract account number." },
        { id: "landlord-id", label: "Landlord identity", note: "Passport or Emirates ID, or the company documents if the landlord is a company." },
      ],
    };
  },
};

export const dewaAdapter: RegistrationAdapter = {
  system: "dewa",
  mode: "prepared-pack",
  prepare() {
    return {
      system: "dewa",
      mode: "prepared-pack",
      title: "DEWA move-in pack",
      submitVia: "DEWA creates many tenant move-ins from Ejari, then the tenant pays the deposit. There is no public DEWA API on this pilot.",
      caveat: "DEWA's move-in page has published a refundable apartment deposit of AED 2,000 (AED 4,000 for a villa) plus an activation fee around AED 155. Confirm both on dewa.gov.ae before payment.",
      items: [
        { id: "ejari", label: "Ejari number", note: "DEWA's own guidance: a valid Ejari lets the online move-in prefill, without uploading the tenancy contract again." },
        { id: "deposit", label: "Security deposit and activation", note: "Pay through a DEWA channel. The welcome email or SMS carries the account when Ejari triggers move-in." },
        { id: "cooling", label: "District cooling, if the building has it", note: "Parts of JVC bill cooling separately from DEWA. Ask the concierge which provider, and budget a separate deposit." },
        { id: "housing", label: "Housing fee", note: "Dubai Municipality's housing fee is commonly 5% of annual rent, collected on the DEWA bill. Confirm the line when the first bill arrives." },
      ],
    };
  },
};
