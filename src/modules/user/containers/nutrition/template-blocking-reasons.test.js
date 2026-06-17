import { describe, expect, it } from "vitest";
import {
  getTemplateBlockingErrorMessage,
  getTemplateBlockingReasonSummary,
} from "./template-blocking-reasons.js";

describe("template blocking reason labels", () => {
  it("summarizes multiple restriction conflicts in Uzbek", () => {
    expect(
      getTemplateBlockingReasonSummary({
        isCompatible: false,
        blockingReasons: [
          { type: "disliked_food", foodName: "Manti" },
          { type: "avoided_ingredient", ingredientName: "Yong'oq" },
          { type: "excluded_allergen_tag", tag: "gluten" },
          { type: "empty_or_zero_calorie_day", dayKey: "day-3" },
        ],
      }),
    ).toBe(
      "Mos emas: Manti yoqtirilmagan ovqatlar ro'yxatida bor. Mos emas: Yong'oq allergiya yoki cheklovlarda bor. Mos emas: gluten diet chekloviga zid. Yana 1 ta conflict bor.",
    );
  });

  it("extracts backend blocking reasons from failed activation responses", () => {
    const error = {
      response: {
        data: {
          message: {
            blockingReasons: [
              { type: "avoided_ingredient", ingredientName: "Yong'oq" },
            ],
          },
        },
      },
    };

    expect(getTemplateBlockingErrorMessage(error, "Fallback")).toBe(
      "Mos emas: Yong'oq allergiya yoki cheklovlarda bor.",
    );
  });

  it("deduplicates malformed backend reasons before building the summary", () => {
    expect(
      getTemplateBlockingReasonSummary({
        isCompatible: false,
        blockingReasons: [
          { type: "disliked_food", foodName: " Manti " },
          { type: "disliked_food", foodName: "Manti" },
          { type: "avoided_ingredient", ingredientName: "   " },
          { type: "unknown_reason", name: "legacy" },
          null,
        ],
      }),
    ).toBe("Mos emas: Manti yoqtirilmagan ovqatlar ro'yxatida bor.");
  });
});
