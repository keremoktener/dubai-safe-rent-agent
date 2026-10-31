import type { DealCheck, DealDocument, GuidanceBlock } from "@/lib/domain";

export interface StageDefinition {
  id: string;
  title: string;
  kicker: string;
  intro: string;
  items: { id: string; label: string; detail: string }[];
}

export const STAGES: StageDefinition[] = [
  {
    id: "viewing",
    title: "Viewing",
    kicker: "Before any transfer",
    intro: "See the home, and match it to the permit, before anyone talks about holding money.",
    items: [
      {
        id: "view-permit",
        label: "Match the permit to the unit you are standing in",
        detail: "Read the Trakheesi number on the listing and scan the Madmoun QR if it is printed. The building, unit, and size should be the same home.",
      },
      {
        id: "view-person",
        label: "Meet a licensed broker, at the property",
        detail: "Ask for the office name, ORN, and the broker's BRN. A cafe meeting with no visit is not a viewing.",
      },
      {
        id: "view-title",
        label: "Ask who owns it",
        detail: "Request a title deed copy. The landlord's name should be the name that will appear on the contract.",
      },
      {
        id: "view-premise",
        label: "Note the DEWA premise number",
        detail: "It is often on the door. Nine digits. You will need it for Ejari. It is different from a contract account.",
      },
      {
        id: "view-condition",
        label: "Photograph the condition",
        detail: "AC, leaks, appliances, and furniture if the home is furnished. These photos support the inventory and the deposit return.",
      },
      {
        id: "view-cooling",
        label: "Ask what the rent does not include",
        detail: "In much of JVC, district cooling is billed separately from DEWA. Parking bay, chiller, and service charges should be explicit.",
      },
      {
        id: "view-no-pay",
        label: "Do not pay to hold the unit",
        detail: "Dubai Police warn against booking deposits, documentation fees, and insurance collected before a viewing and a contract.",
      },
    ],
  },
  {
    id: "offer",
    title: "Offer",
    kicker: "Negotiation",
    intro: "The number of cheques is the main lever. Put the offer in writing.",
    items: [
      {
        id: "offer-band",
        label: "Anchor on the sample band, then ask what is different",
        detail: "A home inside the band is not automatically fair, and a home under it is not automatically a find. Use the comparison as the opening question.",
      },
      {
        id: "offer-cheques",
        label: "Trade cheque count deliberately",
        detail: "One cheque often buys a lower rent. Four cheques is the familiar quarterly pattern. Twelve can cost more. Fewer cheques only help if the account can fund them.",
      },
      {
        id: "offer-inclusions",
        label: "Name inclusions in the offer",
        detail: "Chiller, maintenance threshold, parking, and the furnished inventory. Service charges stay with the landlord.",
      },
      {
        id: "offer-written",
        label: "Send the offer in writing",
        detail: "Annual rent, cheque dates, start date, deposit, and anything to be repaired before handover.",
      },
    ],
  },
  {
    id: "contract",
    title: "Contract",
    kicker: "Unified tenancy contract",
    intro: "Dubai uses a standard tenancy contract. Read it against the IDs and the title deed. This is a checklist, not legal advice.",
    items: [
      {
        id: "contract-names",
        label: "Names match the identity documents",
        detail: "Tenant and landlord names, and the landlord's title deed number. No blank fields.",
      },
      {
        id: "contract-unit",
        label: "Unit, parking, and premise number are filled in",
        detail: "The home you viewed is the home on the page, including the parking bay.",
      },
      {
        id: "contract-money",
        label: "Rent, deposit, and cheque dates agree with the offer",
        detail: "The deposit is not rent. Its amount and the conditions for its return should be written down.",
      },
      {
        id: "contract-repairs",
        label: "Maintenance split is specific",
        detail: "Minor repairs are often capped per incident in the contract. Structural and major repairs sit with the landlord. Do not leave this as a verbal aside.",
      },
      {
        id: "contract-exit",
        label: "Early termination is a number, not a surprise",
        detail: "Notice period and penalty. Two months' rent is a common commercial ask. Agree it before signing.",
      },
      {
        id: "contract-inventory",
        label: "Furnished inventory attached",
        detail: "List furniture and appliances. Both sides sign it with the condition photos.",
      },
    ],
  },
  {
    id: "ejari",
    title: "Ejari",
    kicker: "Prepared for a person to file",
    intro: "Ejari has no public API on this pilot. The pack below is what a person takes to Dubai REST or a trustee centre.",
    items: [
      {
        id: "ejari-contract",
        label: "Signed contract, original",
        detail: "Registration needs the signed lease. A draft is not enough.",
      },
      {
        id: "ejari-title",
        label: "Title deed copy",
        detail: "Owner name and property details should match the contract.",
      },
      {
        id: "ejari-ids",
        label: "Passport, visa, and Emirates ID",
        detail: "Keep the files with the tenant. This app stores a status, not the document and not the number.",
      },
      {
        id: "ejari-premise",
        label: "DEWA premise number",
        detail: "Required on the registration. Confirm the nine digits against the door.",
      },
      {
        id: "ejari-fee",
        label: "Fee checked on the day",
        detail: "Confirm the figure in Dubai REST before paying. Do not rely on a number remembered from a blog.",
      },
    ],
  },
  {
    id: "dewa",
    title: "DEWA",
    kicker: "Move-in",
    intro: "Once Ejari exists, DEWA often opens the move-in from that record. This pilot prepares the steps. It does not call DEWA.",
    items: [
      {
        id: "dewa-ejari",
        label: "Wait for the Ejari number",
        detail: "DEWA's guidance: with a valid Ejari, the online move-in can prefill and does not ask for the tenancy contract again.",
      },
      {
        id: "dewa-message",
        label: "Watch for the DEWA welcome message",
        detail: "A correct email and mobile on Ejari are how the contract account arrives. If it does not, apply on dewa.gov.ae or the DEWA app with the Ejari number.",
      },
      {
        id: "dewa-deposit",
        label: "Pay the DEWA deposit through DEWA",
        detail: "Published apartment deposit AED 2,000, villa AED 4,000, plus an activation fee. Confirm the amount on the official page. The deposit is refundable.",
      },
      {
        id: "dewa-cooling",
        label: "Open district cooling if the building uses it",
        detail: "A DEWA account does not switch on Empower or another cooling provider. Ask the building.",
      },
    ],
  },
  {
    id: "payments",
    title: "Payments",
    kicker: "Deposit and cheques",
    intro: "Pay the landlord or the brokerage's client account named in the contract, after the papers match. Not before, and not to a personal account from a social profile.",
    items: [
      {
        id: "pay-channel",
        label: "Confirm the account name",
        detail: "It should be the landlord or the licensed brokerage. Walk away from a personal account.",
      },
      {
        id: "pay-cheques",
        label: "Cheques match the schedule",
        detail: "Amounts, dates, and the number of cheques. Keep copies.",
      },
      {
        id: "pay-deposit",
        label: "Deposit receipt is separate from rent",
        detail: "The receipt should say security deposit and state that it is refundable, subject to the contract.",
      },
      {
        id: "pay-commission",
        label: "Commission matches the brokerage agreement",
        detail: "5% plus VAT is customary, not automatic. The lease brokerage agreement is the rental file's engagement, not Form F.",
      },
    ],
  },
];

