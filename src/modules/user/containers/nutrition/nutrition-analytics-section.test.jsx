import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NutritionAnalyticsSection from "./nutrition-analytics-section.jsx";
import { useGetQuery } from "@/hooks/api";
import { toast } from "sonner";

const mockApiGet = vi.fn();
const generateAiReportMock = vi.hoisted(() => vi.fn());
const aiAccessState = vi.hoisted(() => ({
  access: {
    status: "trial_active",
    dailyLimit: 3,
    remainingToday: 3,
  },
}));

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

vi.mock("@/hooks/app/use-user-ai-reports", () => ({
  useGenerateUserAiReport: () => ({
    mutateAsync: generateAiReportMock,
    isPending: false,
  }),
}));

vi.mock("@/hooks/app/use-ai-access", async () => {
  const actual = await vi.importActual("@/hooks/app/use-ai-access");

  return {
    ...actual,
    useAiAccessStatus: () => ({
      access: aiAccessState.access,
      wallet: aiAccessState.access,
      costs: {},
    }),
  };
});

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    error: vi.fn(),
    success: vi.fn(),
  }),
}));

describe("NutritionAnalyticsSection", () => {
  beforeEach(() => {
    mockApiGet.mockReset();
    generateAiReportMock.mockReset();
    useGetQuery.mockReset();
    aiAccessState.access = {
      status: "trial_active",
      dailyLimit: 3,
      remainingToday: 3,
    };
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
      data: {
        data: {
          daily: [
            {
              date: "2026-05-31",
              calories: 0,
              protein: 0,
              carbs: 0,
              fat: 0,
              fiber: 0,
              waterMl: 0,
              mealCount: 0,
            },
          ],
          summary: {},
          goals: {},
          period: {
            days: 7,
            startDate: "2026-05-25",
            endDate: "2026-05-31",
          },
        },
      },
      isLoading: false,
    });

    render(<NutritionAnalyticsSection />);

    expect(screen.getByText("Hisobot uchun ma'lumot yo'q")).toBeInTheDocument();
    expect(
      screen.getByText(/Tanlangan 7 kunlik davrda/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Ovqat logi yo'q")).toBeInTheDocument();
    expect(screen.getByText("Suv logi yo'q")).toBeInTheDocument();
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
        "/user/nutrition/reports/export",
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

    expect(useGetQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/user/nutrition/reports/summary",
      }),
    );
    expect(screen.getByText("Haftalik xulosa")).toBeInTheDocument();
    expect(screen.getByText("7 kundan 5 kuni kuzatilgan")).toBeInTheDocument();
    expect(screen.getByText("-200 kcal/kun")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "90 kun" })).toBeInTheDocument();

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

  it("shows extended trend, adherence, insights, and selected-period comparison", async () => {
    useGetQuery.mockImplementation(({ params, queryProps }) => {
      const queryKey = queryProps?.queryKey || [];

      if (queryKey.includes("selected-previous")) {
        return {
          data: {
            data: {
              daily: [
                { date: "2026-05-28", calories: 1500 },
                { date: "2026-05-29", calories: 1600 },
              ],
            },
          },
          isLoading: false,
        };
      }

      if (queryKey.includes("comparison")) {
        return { data: null, isLoading: false };
      }

      return {
        data: {
          data: {
            daily: [
              {
                date: "2026-05-30",
                calories: 2000,
                protein: 120,
                carbs: 220,
                fat: 60,
                fiber: 22,
                waterMl: 2100,
                mealCount: 3,
                meals: [],
              },
              {
                date: "2026-05-31",
                calories: 2100,
                protein: 130,
                carbs: 230,
                fat: 65,
                fiber: 28,
                waterMl: 2600,
                mealCount: 4,
                meals: [],
              },
            ],
            summary: {
              daysTracked: 2,
              avgCalories: 2050,
              avgProtein: 125,
              avgCarbs: 225,
              avgFat: 63,
              avgFiber: 25,
              avgWaterMl: 2350,
              avgMealCount: 4,
              caloriesGoalMet: 1,
              waterGoalMet: 1,
              macroRangeMet: 2,
            },
            goals: {
              calories: 2200,
              protein: 140,
              carbs: 250,
              fat: 70,
              fiber: 30,
              waterMl: 2500,
            },
            period: {
              days: 2,
              startDate: "2026-05-30",
              endDate: "2026-05-31",
            },
            insights: [
              {
                id: "fiber-low",
                severity: "info",
                title: "Kletchatka kam",
                message: "Sabzavot qo'shing.",
                metric: "fiber",
              },
            ],
            sourceBreakdown: [{ source: "manual", count: 2, percent: 100 }],
          },
        },
        isLoading: false,
      };
    });

    render(<NutritionAnalyticsSection />);

    expect(screen.getByText("Fiber")).toBeInTheDocument();
    expect(screen.getByText("Ovqat soni")).toBeInTheDocument();
    expect(screen.getByText("Makro diapazon")).toBeInTheDocument();
    expect(screen.getByLabelText("Maqsadga amal qilish")).toHaveTextContent(
      "2/2",
    );
    expect(screen.getByText("Kletchatka kam")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Hafta solishtirish" }));
    fireEvent.click(screen.getByRole("button", { name: "Davr" }));

    await waitFor(() => {
      expect(screen.getByText("Tanlangan davr vs oldingi davr")).toBeInTheDocument();
    });
    expect(useGetQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        params: {
          startDate: "2026-05-28",
          endDate: "2026-05-29",
        },
      }),
    );
  });

  it("shows AI insight credit state and disables the add-on when quota is exhausted", () => {
    aiAccessState.access = {
      status: "trial_active",
      dailyLimit: 3,
      remainingToday: 0,
    };
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
                calories: 2100,
                protein: 130,
                carbs: 230,
                fat: 65,
                waterMl: 2600,
                mealCount: 4,
                meals: [],
              },
            ],
            summary: { daysTracked: 1, avgCalories: 2100 },
            goals: { calories: 2200, protein: 140, waterMl: 2500 },
            period: {
              days: 7,
              startDate: "2026-05-25",
              endDate: "2026-05-31",
            },
            insights: [],
            sourceBreakdown: [],
          },
        },
        isLoading: false,
      };
    });

    render(<NutritionAnalyticsSection />);

    expect(screen.getByText("AI insight add-on")).toBeInTheDocument();
    expect(screen.getByText(/Bugun 0\/3 qoldi/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /AI insight yaratish/i }),
    ).toBeDisabled();
    expect(generateAiReportMock).not.toHaveBeenCalled();
  });

  it("generates an optional AI insight report for the selected nutrition period", async () => {
    generateAiReportMock.mockResolvedValue({
      id: "ai-report-1",
      cached: false,
    });
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
                calories: 2100,
                protein: 130,
                carbs: 230,
                fat: 65,
                waterMl: 2600,
                mealCount: 4,
                meals: [],
              },
            ],
            summary: { daysTracked: 1, avgCalories: 2100 },
            goals: { calories: 2200, protein: 140, waterMl: 2500 },
            period: {
              days: 7,
              startDate: "2026-05-25",
              endDate: "2026-05-31",
            },
            insights: [],
            sourceBreakdown: [],
          },
        },
        isLoading: false,
      };
    });

    render(<NutritionAnalyticsSection />);

    fireEvent.click(
      screen.getByRole("button", { name: /AI insight yaratish/i }),
    );

    await waitFor(() => {
      expect(generateAiReportMock).toHaveBeenCalledWith("weekly");
    });
    expect(toast.success).toHaveBeenCalledWith("AI insight report yaratildi");
  });
});
