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
          timezone: "Asia/Tashkent",
          goals: {
            calories: "2000",
            protein: "120",
            carbs: "220",
            fat: "60",
            waterMl: "2500",
          },
          feedback: { items: [{ id: "dashboard-low-water" }] },
          streak: { currentDays: "2", bestDays: "5" },
          quickActions: [{ id: "add-meal" }],
          blockers: {
            items: [
              {
                id: "dashboard-missing-goals",
                type: "goals",
                severity: "warning",
                title: "Maqsadlar sozlanmagan",
                message: "Default maqsad ishlatilmoqda.",
                action: {
                  id: "set-goals",
                  label: "Maqsadlarni sozlash",
                  target: "/user/nutrition/overview?action=recalculate-goals",
                },
              },
            ],
          },
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
      url: "/user/nutrition/overview",
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
      timezone: "Asia/Tashkent",
      goals: {
        calories: 2000,
        protein: 120,
        carbs: 220,
        fat: 60,
        waterMl: 2500,
      },
      streak: { currentDays: 2, bestDays: 5 },
      blockers: {
        items: [
          {
            id: "dashboard-missing-goals",
            type: "goals",
            severity: "warning",
            title: "Maqsadlar sozlanmagan",
            message: "Default maqsad ishlatilmoqda.",
            action: {
              id: "set-goals",
              label: "Maqsadlarni sozlash",
              target: "/user/nutrition/overview?action=recalculate-goals",
            },
          },
        ],
      },
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
      timezone: "Asia/Tashkent",
      goals: { calories: 2200, protein: 150, carbs: 250, fat: 70, waterMl: 2500 },
      feedback: { items: [] },
      quickActions: [],
      blockers: { items: [] },
    });
  });

  it("normalizes malformed numeric and collection fields to the canonical dashboard shape", () => {
    expect(
      normalizeNutritionDashboard({
        date: "2026-05-31T15:30:00.000Z",
        calories: {
          current: "-20",
          target: null,
          remaining: "-10",
          percent: "bad",
        },
        macros: {
          protein: { current: "64.6", target: undefined, percent: "-5" },
          carbs: { current: "bad", target: "250.4", percent: "44.6" },
        },
        water: {
          currentMl: "-250",
          targetMl: null,
          percent: "NaN",
        },
        meals: {
          completed: "-1",
          total: null,
          byType: {
            breakfast: { count: "-3", calories: "bad" },
            lunch: { count: "2.4", calories: "650.7" },
          },
        },
        timezone: 123,
        goals: {
          calories: "2100.4",
          protein: "-30",
          carbs: "",
          fat: "bad",
          waterMl: "2600.7",
        },
        feedback: {
          items: [
            { id: "dashboard-low-water", metric: "water", actual: "1000" },
            null,
          ],
        },
        quickActions: [
          {
            id: "add-meal",
            label: "Ovqat qo'shish",
            target: "/user/nutrition/overview?action=add-meal",
            enabled: "yes",
          },
          null,
        ],
        blockers: {
          items: [
            {
              id: "dashboard-missing-goals",
              type: "goals",
              severity: "bad",
              title: "Maqsadlar sozlanmagan",
              message: "Default maqsad ishlatilmoqda.",
              action: {
                id: "set-goals",
                label: "Maqsadlarni sozlash",
                target: "/user/nutrition/overview?action=recalculate-goals",
              },
            },
            null,
          ],
        },
      }),
    ).toMatchObject({
      date: "2026-05-31",
      timezone: "123",
      goals: { calories: 2100, protein: 0, carbs: 250, fat: 70, waterMl: 2601 },
      calories: { current: 0, target: 2200, remaining: 0, percent: 0 },
      macros: {
        protein: { current: 65, target: 150, percent: 0 },
        carbs: { current: 0, target: 250, percent: 45 },
        fat: { current: 0, target: 70, percent: 0 },
      },
      water: { currentMl: 0, targetMl: 2500, percent: 0 },
      meals: {
        completed: 0,
        total: 4,
        byType: {
          breakfast: { count: 0, calories: 0 },
          lunch: { count: 2, calories: 651 },
          dinner: { count: 0, calories: 0 },
          snack: { count: 0, calories: 0 },
        },
      },
      feedback: {
        items: [
          {
            id: "dashboard-low-water",
            metric: "water",
            actual: 1000,
          },
        ],
      },
      quickActions: [
        {
          id: "add-meal",
          label: "Ovqat qo'shish",
          target: "/user/nutrition/overview?action=add-meal",
          enabled: true,
        },
      ],
      blockers: {
        items: [
          {
            id: "dashboard-missing-goals",
            type: "goals",
            severity: "info",
            title: "Maqsadlar sozlanmagan",
            message: "Default maqsad ishlatilmoqda.",
            action: {
              id: "set-goals",
              label: "Maqsadlarni sozlash",
              target: "/user/nutrition/overview?action=recalculate-goals",
            },
          },
        ],
      },
    });
  });
});
