import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { useGetQuery } from "@/hooks/api";
import useHealthGoals from "@/hooks/app/use-health-goals";
import { HealthTab } from "./health-tab.jsx";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, options = {}) => options.defaultValue || key,
  }),
}));

vi.mock("@/hooks/api", () => ({
  useGetQuery: vi.fn(),
}));

vi.mock("@/hooks/app/use-health-goals", () => ({
  default: vi.fn(),
}));

const baseGoals = {
  calories: 2200,
  waterMl: 2500,
  steps: 10000,
  protein: 150,
  carbs: 250,
  fat: 70,
  fiber: 30,
  workoutMinutes: 60,
  sleepHours: 8,
  waterUnit: "ml",
  weightUnit: "kg",
  heightUnit: "cm",
  waterNotification: true,
};

const configureQueryMocks = ({
  healthData,
  waterData,
  measurementsData,
} = {}) => {
  vi.mocked(useGetQuery).mockImplementation(({ url }) => {
    if (url === "/daily-tracking/reports/health") {
      return {
        data: {
          data:
            healthData ??
            {
              summary: {
                daysTracked: 5,
                avgCalories: 1980,
                avgProtein: 132,
                avgWaterMl: 2300,
                avgSteps: 9400,
                avgWorkoutMinutes: 42,
                avgSleepHours: 7.1,
                caloriesGoalMet: 3,
                waterGoalMet: 2,
                stepsGoalMet: 3,
              },
              weight: {
                current: 81.2,
                trend: [
                  { date: "2026-04-15", weight: 82.4 },
                  { date: "2026-04-18", weight: 81.8 },
                  { date: "2026-04-21", weight: 81.2 },
                ],
              },
              daily: [{ date: "2026-04-21", calories: 1900 }],
            },
        },
        isLoading: false,
      };
    }

    if (url === "/daily-tracking/water/analytics") {
      return {
        data: {
          data:
            waterData ??
            {
              summary: {
                averageMl: 2400,
                daysTracked: 5,
                daysGoalMet: 2,
                completionRate: 71,
              },
            },
        },
        isLoading: false,
      };
    }

    if (url === "/measurements/trends") {
      return {
        data: {
          data:
            measurementsData ??
            {
              trends: {
                waist: { last: 88, change: -2.4 },
                hips: { last: 102, change: -1.2 },
              },
            },
        },
        isLoading: false,
      };
    }

    return { data: undefined, isLoading: false };
  });
};

describe("HealthTab", () => {
  beforeAll(() => {
    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("renders gain hero when onboarding goal is gain", () => {
    vi.mocked(useHealthGoals).mockReturnValue({
      goals: baseGoals,
      recommendedGoals: {
        ...baseGoals,
        calories: 2800,
        protein: 170,
        waterMl: 3200,
        steps: 8000,
      },
      recommendedGoalIntent: "gain",
      hasOnboardingGoal: true,
      hasServerGoals: true,
      isDefaultGoalPreset: false,
      saveGoals: vi.fn(),
      isHydratingGoals: false,
    });
    configureQueryMocks();

    render(<HealthTab />);

    expect(screen.getByText("Massa uchun bugungi panel")).toBeInTheDocument();
  });

  it("falls back to lose and shows progress empty state when analytics are empty", () => {
    vi.mocked(useHealthGoals).mockReturnValue({
      goals: baseGoals,
      recommendedGoals: {
        ...baseGoals,
        calories: 1800,
        waterMl: 3000,
        steps: 12000,
      },
      recommendedGoalIntent: "maintain",
      hasOnboardingGoal: false,
      hasServerGoals: false,
      isDefaultGoalPreset: true,
      saveGoals: vi.fn(),
      isHydratingGoals: false,
    });
    configureQueryMocks({
      healthData: {
        summary: {
          daysTracked: 0,
          avgCalories: 0,
          avgProtein: 0,
          avgWaterMl: 0,
          avgSteps: 0,
          avgWorkoutMinutes: 0,
          avgSleepHours: 0,
          caloriesGoalMet: 0,
        },
        weight: { current: null, trend: [] },
        daily: [],
      },
      waterData: {
        summary: {
          averageMl: 0,
          daysTracked: 0,
          daysGoalMet: 0,
          completionRate: 0,
        },
      },
      measurementsData: {
        trends: {},
      },
    });

    render(<HealthTab />);

    expect(screen.getByText("Ozish uchun bugungi panel")).toBeInTheDocument();
    expect(
      screen.getByText("Hali yetarli tracking yo'q"),
    ).toBeInTheDocument();
  });

  it("applies the recommended plan and disables the CTA afterwards", async () => {
    vi.mocked(useHealthGoals).mockReturnValue({
      goals: baseGoals,
      recommendedGoals: {
        ...baseGoals,
        calories: 1800,
        waterMl: 3000,
        steps: 12000,
        protein: 165,
      },
      recommendedGoalIntent: "lose",
      hasOnboardingGoal: true,
      hasServerGoals: true,
      isDefaultGoalPreset: false,
      saveGoals: vi.fn(),
      isHydratingGoals: false,
    });
    configureQueryMocks();

    render(<HealthTab />);

    const applyButton = screen.getByRole("button", {
      name: "Tavsiya planini qo'llash",
    });

    expect(applyButton).toBeEnabled();
    fireEvent.click(applyButton);
    expect(applyButton).toBeDisabled();
  });
});
