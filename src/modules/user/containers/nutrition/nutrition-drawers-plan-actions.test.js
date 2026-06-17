import { describe, expect, it } from "vitest";
import { getPlanActionImpactCopy } from "./nutrition-drawers.jsx";

describe("plan action impact copy", () => {
  it("explains pause, duplicate, and archive impact", () => {
    expect(getPlanActionImpactCopy("pause")).toContain("qoralama");
    expect(getPlanActionImpactCopy("pause")).toContain("start date");

    expect(getPlanActionImpactCopy("duplicate")).toContain("yangi qoralama");
    expect(getPlanActionImpactCopy("duplicate")).toContain("faol reja");

    expect(getPlanActionImpactCopy("archive")).toContain("Arxivlangan");
    expect(getPlanActionImpactCopy("archive")).toContain("bugungi reja");
  });
});
