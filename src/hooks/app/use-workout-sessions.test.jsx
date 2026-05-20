import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUseGetQuery = vi.fn();

vi.mock("@/hooks/api", () => ({
  useDeleteQuery: vi.fn(),
  useGetQuery: (...args) => mockUseGetQuery(...args),
  usePostQuery: vi.fn(),
  usePutQuery: vi.fn(),
}));

vi.mock("@/lib/analytics.js", () => ({
  trackCampaignConversion: vi.fn(),
}));

import {
  WORKOUT_SESSION_HISTORY_QUERY_KEY,
  WORKOUT_SESSION_HISTORY_SUMMARY_QUERY_KEY,
  WORKOUT_SESSION_REPORT_QUERY_KEY,
  useWorkoutSessionHistory,
  useWorkoutSessionHistorySummary,
  useWorkoutReport,
} from "./use-workout-sessions.js";

describe("useWorkoutSessionHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGetQuery.mockReturnValue({
      data: {
        data: {
          data: [{ id: "session-1" }],
          meta: {
            hasMore: false,
          },
        },
      },
      isLoading: false,
    });
  });

  it("passes history filters as request params with a stable query key", () => {
    const params = {
      limit: 10,
      period: "7d",
      status: "completed",
      type: "running",
    };
    const { result } = renderHook(() => useWorkoutSessionHistory(params));

    expect(mockUseGetQuery).toHaveBeenCalledWith({
      url: "/user/workout/sessions/history",
      params,
      queryProps: {
        queryKey: [...WORKOUT_SESSION_HISTORY_QUERY_KEY, params],
        enabled: true,
      },
    });
    expect(result.current.sessions).toEqual([{ id: "session-1" }]);
    expect(result.current.meta).toEqual({ hasMore: false });
  });
});

describe("useWorkoutSessionHistorySummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGetQuery.mockReturnValue({
      data: {
        data: {
          totalSessions: 4,
        },
      },
      isLoading: false,
    });
  });

  it("loads aggregate history summary with the same filter params", () => {
    const params = {
      period: "30d",
      status: "completed",
      type: "all",
    };
    const { result } = renderHook(() =>
      useWorkoutSessionHistorySummary(params),
    );

    expect(mockUseGetQuery).toHaveBeenCalledWith({
      url: "/user/workout/sessions/history/summary",
      params,
      queryProps: {
        queryKey: [...WORKOUT_SESSION_HISTORY_SUMMARY_QUERY_KEY, params],
        enabled: true,
      },
    });
    expect(result.current.summary).toEqual({ totalSessions: 4 });
  });
});

describe("useWorkoutReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGetQuery.mockReturnValue({
      data: {
        data: {
          summary: {
            sessions: 4,
          },
        },
      },
      isLoading: false,
    });
  });

  it("loads report data from the unified workout report endpoint", () => {
    const { result } = renderHook(() =>
      useWorkoutReport({ comparisonPeriod: "previous", period: "30d" }),
    );

    expect(mockUseGetQuery).toHaveBeenCalledWith({
      url: "/user/workout/report",
      params: {
        comparisonPeriod: "previous",
        period: "30d",
      },
      queryProps: {
        queryKey: [
          ...WORKOUT_SESSION_REPORT_QUERY_KEY,
          { comparisonPeriod: "previous", period: "30d" },
        ],
        enabled: true,
      },
    });
    expect(result.current.report.summary.sessions).toBe(4);
  });
});
