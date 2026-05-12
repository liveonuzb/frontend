import { describe, expect, it } from "vitest";
import {
  calculateMealCalories,
  calculateMealMacros,
  calculateWaterConsumedMl,
  getMeasurementSnapshot,
} from "./query-helpers.js";
import { normalizeDateKey as normalizeTrackingDateKey } from "@/modules/user/lib/nutrition-normalizers.js";

describe("dashboard query helpers", () => {
  it("keeps meal calorie totals finite when API values are malformed", () => {
    const total = calculateMealCalories({
      breakfast: [
        { cal: "100", qty: "2" },
        { cal: "bad", qty: 1 },
        { cal: 250, qty: null },
        { cal: -40, qty: 2 },
      ],
    });

    expect(total).toBe(450);
  });

  it("keeps macro totals finite when quantities or nutrients are malformed", () => {
    const macros = calculateMealMacros({
      lunch: [
        { protein: "30", carbs: "40", fat: "10", fiber: "5", qty: "2" },
        { protein: "nope", carbs: null, fat: -4, fiber: undefined, qty: 1 },
      ],
    });

    expect(macros).toEqual({
      protein: 60,
      carbs: 80,
      fat: 20,
      fiber: 10,
    });
  });

  it("falls back to cup size for malformed water log entries", () => {
    const consumedMl = calculateWaterConsumedMl(
      {
        waterLog: [
          { amountMl: 200 },
          { amountMl: "bad" },
          { amountMl: null },
          {},
        ],
      },
      250,
    );

    expect(consumedMl).toBe(950);
  });

  it("builds a shared measurement snapshot from history and onboarding", () => {
    const snapshot = getMeasurementSnapshot({
      history: [
        { date: "2026-05-08", weight: 85 },
        { date: "2026-05-10", weight: "83.5" },
      ],
      onboarding: {
        height: { value: "178" },
        currentWeight: { value: "86" },
        targetWeight: { value: "78" },
      },
    });

    expect(snapshot).toMatchObject({
      currentWeight: 83.5,
      previousWeight: 85,
      targetWeight: 78,
      startWeight: 85,
      heightCm: 178,
      weightChange: -1.5,
    });
    expect(snapshot.bmi).toBeCloseTo(26.35, 2);
    expect(snapshot.history).toEqual([
      { date: "2026-05-10", weight: "83.5" },
      { date: "2026-05-08", weight: 85 },
    ]);
  });

  it("uses local calendar days for daily tracking date keys", () => {
    expect(normalizeTrackingDateKey(new Date(2026, 4, 12, 0, 30))).toBe(
      "2026-05-12",
    );
  });
});
