import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUseGetQuery = vi.fn();

vi.mock("@/hooks/api", () => ({
  useGetQuery: (...args) => mockUseGetQuery(...args),
}));

import {
  WORKOUT_OVERVIEW_QUERY_KEY,
  useWorkoutOverview,
} from "./use-workout-overview.js";

describe("useWorkoutOverview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGetQuery.mockReturnValue({
      data: {
        data: {
          weeklyStats: {
            count: 2,
            calories: 450,
            duration: 3600,
          },
          activePlan: null,
          personalRecords: [{ id: "record-1" }],
          recentWorkoutDays: ["2026-05-20"],
        },
      },
      isLoading: false,
    });
  });

  it("loads dashboard data from the unified workout dashboard endpoint", () => {
    const { result } = renderHook(() => useWorkoutOverview());

    expect(mockUseGetQuery).toHaveBeenCalledWith({
      url: "/user/workout/dashboard",
      queryProps: {
        queryKey: WORKOUT_OVERVIEW_QUERY_KEY,
        enabled: true,
      },
    });
    expect(result.current.overview.weeklyStats.count).toBe(2);
    expect(result.current.overview.activePlan).toBeNull();
    expect(result.current.overview.personalRecordCount).toBe(1);
  });

  it("normalizes dashboard streak and recovery widgets", () => {
    mockUseGetQuery.mockReturnValue({
      data: {
        data: {
          weeklyStats: {
            count: 3,
            calories: 900,
            duration: 120,
          },
          streak: {
            currentDays: "4",
            bestDays: "11",
          },
          recovery: {
            status: "good",
            score: "86",
            recommendation: "Keep the current training rhythm.",
          },
        },
      },
      isLoading: false,
    });

    const { result } = renderHook(() => useWorkoutOverview());

    expect(result.current.overview.streak).toEqual({
      currentDays: 4,
      bestDays: 11,
    });
    expect(result.current.overview.recovery).toEqual({
      status: "good",
      score: 86,
      recommendation: "Keep the current training rhythm.",
    });
  });

  it("normalizes the canonical active plan snapshot", () => {
    mockUseGetQuery.mockReturnValue({
      data: {
        data: {
          activePlan: {
            id: "plan-1",
            status: "active",
            name: "Full Body Strength",
            progress: "48",
            completedWorkouts: "12",
            targetWorkouts: "25",
            nextWorkout: {
              planId: "plan-1",
              dayIndex: "2",
              title: "Pull Day",
              exerciseCount: "5",
              estimatedCalories: "320",
              isStartable: true,
            },
            todayWorkout: {
              dayIndex: "2",
              title: "Pull Day",
              exercisesCount: "5",
              calories: "320",
            },
          },
        },
      },
      isLoading: false,
    });

    const { result } = renderHook(() => useWorkoutOverview());

    expect(result.current.overview.activePlan).toMatchObject({
      id: "plan-1",
      progress: 48,
      completedWorkouts: 12,
      targetWorkouts: 25,
      nextWorkout: {
        dayIndex: 2,
        exerciseCount: 5,
        estimatedCalories: 320,
      },
      todayWorkout: {
        dayIndex: 2,
        exercisesCount: 5,
        calories: 320,
      },
    });
  });

  it("normalizes the canonical workout state snapshot", () => {
    mockUseGetQuery.mockReturnValue({
      data: {
        data: {
          workoutState: {
            activeSession: {
              type: "strength",
              session: {
                id: "draft-1",
                planId: "plan-1",
                planDayIndex: "1",
              },
            },
            activePlan: {
              id: "plan-1",
              name: "Full Body Strength",
              nextWorkout: {
                planId: "plan-1",
                dayIndex: "2",
                title: "Pull Day",
                exerciseCount: "5",
                skipped: false,
              },
            },
            nextWorkout: {
              planId: "plan-1",
              dayIndex: "2",
              title: "Pull Day",
              exerciseCount: "5",
              skipped: false,
            },
            canStartWorkout: false,
            blockReason: "ACTIVE_WORKOUT_SESSION_EXISTS",
            hasSessionConflict: true,
          },
        },
      },
      isLoading: false,
    });

    const { result } = renderHook(() => useWorkoutOverview());

    expect(result.current.overview.workoutState).toMatchObject({
      activeSession: {
        type: "strength",
        session: {
          id: "draft-1",
          planDayIndex: 1,
        },
      },
      activePlan: {
        id: "plan-1",
        nextWorkout: {
          dayIndex: 2,
          exerciseCount: 5,
          skipped: false,
        },
      },
      nextWorkout: {
        dayIndex: 2,
        exerciseCount: 5,
        skipped: false,
      },
      canStartWorkout: false,
      blockReason: "ACTIVE_WORKOUT_SESSION_EXISTS",
      hasSessionConflict: true,
    });
  });
});
