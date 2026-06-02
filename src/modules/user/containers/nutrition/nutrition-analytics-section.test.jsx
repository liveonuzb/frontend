import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NutritionAnalyticsSection from "./nutrition-analytics-section.jsx";
import { useGetQuery } from "@/hooks/api";

const mockApiGet = vi.fn();

vi.mock("@/hooks/api", () => ({
  useGetQuery: vi.fn(),
}));

vi.mock("@/hooks/api/use-api.js", () => ({
  default: () => ({
    request: {
      get: mockApiGet,
    },
  }),
}));

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    error: vi.fn(),
    success: vi.fn(),
  }),
}));

describe("NutritionAnalyticsSection", () => {
  beforeEach(() => {
    mockApiGet.mockReset();
    useGetQuery.mockReset();
  });

  it("shows a loading state while the nutrition report is loading", () => {
    useGetQuery.mockReturnValue({ data: null, isLoading: true });

    render(<NutritionAnalyticsSection />);

    expect(
      screen.getByRole("status", { name: /Hisobot yuklanmoqda/i }),
    ).toBeInTheDocument();
  });

  it("shows an empty state when the report has no daily nutrition data", () => {
    useGetQuery.mockReturnValue({
      data: { data: { daily: [], summary: {}, goals: {} } },
      isLoading: false,
    });

    render(<NutritionAnalyticsSection />);

    expect(screen.getByText("Hisobot uchun ma'lumot yo'q")).toBeInTheDocument();
    expect(
      screen.getByText(/Ovqat yoki suv yozsangiz/i),
    ).toBeInTheDocument();
  });

  it("downloads report exports from the backend nutrition export endpoint", async () => {
    useGetQuery.mockImplementation(({ queryProps }) => {
      const queryKey = queryProps?.queryKey || [];

      if (queryKey.includes("comparison")) {
        return { data: null, isLoading: false };
      }

      return {
        data: {
          data: {
            daily: [
              {
                date: "2026-05-31",
                calories: 850,
                protein: 45,
                carbs: 120,
                fat: 25,
                waterMl: 1500,
                meals: [],
              },
            ],
            summary: {},
            goals: { calories: 2200, protein: 140, waterMl: 2500 },
            period: {
              days: 7,
              startDate: "2026-05-25",
              endDate: "2026-05-31",
            },
            sourceBreakdown: [],
          },
        },
        isLoading: false,
      };
    });
    mockApiGet.mockResolvedValue({
      data: new Blob(["csv"], { type: "text/csv" }),
      headers: {
        "content-disposition":
          'attachment; filename="nutrition-report-2026-05-25-2026-05-31.csv"',
      },
    });
    const createObjectUrl = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:nutrition-report");
    const revokeObjectUrl = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {});
    const clickDownload = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    render(<NutritionAnalyticsSection />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Nutrition report CSV eksport qilish/i,
      }),
    );

    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalledWith(
        "/daily-tracking/reports/nutrition/export",
        {
          params: {
            days: 7,
            format: "csv",
          },
          responseType: "blob",
        },
      );
    });

    createObjectUrl.mockRestore();
    revokeObjectUrl.mockRestore();
    clickDownload.mockRestore();
  });

  it("shows weekly and monthly nutrition summary cards for the selected period", async () => {
    const buildReport = (days) => ({
      daily: [
        {
          date: "2026-05-31",
          calories: 2000,
          protein: 120,
          carbs: 220,
          fat: 60,
          waterMl: 2100,
          meals: [],
        },
      ],
      summary:
        days === 30
          ? {
              daysTracked: 22,
              avgCalories: 2050,
              avgProtein: 118,
              avgWaterMl: 2100,
              caloriesGoalMet: 18,
              waterGoalMet: 16,
            }
          : {
              daysTracked: 5,
              avgCalories: 2000,
              avgProtein: 120,
              avgWaterMl: 1800,
              caloriesGoalMet: 4,
              waterGoalMet: 3,
            },
      goals: { calories: 2200, protein: 140, waterMl: 2500 },
      period: {
        days,
        startDate: days === 30 ? "2026-05-02" : "2026-05-25",
        endDate: "2026-05-31",
      },
      sourceBreakdown: [],
    });

    useGetQuery.mockImplementation(({ params, queryProps }) => {
      const queryKey = queryProps?.queryKey || [];

      if (queryKey.includes("comparison")) {
        return { data: null, isLoading: false };
      }

      return {
        data: { data: buildReport(params?.days || 7) },
        isLoading: false,
      };
    });

    render(<NutritionAnalyticsSection />);

    expect(screen.getByText("Haftalik xulosa")).toBeInTheDocument();
    expect(screen.getByText("7 kundan 5 kuni kuzatilgan")).toBeInTheDocument();
    expect(screen.getByText("-200 kcal/kun")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "30 kun" }));

    await waitFor(() => {
      expect(screen.getByText("Oylik xulosa")).toBeInTheDocument();
    });
    expect(screen.getByText("30 kundan 22 kuni kuzatilgan")).toBeInTheDocument();
    expect(screen.getByText("-150 kcal/kun")).toBeInTheDocument();
  });

  it("shows meal plan adherence when the report includes active plan matching", () => {
    useGetQuery.mockImplementation(({ queryProps }) => {
      const queryKey = queryProps?.queryKey || [];

      if (queryKey.includes("comparison")) {
        return { data: null, isLoading: false };
      }

      return {
        data: {
          data: {
            daily: [
              {
                date: "2026-05-31",
                calories: 2000,
                protein: 120,
                carbs: 220,
                fat: 60,
                waterMl: 2100,
                meals: [],
              },
            ],
            summary: {
              daysTracked: 2,
              avgCalories: 2000,
              avgProtein: 120,
              avgWaterMl: 1800,
              caloriesGoalMet: 1,
              waterGoalMet: 1,
            },
            goals: { calories: 2200, protein: 140, waterMl: 2500 },
            period: {
              days: 2,
              startDate: "2026-05-30",
              endDate: "2026-05-31",
            },
            planAdherence: {
              planId: "plan-1",
              planName: "Balanslangan reja",
              plannedDays: 2,
              fullyMatchedDays: 1,
              plannedMeals: 3,
              matchedMeals: 2,
              adherencePercent: 67,
            },
            sourceBreakdown: [],
          },
        },
        isLoading: false,
      };
    });

    render(<NutritionAnalyticsSection />);

    expect(screen.getByText("Rejaga amal qilish")).toBeInTheDocument();
    expect(screen.getByText("Balanslangan reja")).toBeInTheDocument();
    expect(screen.getByText("67%")).toBeInTheDocument();
    expect(screen.getByText("2 / 3 ovqat mos")).toBeInTheDocument();
    expect(screen.getByText("1 / 2 kun to'liq mos")).toBeInTheDocument();
  });
});