export const BROKER_DOCUMENTS: Omit<DealDocument, "status">[] = [
  {
    id: "passport",
    label: "Passport",
    holder: "Tenant",
    note: "Status only. Do not type the passport number into this app.",
  },
  {
    id: "visa",
    label: "Residence visa",
    holder: "Tenant",
    note: "Status only. The copy stays with the tenant or the brokerage's own controlled file.",
  },
  {
    id: "emirates_id",
    label: "Emirates ID",
    holder: "Tenant",
    note: "Status only. Emirates ID numbers are personal data under the PDPL.",
  },
  {
    id: "title_deed",
    label: "Title deed copy",
    holder: "Landlord",
    note: "Used to match the owner to the contract before Ejari.",
  },
  {
    id: "premise",
    label: "DEWA premise number",
    holder: "Unit",
    note: "Nine digits, usually at the door. This is a property identifier, not a person's ID.",
  },
  {
    id: "tenancy",
    label: "Unified tenancy contract",
    holder: "Both parties",
    note: "The rental contract. Both sides sign. No blank commercial terms.",
  },
  {
    id: "brokerage",
    label: "Lease brokerage agreement",
    holder: "Broker and tenant",
    note: "Records who pays the commission. This is the rental engagement.",
  },
  {
    id: "form_f",
    label: "Form F, sales memorandum",
    holder: "Not used for this rental",
    note: "Form F is the sales memorandum between buyer and seller. A standard residential rental does not use it. It stays on the desk list so it is not confused with the tenancy contract.",
  },
];

export function initialChecks(): DealCheck[] {
  return STAGES.flatMap((stage) =>
    stage.items.map((item) => ({
      id: item.id,
      stageId: stage.id,
      label: item.label,
      detail: item.detail,
      done: false,
    })),
  );
}

export function initialDocuments(): DealDocument[] {
  return BROKER_DOCUMENTS.map((doc) => ({
    ...doc,
    status: doc.id === "form_f" ? "not_applicable" : "missing",
  }));
}

export function guidanceFor(stageId: string): GuidanceBlock | null {
  const stage = STAGES.find((item) => item.id === stageId);
  if (!stage) return null;
  return {
    stageId: stage.id,
    title: stage.title,
    intro: stage.intro,
    items: stage.items,
  };
}

export function stageFromMessage(text: string): string | null {
  const lower = text.toLowerCase();
  if (/viewing|view the|before i (pay|visit)|checklist/.test(lower)) return "viewing";
  if (/negotiat|offer|cheque count|how many cheques/.test(lower)) return "offer";
  if (/contract|tenancy agreement|what do i sign/.test(lower)) return "contract";
  if (/ejari/.test(lower)) return "ejari";
  if (/dewa|move-?in|utilities|district cooling|empower/.test(lower)) return "dewa";
  if (/deposit|payment schedule|when do i pay|security deposit/.test(lower)) return "payments";
  return null;
}
