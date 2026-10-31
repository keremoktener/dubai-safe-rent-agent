import { describe, expect, it } from "vitest";
import { parseRentalRequest } from "@/lib/intent/parse";

const JVC =
  "furnished 1BR in JVC around 7,000 AED/month, newer building with gym";

describe("parseRentalRequest", () => {
  it("reads the JVC pilot brief", () => {
    const intent = parseRentalRequest(JVC);
    expect(intent.communityCode).toBe("JVC");
    expect(intent.communityName).toBe("Jumeirah Village Circle");
    expect(intent.beds).toBe(1);
    expect(intent.furnished).toBe(true);
    expect(intent.budgetMonthlyAed).toBe(7000);
    expect(intent.budgetAnnualAed).toBe(84000);
    expect(intent.wantsNewer).toBe(true);
    expect(intent.amenities).toContain("gym");
    expect(intent.gaps).toEqual([]);
  });

  it("reads an annual Marina brief without treating 2BR as the budget", () => {
    const intent = parseRentalRequest("unfurnished 2BR in Dubai Marina under 180,000 AED a year");
    expect(intent.communityCode).toBe("MARINA");
    expect(intent.beds).toBe(2);
    expect(intent.furnished).toBe(false);
    expect(intent.budgetAnnualAed).toBe(180000);
    expect(intent.budgetMonthlyAed).toBe(15000);
    expect(intent.wantsNewer).toBe(false);
  });

  it("prefers the longer community name", () => {
    const intent = parseRentalRequest("studio in Jumeirah Village Triangle");
    expect(intent.communityCode).toBe("JVT");
    expect(intent.beds).toBe(0);
  });
});
