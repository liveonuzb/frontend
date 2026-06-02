import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUseGetQuery = vi.fn();

vi.mock("@/hooks/api", () => ({
  useGetQuery: (...args) => mockUseGetQuery(...args),
}));

import {
  getNutritionDashboardQueryKey,
  normalizeNutritionDashboard,
  useNutritionDashboard,
} from "./use-nutrition-dashboard.js";

describe("useNutritionDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGetQuery.mockReturnValue({
      data: {
        data: {
          date: "2026-05-31",
          calories: {
            current: "1050",
            target: "2000",
            remaining: "950",
            percent: "53",
          },
          macros: {
            protein: { current: "65", target: "120", percent: "54" },
          },
          water: {
            currentMl: "1500",
            targetMl: "2500",
            percent: "60",
          },
          meals: {
            completed: "2",
            total: "4",
            byType: {
              breakfast: { count: "1", calories: "400" },
            },
          },
          activePlan: { id: "plan-1", status: "active" },
          feedback: { items: [{ id: "dashboard-low-water" }] },
          streak: { currentDays: "2", bestDays: "5" },
          quickActions: [{ id: "add-meal" }],
        },
      },
      isLoading: false,
    });
  });

  it("loads dashboard data from the dedicated nutrition endpoint", () => {
    const { result } = renderHook(() =>
      useNutritionDashboard("2026-05-31"),
    );

    expect(mockUseGetQuery).toHaveBeenCalledWith({
      url: "/user/nutrition/dashboard",
      params: {
        date: "2026-05-31",
      },
      queryProps: {
        queryKey: getNutritionDashboardQueryKey("2026-05-31"),
        enabled: true,
      },
    });
    expect(result.current.dashboard).toMatchObject({
      date: "2026-05-31",
      calories: {
        current: 1050,
        target: 2000,
        remaining: 950,
        percent: 53,
      },
      macros: {
        protein: { current: 65, target: 120, percent: 54 },
      },
      water: {
        currentMl: 1500,
        targetMl: 2500,
        percent: 60,
      },
      meals: {
        completed: 2,
        total: 4,
        byType: {
          breakfast: { count: 1, calories: 400 },
        },
      },
      activePlan: { id: "plan-1", status: "active" },
      streak: { currentDays: 2, bestDays: 5 },
    });
  });

  it("keeps a stable disabled query when requested", () => {
    renderHook(() => useNutritionDashboard("2026-05-31", { enabled: false }));

    expect(mockUseGetQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryProps: expect.objectContaining({
          enabled: false,
        }),
      }),
    );
  });
});

describe("normalizeNutritionDashboard", () => {
  it("falls back to empty dashboard sections for malformed payloads", () => {
    expect(normalizeNutritionDashboard(null)).toMatchObject({
      calories: { current: 0, target: 2200, remaining: 2200, percent: 0 },
      meals: {
        completed: 0,
        total: 4,
        byType: {
          breakfast: { count: 0, calories: 0 },
          lunch: { count: 0, calories: 0 },
        },
      },
      activePlan: null,
      feedback: { items: [] },
      quickActions: [],
    });
  });
});
