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
import { useDailyTrackingActions } from "./use-daily-tracking.js";

const createWrapper = (queryClient) =>
  function QueryWrapper({ children }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

describe("useDailyTrackingActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.invalidateGamificationQueries.mockResolvedValue(undefined);
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

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: getNutritionDashboardQueryKey("2026-05-31"),
    });
  });
});
