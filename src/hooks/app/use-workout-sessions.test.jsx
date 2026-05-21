import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUseGetQuery = vi.fn();
const mockUsePostQuery = vi.fn();
const mockUseDeleteQuery = vi.fn();
const mockQueryClient = {
  invalidateQueries: vi.fn(),
  removeQueries: vi.fn(),
  setQueryData: vi.fn(),
};

vi.mock("@/hooks/api", () => ({
  useDeleteQuery: (...args) => mockUseDeleteQuery(...args),
  useGetQuery: (...args) => mockUseGetQuery(...args),
  usePostQuery: (...args) => mockUsePostQuery(...args),
  usePutQuery: vi.fn(),
}));

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    useQueryClient: () => mockQueryClient,
  };
});

vi.mock("@/lib/analytics.js", () => ({
  trackCampaignConversion: vi.fn(),
}));

import {
  WORKOUT_SESSION_HISTORY_QUERY_KEY,
  WORKOUT_SESSION_HISTORY_SUMMARY_QUERY_KEY,
  WORKOUT_SESSION_REPORT_QUERY_KEY,
  WORKOUT_SESSION_ACTIVE_QUERY_KEY,
  useActiveWorkoutSession,
  useFinishWorkoutSession,
  useUndoSkipWorkoutSession,
  useSkipWorkoutSession,
  useStartWorkoutSession,
  useWorkoutSessionHistory,
  useWorkoutSessionHistorySummary,
  useWorkoutReport,
} from "./use-workout-sessions.js";

describe("useActiveWorkoutSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGetQuery.mockReturnValue({
      data: {
        data: {
          id: "draft-1",
          planId: "plan-1",
          planDayIndex: 2,
          elapsedSeconds: 345,
          exercises: [{ name: "Squat" }],
        },
      },
      isLoading: false,
    });
  });

  it("loads the latest active workout session draft", () => {
    const { result } = renderHook(() => useActiveWorkoutSession());

    expect(mockUseGetQuery).toHaveBeenCalledWith({
      url: "/user/workout/sessions/active",
      queryProps: {
        queryKey: WORKOUT_SESSION_ACTIVE_QUERY_KEY,
        enabled: true,
      },
    });
    expect(result.current.activeWorkoutSession).toEqual(
      expect.objectContaining({
        id: "draft-1",
        planId: "plan-1",
        planDayIndex: 2,
        elapsedSeconds: 345,
      }),
    );
  });

  it("returns null when the active session response is empty", () => {
    mockUseGetQuery.mockReturnValue({
      data: {
        data: {},
      },
      isLoading: false,
    });

    const { result } = renderHook(() => useActiveWorkoutSession());

    expect(result.current.activeWorkoutSession).toBeNull();
  });
});

describe("useStartWorkoutSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryClient.setQueryData.mockResolvedValue(undefined);
    mockUsePostQuery.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({
        data: {
          data: {
            id: "draft-extra-1",
            planId: "plan-1",
            planDayIndex: 0,
          },
        },
      }),
      isPending: false,
    });
  });

  it("sends the optional session mode when starting a workout", async () => {
    const { result } = renderHook(() => useStartWorkoutSession());

    await result.current.startSession("plan-1", 0, { mode: "extra" });

    expect(mockUsePostQuery().mutateAsync).toHaveBeenCalledWith({
      url: "/user/workout/sessions/start",
      attributes: {
        planId: "plan-1",
        dayIndex: 0,
        mode: "extra",
      },
    });
  });
});

describe("useSkipWorkoutSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryClient.invalidateQueries.mockResolvedValue(undefined);
    mockUsePostQuery.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({
        data: {
          data: {
            id: "skipped-1",
            planId: "plan-1",
            planDayIndex: 1,
            status: "skipped",
          },
        },
      }),
      isPending: false,
    });
  });

  it("posts to the skip endpoint and invalidates workout state queries", async () => {
    const { result } = renderHook(() => useSkipWorkoutSession());

    await result.current.skipSession("plan-1", 1);

    expect(mockUsePostQuery().mutateAsync).toHaveBeenCalledWith({
      url: "/user/workout/sessions/plan-1/days/1/skip",
    });
    expect(mockQueryClient.removeQueries).toHaveBeenCalledWith({
      queryKey: ["user", "workout", "sessions", "plan-1", 1],
    });
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: WORKOUT_SESSION_ACTIVE_QUERY_KEY,
    });
  });
});

describe("useUndoSkipWorkoutSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryClient.invalidateQueries.mockResolvedValue(undefined);
    mockUseDeleteQuery.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({
        data: {
          data: {
            success: true,
            restored: true,
          },
        },
      }),
      isPending: false,
    });
  });

  it("deletes the skipped marker and invalidates workout state queries", async () => {
    const { result } = renderHook(() => useUndoSkipWorkoutSession());

    await result.current.undoSkipSession("plan-1", 1);

    expect(mockUseDeleteQuery().mutateAsync).toHaveBeenCalledWith({
      url: "/user/workout/sessions/plan-1/days/1/skip",
    });
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: WORKOUT_SESSION_ACTIVE_QUERY_KEY,
    });
  });
});

describe("useFinishWorkoutSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryClient.invalidateQueries.mockResolvedValue(undefined);
    mockUsePostQuery.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({
        data: {
          data: {
            id: "completed-1",
            planId: "plan-1",
            planDayIndex: 0,
          },
        },
      }),
      isPending: false,
    });
  });

  it("invalidates the active draft query after finishing a workout", async () => {
    const { result } = renderHook(() => useFinishWorkoutSession());

    await result.current.finishSession("plan-1", 0, {
      completionKey: "finish-key",
    });

    expect(mockQueryClient.removeQueries).toHaveBeenCalledWith({
      queryKey: ["user", "workout", "sessions", "plan-1", 0],
    });
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: WORKOUT_SESSION_ACTIVE_QUERY_KEY,
    });
  });
});

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
