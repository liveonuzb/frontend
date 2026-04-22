import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { useGetQuery } from "@/hooks/api";
import useHealthGoals from "@/hooks/app/use-health-goals";
import useMe from "@/hooks/app/use-me";
import { calculateGoals } from "@/lib/goal-calculator";
import { HealthTab } from "./health-tab.jsx";

vi.mock("react-i18next", () => ({
  initReactI18next: {
    type: "3rdParty",
    init: () => {},
  },
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

vi.mock("@/hooks/app/use-me", () => ({
  default: vi.fn(),
}));

const baseGoals = {
  goal: "maintain",
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
const baseOnboarding = {
  gender: "male",
  age: 30,
  height: { value: 180, unit: "cm" },
  currentWeight: { value: 90, unit: "kg" },
  activityLevel: "moderately-active",
  goal: "maintain",
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

  it("renders gain hero when stored health goal is gain", () => {
    vi.mocked(useMe).mockReturnValue({
      user: { telegramConnected: false },
      onboarding: baseOnboarding,
    });
    vi.mocked(useHealthGoals).mockReturnValue({
      goals: {
        ...baseGoals,
        goal: "gain",
      },
      saveGoals: vi.fn(),
      isHydratingGoals: false,
    });
    configureQueryMocks();

    const { rerender } = render(<HealthTab />);

    expect(screen.getByText("Massa uchun bugungi panel")).toBeInTheDocument();
  });

  it("falls back to maintain and shows progress empty state when analytics are empty", () => {
    vi.mocked(useMe).mockReturnValue({
      user: { telegramConnected: false },
      onboarding: null,
    });
    vi.mocked(useHealthGoals).mockReturnValue({
      goals: {
        ...baseGoals,
        goal: "maintain",
      },
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

    const { rerender } = render(<HealthTab />);

    expect(
      screen.getByText("Ritmingizni ushlab turish paneli"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Hali yetarli tracking yo'q"),
    ).toBeInTheDocument();
  });

  it("updates recommendation and autosaves the selected goal", async () => {
    vi.useFakeTimers();
    const saveGoals = vi.fn().mockResolvedValue({});
    vi.mocked(useMe).mockReturnValue({
      user: { telegramConnected: false },
      onboarding: baseOnboarding,
    });
    vi.mocked(useHealthGoals).mockReturnValue({
      goals: baseGoals,
      saveGoals,
      isHydratingGoals: false,
    });
    configureQueryMocks();

    const { rerender } = render(<HealthTab />);

    const maintainGoals = calculateGoals({
      gender: "male",
      age: 30,
      heightValue: 180,
      currentWeightValue: 90,
      goal: "maintain",
      activityLevel: "moderately-active",
      weeklyPace: 0.5,
    });
    const gainGoals = calculateGoals({
      gender: "male",
      age: 30,
      heightValue: 180,
      currentWeightValue: 90,
      goal: "gain",
      activityLevel: "moderately-active",
      weeklyPace: 0.5,
    });
    const maintainLabel = `${maintainGoals.calories.toLocaleString("en-US")} kcal`;
    const gainLabel = `${gainGoals.calories.toLocaleString("en-US")} kcal`;

    expect(screen.getAllByText(maintainLabel).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /massa/i }));

    expect(screen.getAllByText(gainLabel).length).toBeGreaterThan(0);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });

    expect(saveGoals).toHaveBeenCalledWith(
      expect.objectContaining({
        goal: "gain",
        calories: gainGoals.calories,
      }),
    );

    vi.mocked(useHealthGoals).mockReturnValue({
      goals: {
        ...baseGoals,
        ...gainGoals,
        goal: "gain",
      },
      saveGoals,
      isHydratingGoals: false,
    });

    rerender(<HealthTab />);

    expect(screen.getByText("Massa uchun bugungi panel")).toBeInTheDocument();
  });
});
