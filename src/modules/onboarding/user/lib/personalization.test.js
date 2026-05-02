import { describe, expect, it, vi } from "vitest";
import {
  buildPersonalizationPatch,
  clampProgress,
  formatWeightDelta,
  getMacroBalanceMessage,
  normalizeCustomEquipment,
  normalizeEquipmentIds,
} from "./personalization";

describe("post-onboarding personalization helpers", () => {
  it("normalizes equipment ids and custom equipment for patch payloads", () => {
    expect(
      buildPersonalizationPatch("equipment", {
        equipmentIds: ["1", 1, "bad", 2, 0],
        customEquipment: [" Gantel ", "gantel", "", "Yoga mat"],
      }),
    ).toEqual({
      equipmentIds: [1, 2],
      customEquipment: ["Gantel", "Yoga mat"],
    });
  });

  it("keeps numeric edit payloads numeric and ignores blank values", () => {
    expect(buildPersonalizationPatch("dailyCalories", "2100")).toEqual({
      dailyCalories: 2100,
    });
    expect(buildPersonalizationPatch("dailyCalories", "")).toEqual({});
    expect(buildPersonalizationPatch("workoutLocation", "gym")).toEqual({
      workoutLocation: "gym",
    });
  });

  it("dedupes equipment values case-insensitively", () => {
    expect(normalizeEquipmentIds(["3", 3, "4", -1])).toEqual([3, 4]);
    expect(normalizeCustomEquipment([" Bands ", "bands", " Mat "])).toEqual([
      "Bands",
      "Mat",
    ]);
  });

  it("formats progress, weight deltas, and macro balance messages", () => {
    expect(clampProgress(140)).toBe(100);
    expect(clampProgress(-4)).toBe(0);
    expect(formatWeightDelta(-16.24)).toBe("-16.2 kg");
    expect(formatWeightDelta(5)).toBe("+5 kg");

    const t = vi.fn((key, values) => `${key}:${values?.value ?? ""}`);
    expect(
      getMacroBalanceMessage(
        {
          dailyCalories: 2000,
          proteinGram: 140,
          carbsGram: 200,
          fatGram: 70,
        },
        t,
      ),
    ).toBe("onboarding.postOnboarding.result.balanceGood:");
  });
});
