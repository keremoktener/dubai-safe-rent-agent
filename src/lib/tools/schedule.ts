import type { ChequeSchedule, ScheduleLine } from "@/lib/domain";
import { addMonths } from "@/lib/format";

const CHEQUE_COUNTS = [1, 2, 4, 6, 12] as const;
export type ChequeCount = (typeof CHEQUE_COUNTS)[number];

export function isChequeCount(value: number): value is ChequeCount {
  return (CHEQUE_COUNTS as readonly number[]).includes(value);
}

/**
 * Builds a move-in money picture.
 * Agency commission and the landlord deposit are market custom, not a statutory tariff.
 * Ejari is left unpriced so a stale fee is never shown as a charge.
 * DEWA's apartment deposit follows the figure published on DEWA's move-in page.
 */
export function buildChequeSchedule(input: {
  annualRentAed: number;
  chequeCount: number;
  furnished: boolean;
  startDate: string;
}): ChequeSchedule {
  const chequeCount = isChequeCount(input.chequeCount) ? input.chequeCount : 4;
  const step = 12 / chequeCount;
  const rentEach = Math.round(input.annualRentAed / chequeCount);
  const lines: ScheduleLine[] = [];

  for (let index = 0; index < chequeCount; index += 1) {
    const amount =
      index === chequeCount - 1
        ? input.annualRentAed - rentEach * (chequeCount - 1)
        : rentEach;
    lines.push({
      id: `rent-${index + 1}`,
      kind: "rent",
      label: chequeCount === 1 ? "Rent cheque" : `Rent cheque ${index + 1} of ${chequeCount}`,
      amountAed: amount,
      due: addMonths(input.startDate, index * step),
      refundable: false,
      note: index === 0 ? "Post-dated, or the transfer named in the contract. Date only what the account can cover." : "",
    });
  }

  const depositBps = input.furnished ? 1000 : 500;
  lines.push({
    id: "deposit",
    kind: "deposit",
    label: input.furnished ? "Security deposit, furnished custom" : "Security deposit, unfurnished custom",
    amountAed: Math.round((input.annualRentAed * depositBps) / 10000),
    due: input.startDate,
    refundable: true,
    note: "Commonly 10% of annual rent if furnished and 5% if unfurnished. The law does not fix the percentage. Write the figure and the refund conditions into the contract.",
  });

  const commission = Math.round((input.annualRentAed * 500) / 10000);
  const vat = Math.round((commission * 500) / 10000);
  lines.push({
    id: "commission",
    kind: "commission",
    label: "Brokerage commission, if agreed",
    amountAed: commission + vat,
    due: input.startDate,
    refundable: false,
    note: `Customary tenant-side fee of 5% plus VAT (${commission.toLocaleString("en-AE")} + ${vat.toLocaleString("en-AE")}). It is a contract term. Agree it in the lease brokerage agreement before anyone signs.`,
  });

  lines.push({
    id: "ejari",
    kind: "ejari",
    label: "Ejari registration",
    amountAed: null,
    due: null,
    refundable: false,
    note: "Confirm the live fee in Dubai REST or at the trustee centre. This pilot does not hard-code it.",
  });

  lines.push({
    id: "dewa",
    kind: "dewa",
    label: "DEWA apartment deposit and activation",
    amountAed: 2155,
    due: null,
    refundable: false,
    note: "DEWA has published a refundable apartment deposit of AED 2,000 plus an activation fee around AED 155. The deposit is refundable; the activation fee is not. Villas differ. Confirm on dewa.gov.ae.",
  });

  lines.push({
    id: "cooling",
    kind: "cooling",
    label: "District cooling deposit",
    amountAed: null,
    due: null,
    refundable: true,
    note: "Many JVC buildings bill cooling apart from DEWA. Ask which provider, and expect a separate refundable deposit.",
  });

  lines.push({
    id: "housing",
    kind: "housing",
    label: "Municipality housing fee",
    amountAed: Math.round(input.annualRentAed * 0.05),
    due: null,
    refundable: false,
    note: "Commonly 5% of annual rent, spread across the DEWA bill rather than paid as a cheque. Confirm the line on the bill.",
  });

  return {
    annualRentAed: input.annualRentAed,
    chequeCount,
    furnished: input.furnished,
    startDate: input.startDate,
    lines,
    assumptions: [
      "Rent is the sample listing's annual figure. It is not a negotiated outcome.",
      "Cheque dates start on the lease start date and fall every " +
        (chequeCount === 1 ? "year" : `${step} months`) +
        ".",
      "Nothing here is an instruction to pay. A person checks the contract, then pays through the named channel.",
    ],
  };
}
