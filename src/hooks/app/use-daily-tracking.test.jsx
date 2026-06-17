import React from "react";
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  deleteMutateAsync: vi.fn(),
  patchMutateAsync: vi.fn(),
  postMutateAsync: vi.fn(),
  putMutateAsync: vi.fn(),
  trackCampaignConversion: vi.fn(),
  trackLaunchEvent: vi.fn(),
  invalidateGamificationQueries: vi.fn(),
}));

vi.mock("@/hooks/api", () => ({
  useDeleteQuery: () => ({ mutateAsync: mocks.deleteMutateAsync }),
  useGetQuery: vi.fn(),
  usePatchQuery: () => ({ mutateAsync: mocks.patchMutateAsync }),
  usePostQuery: () => ({ mutateAsync: mocks.postMutateAsync }),
  usePutQuery: () => ({ mutateAsync: mocks.putMutateAsync }),
}));

vi.mock("@/lib/analytics.js", () => ({
  trackCampaignConversion: (...args) => mocks.trackCampaignConversion(...args),
  trackLaunchEvent: (...args) => mocks.trackLaunchEvent(...args),
}));

vi.mock("@/modules/user/lib/gamification-query-keys", () => ({
  invalidateGamificationQueries: (...args) =>
    mocks.invalidateGamificationQueries(...args),
}));

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    error: vi.fn(),
    success: vi.fn(),
  }),
}));

import { getNutritionDashboardQueryKey } from "./use-nutrition-dashboard.js";
import { useGetQuery } from "@/hooks/api";
import {
  buildMealDuplicateKey,
  getDailyTrackingQueryKey,
  setMealDuplicateConfirmHandler,
  useDailyTrackingActions,
  useDailyTrackingDay,
  useDailyTrackingHistory,
} from "./use-daily-tracking.js";

