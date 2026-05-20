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
});
