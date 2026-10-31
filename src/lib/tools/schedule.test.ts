import { describe, expect, it } from "vitest";
import { buildChequeSchedule } from "@/lib/tools/schedule";

describe("buildChequeSchedule", () => {
  it("splits annual rent across four cheques and prices the customary furnished deposit", () => {
    const schedule = buildChequeSchedule({
      annualRentAed: 88800,
      chequeCount: 4,
      furnished: true,
      startDate: "2026-12-01",
    });
    const rent = schedule.lines.filter((line) => line.kind === "rent");
    expect(rent.map((line) => line.amountAed)).toEqual([22200, 22200, 22200, 22200]);
    expect(rent.map((line) => line.due)).toEqual([
      "2026-12-01",
      "2027-03-01",
      "2027-06-01",
      "2027-09-01",
    ]);
    expect(schedule.lines.find((line) => line.id === "deposit")?.amountAed).toBe(8880);
    expect(schedule.lines.find((line) => line.id === "commission")?.amountAed).toBe(4662);
    expect(schedule.lines.find((line) => line.id === "ejari")?.amountAed).toBeNull();
    expect(schedule.lines.find((line) => line.id === "dewa")?.note.toLowerCase()).toContain("confirm");
  });

  it("uses a 5% deposit custom for an unfurnished home", () => {
    const schedule = buildChequeSchedule({
      annualRentAed: 162000,
      chequeCount: 1,
      furnished: false,
      startDate: "2026-12-01",
    });
    expect(schedule.lines.filter((line) => line.kind === "rent")).toHaveLength(1);
    expect(schedule.lines.find((line) => line.kind === "rent")?.amountAed).toBe(162000);
    expect(schedule.lines.find((line) => line.id === "deposit")?.amountAed).toBe(8100);
  });
});
