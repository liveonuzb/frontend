import { describe, expect, it } from "vitest";
import {
  ONBOARDING_NUMERIC_PICKER_PAGE_CLASS,
  ONBOARDING_NUMERIC_PICKER_TICKER_CLASS,
} from "./numeric-picker-layout.js";

describe("numeric picker layout", () => {
  it("reserves room on the right and anchors the vertical slider to the bottom-right wall", () => {
    expect(ONBOARDING_NUMERIC_PICKER_PAGE_CLASS).toContain("pr-0");
    expect(ONBOARDING_NUMERIC_PICKER_PAGE_CLASS).not.toContain("pr-[92px]");
    expect(ONBOARDING_NUMERIC_PICKER_PAGE_CLASS).not.toContain("md:pr-[112px]");
    expect(ONBOARDING_NUMERIC_PICKER_PAGE_CLASS).not.toContain("pl-[112px]");
    expect(ONBOARDING_NUMERIC_PICKER_TICKER_CLASS).toContain("right-0");
    expect(ONBOARDING_NUMERIC_PICKER_TICKER_CLASS).toContain("bottom-0");
    expect(ONBOARDING_NUMERIC_PICKER_TICKER_CLASS).not.toContain("top-1/2");
    expect(ONBOARDING_NUMERIC_PICKER_TICKER_CLASS).not.toContain(
      "-translate-y-1/2",
    );
    expect(ONBOARDING_NUMERIC_PICKER_TICKER_CLASS).not.toContain("left-0");
    expect(ONBOARDING_NUMERIC_PICKER_TICKER_CLASS).not.toContain("left-4");
  });
});
