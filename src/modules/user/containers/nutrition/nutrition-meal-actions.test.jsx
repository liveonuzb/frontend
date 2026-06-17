import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const toastMock = vi.hoisted(() => {
  const fn = vi.fn();
  fn.success = vi.fn();
  fn.error = vi.fn();
  return fn;
});

vi.mock("sonner", () => ({
  toast: toastMock,
}));

import {
  buildCopyToTodayPayload,
  buildMealImagePatch,
  buildMealTransferPayload,
  buildPlannedMealPayload,
  useNutritionMealActions,
} from "./nutrition-meal-actions.js";

describe("nutrition meal action helpers", () => {
  it("builds transfer payloads without carrying local meal state flags", () => {
    const payload = buildMealTransferPayload(
      {
        id: "food-1",
        name: "Soup",
        isConsumed: true,
        isFromPlanLinked: true,
        isPlanned: true,
      },
      "2026-06-03",
    );

    expect(payload).toMatchObject({
      name: "Soup",
      source: "manual",
    });
    expect(payload.id).toBeUndefined();
    expect(payload.isConsumed).toBeUndefined();
    expect(payload.isFromPlanLinked).toBeUndefined();
    expect(payload.isPlanned).toBeUndefined();
    expect(payload.addedAt).toContain("2026-06-03T");
  });

  it("builds planned meal and image update payloads", () => {
    expect(
      buildPlannedMealPayload(
        {
          name: "Chicken bowl",
          grams: 180,
          cal: 400,
          protein: 30,
        },
        {
          grams: 220,
          macros: {
            cal: 480,
            protein: 38,
            carbs: 42,
            fat: 14,
          },
          image: "data:image/png;base64,test",
        },
      ),
    ).toMatchObject({
      source: "meal-plan",
      addedFromPlan: true,
      grams: 220,
      cal: 480,
      protein: 38,
      image: "data:image/png;base64,test",
      ingredients: [],
    });

    expect(
      buildMealImagePatch({
        imageDataUrl: "data:image/png;base64,test",
        adjustedGrams: 150,
        macros: { cal: 330, protein: 20, carbs: 31, fat: 11 },
      }),
    ).toEqual({
      image: "data:image/png;base64,test",
      source: "camera",
      grams: 150,
      cal: 330,
      protein: 20,
      carbs: 31,
      fat: 11,
    });
  });

  it("builds copy-to-today payloads without persisted IDs", () => {
    const payload = buildCopyToTodayPayload({
      id: "history-1",
      name: "Oats",
      addedAt: "2026-06-02T08:00:00.000Z",
      isConsumed: true,
      isFromPlanLinked: true,
    });

    expect(payload).toMatchObject({
      name: "Oats",
      source: "history-copy",
    });
    expect(payload.id).toBeUndefined();
    expect(payload.addedAt).toBeUndefined();
    expect(payload.isConsumed).toBeUndefined();
    expect(payload.isFromPlanLinked).toBeUndefined();
  });
});

describe("useNutritionMealActions", () => {
  it("confirms meal moves through add, remove and close actions", async () => {
    const addMealAction = vi.fn().mockResolvedValue(undefined);
    const removeMealAction = vi.fn().mockResolvedValue(undefined);
    const setMealTransferContext = vi.fn();
    const { result } = renderHook(() =>
      useNutritionMealActions({
        addMealAction,
        addWaterCup: vi.fn(),
        date: new Date("2026-06-03T12:00:00"),
        dateKey: "2026-06-03",
        mealTransferContext: {
          sourceDate: "2026-06-03",
          sourceMealType: "breakfast",
        },
        meals: { breakfast: [] },
        patchMeal: vi.fn(),
        refetchYesterday: vi.fn(),
        removeMealAction,
        setMealTransferContext,
        todayKey: "2026-06-03",
      }),
    );

    await act(async () => {
      await result.current.handleConfirmMealTransfer({
        mode: "move",
        food: { id: "food-1", name: "Soup" },
        targetDate: "2026-06-04",
        targetMealType: "dinner",
      });
    });

    expect(addMealAction).toHaveBeenCalledWith(
      "2026-06-04",
      "dinner",
      expect.objectContaining({
        id: undefined,
        name: "Soup",
        source: "manual",
      }),
    );
    expect(removeMealAction).toHaveBeenCalledWith(
      "2026-06-03",
      "breakfast",
      "food-1",
    );
    expect(setMealTransferContext).toHaveBeenCalledWith(null);
  });

  it("patches image updates through the current date", () => {
    const patchMeal = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useNutritionMealActions({
        addMealAction: vi.fn(),
        addWaterCup: vi.fn(),
        date: new Date("2026-06-03T12:00:00"),
        dateKey: "2026-06-03",
        mealTransferContext: null,
        meals: { breakfast: [] },
        patchMeal,
        refetchYesterday: vi.fn(),
        removeMealAction: vi.fn(),
        setMealTransferContext: vi.fn(),
        todayKey: "2026-06-03",
      }),
    );

    act(() => {
      result.current.handleMealImageUpload(
        "lunch",
        "food-1",
        "data:image/png;base64,test",
      );
    });

    expect(patchMeal).toHaveBeenCalledWith("2026-06-03", "lunch", "food-1", {
      image: "data:image/png;base64,test",
      source: "camera",
    });
  });
});