const createWrapper = (queryClient) =>
  function QueryWrapper({ children }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

describe("useDailyTrackingActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGetQuery.mockReturnValue({ data: null, isLoading: false });
    mocks.invalidateGamificationQueries.mockResolvedValue(undefined);
  });

  it("loads daily nutrition through the canonical days route", () => {
    renderHook(() => useDailyTrackingDay("2026-06-06"));

    expect(useGetQuery).toHaveBeenCalledWith({
      url: "/user/nutrition/days/2026-06-06",
      queryProps: {
        queryKey: getDailyTrackingQueryKey("2026-06-06"),
        enabled: true,
      },
    });
  });

  it("loads history through the canonical nutrition history route", () => {
    renderHook(() =>
      useDailyTrackingHistory({
        startDate: "2026-05-01",
        endDate: "2026-05-31",
        mealType: "lunch",
      }),
    );

    expect(useGetQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/user/nutrition/history",
        params: expect.objectContaining({
          startDate: "2026-05-01",
          endDate: "2026-05-31",
          mealType: "lunch",
        }),
      }),
    );
  });

  it("updates daily summary through the canonical days route", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
        queries: { retry: false },
      },
    });
    mocks.putMutateAsync.mockResolvedValue({
      data: {
        data: {
          date: "2026-05-31",
          steps: 8200,
          waterLog: [],
        },
      },
    });

    const { result } = renderHook(() => useDailyTrackingActions(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.updateSummary("2026-05-31", { steps: 8200 });
    });

    expect(mocks.putMutateAsync).toHaveBeenCalledWith({
      url: "/user/nutrition/days/2026-05-31",
      attributes: { steps: 8200 },
    });
  });

  it("refreshes water count through the canonical days route after removing cups", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
        queries: { retry: false },
      },
    });
    queryClient.setQueryData(getDailyTrackingQueryKey("2026-05-31"), {
      data: {
        date: "2026-05-31",
        steps: 5000,
        workoutMinutes: 20,
        burnedCalories: 150,
        sleepHours: 7,
        mood: "good",
        waterLog: [
          { id: "water-1", amountMl: 250 },
          { id: "water-2", amountMl: 250 },
        ],
      },
    });
    mocks.putMutateAsync.mockResolvedValue({
      data: {
        data: {
          date: "2026-05-31",
          steps: 5000,
          workoutMinutes: 20,
          burnedCalories: 150,
          sleepHours: 7,
          mood: "good",
          waterLog: [{ id: "water-1", amountMl: 250 }],
        },
      },
    });

    const { result } = renderHook(() => useDailyTrackingActions(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.setWaterCups("2026-05-31", 1);
    });

    expect(mocks.deleteMutateAsync).toHaveBeenCalledWith({
      url: "/user/nutrition/tracking/2026-05-31/water/water-2",
    });
    expect(mocks.putMutateAsync).toHaveBeenCalledWith({
      url: "/user/nutrition/days/2026-05-31",
      attributes: {
        steps: 5000,
        workoutMinutes: 20,
        burnedCalories: 150,
        sleepHours: 7,
        mood: "good",
      },
    });
  });

  it("builds stable duplicate keys by saved meal, catalog food and fallback name", () => {
    expect(
      buildMealDuplicateKey(
        { savedMealId: "saved-1", name: "Tuxum", grams: 120 },
        "breakfast",
      ),
    ).toBe("saved:breakfast:saved-1");
    expect(
      buildMealDuplicateKey(
        { catalogFoodId: 11, barcode: "real-barcode", grams: "200" },
        "lunch",
      ),
    ).toBe("catalog:lunch:11:200");
    expect(
      buildMealDuplicateKey({ barcode: "food:12", grams: 150 }, "lunch"),
    ).toBe("catalog:lunch:12:150");
    expect(
      buildMealDuplicateKey({ name: "  Palov  ", grams: 200 }, "dinner"),
    ).toBe("name:dinner:palov:200");
  });

  it("invalidates the nutrition dashboard after logging a meal", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
        queries: { retry: false },
      },
    });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    mocks.postMutateAsync.mockResolvedValue({
      data: {
        data: {
          date: "2026-05-31",
          meals: {
            breakfast: [
              {
                id: "meal-1",
                name: "Tuxum",
                calories: 120,
                protein: 8,
                carbs: 1,
                fat: 9,
              },
            ],
          },
          waterLog: [],
        },
      },
    });

    const { result } = renderHook(() => useDailyTrackingActions(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.addMeal("2026-05-31", "breakfast", {
        name: "Tuxum",
        cal: 120,
        protein: 8,
        carbs: 1,
        fat: 9,
      });
    });

    expect(mocks.postMutateAsync).toHaveBeenCalledWith({
      url: "/user/nutrition/meals",
      attributes: {
        date: "2026-05-31",
        mealType: "breakfast",
        source: null,
        savedMealId: null,
        name: "Tuxum",
        barcode: null,
        calories: 120,
        protein: 8,
        carbs: 1,
        fat: 9,
        fiber: 0,
        quantity: 1,
        imageUrl: null,
        addedAt: undefined,
      },
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: getNutritionDashboardQueryKey("2026-05-31"),
    });
    expect(mocks.trackLaunchEvent).toHaveBeenCalledWith(
      "nutrition_meal_logged",
      {
        source: "app",
        properties: expect.objectContaining({
          date: "2026-05-31",
          mealType: "breakfast",
          source: null,
          itemCount: 1,
          hasSavedMeal: false,
          hasIngredientSnapshot: false,
        }),
      },
    );
  });

  it("blocks duplicate meal logging by catalog food and grams when user declines", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
        queries: { retry: false },
      },
    });
    queryClient.setQueryData(getDailyTrackingQueryKey("2026-05-31"), {
      data: {
        date: "2026-05-31",
        meals: {
          lunch: [
            {
              id: "meal-1",
              catalogFoodId: 11,
              name: "Palov",
              grams: 220,
              calories: 520,
            },
          ],
        },
        waterLog: [],
      },
    });
    const confirmDuplicate = vi.fn().mockResolvedValue(false);
    const cleanup = setMealDuplicateConfirmHandler(confirmDuplicate);

    try {
      const { result } = renderHook(() => useDailyTrackingActions(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.addMeal("2026-05-31", "lunch", {
          catalogFoodId: 11,
          name: "Osh",
          grams: 220,
          cal: 520,
        });
      });
    } finally {
      cleanup();
    }

    expect(confirmDuplicate).toHaveBeenCalledWith(
      expect.objectContaining({
        dateKey: "2026-05-31",
        mealType: "lunch",
        food: expect.objectContaining({
          catalogFoodId: 11,
          grams: 220,
        }),
      }),
    );
    expect(mocks.postMutateAsync).not.toHaveBeenCalled();
  });

  it("logs meal batches through the canonical meals batch route", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
        queries: { retry: false },
      },
    });
    mocks.postMutateAsync.mockResolvedValue({
      data: {
        data: {
          date: "2026-05-31",
          meals: { lunch: [] },
          waterLog: [],
        },
      },
    });

    const { result } = renderHook(() => useDailyTrackingActions(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.addMealsBatch("2026-05-31", [
        {
          mealType: "lunch",
          food: {
            name: "Mastava",
            cal: 280,
            protein: 12,
            carbs: 36,
            fat: 8,
          },
        },
      ]);
    });

    expect(mocks.postMutateAsync).toHaveBeenCalledWith({
      url: "/user/nutrition/meals/batch",
      attributes: {
        date: "2026-05-31",
        items: [
          expect.objectContaining({
            mealType: "lunch",
            name: "Mastava",
            calories: 280,
          }),
        ],
      },
    });
  });

  it("copies meals through canonical body params", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
        queries: { retry: false },
      },
    });
    mocks.postMutateAsync.mockResolvedValue({
      data: {
        data: {
          date: "2026-06-01",
          meals: { dinner: [] },
          waterLog: [],
        },
      },
    });

    const { result } = renderHook(() => useDailyTrackingActions(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.copyMeals({
        from: "2026-05-31",
        to: "2026-06-01",
        mealType: "dinner",
      });
    });

    expect(mocks.postMutateAsync).toHaveBeenCalledWith({
      url: "/user/nutrition/meals/copy",
      attributes: {
        from: "2026-05-31",
        to: "2026-06-01",
        mealType: "dinner",
      },
    });
  });

  it("updates meal items through the canonical meal item route", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
        queries: { retry: false },
      },
    });
    mocks.patchMutateAsync.mockResolvedValue({
      data: {
        data: {
          date: "2026-05-31",
          meals: { snack: [{ id: "meal-1", quantity: 2 }] },
          waterLog: [],
        },
      },
    });

    const { result } = renderHook(() => useDailyTrackingActions(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.patchMeal("2026-05-31", "snack", "meal-1", {
        qty: 2,
      });
    });

    expect(mocks.patchMutateAsync).toHaveBeenCalledWith({
      url: "/user/nutrition/meals/meal-1",
      attributes: {
        date: "2026-05-31",
        mealType: "snack",
        quantity: 2,
      },
    });
    expect(mocks.trackLaunchEvent).toHaveBeenCalledWith(
      "nutrition_meal_edited",
      {
        source: "app",
        properties: expect.objectContaining({
          date: "2026-05-31",
          mealType: "snack",
          changedFields: ["qty"],
        }),
      },
    );
  });

  it("deletes meal items through the canonical meal item route with date params", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
        queries: { retry: false },
      },
    });
    queryClient.setQueryData(getDailyTrackingQueryKey("2026-05-31"), {
      data: {
        date: "2026-05-31",
        meals: {
          breakfast: [{ id: "meal-1", name: "Tuxum" }],
        },
        waterLog: [],
      },
    });
    mocks.deleteMutateAsync.mockResolvedValue({
      data: {
        data: {
          date: "2026-05-31",
          meals: { breakfast: [] },
          waterLog: [],
        },
      },
    });

    const { result } = renderHook(() => useDailyTrackingActions(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.removeMeal("2026-05-31", "breakfast", "meal-1");
    });

    expect(mocks.deleteMutateAsync).toHaveBeenCalledWith({
      url: "/user/nutrition/meals/meal-1",
      config: { params: { date: "2026-05-31" } },
    });
    expect(mocks.trackLaunchEvent).toHaveBeenCalledWith(
      "nutrition_meal_deleted",
      {
        source: "app",
        properties: expect.objectContaining({
          date: "2026-05-31",
          mealType: "breakfast",
        }),
      },
    );
  });
});
