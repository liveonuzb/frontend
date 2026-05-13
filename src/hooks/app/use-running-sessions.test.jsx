import React from "react";
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUseGetQuery = vi.fn();
const mockUsePostQuery = vi.fn();

vi.mock("@/hooks/api", () => ({
  useGetQuery: (...args) => mockUseGetQuery(...args),
  usePostQuery: (...args) => mockUsePostQuery(...args),
}));

import {
  RUNNING_ACTIVE_QUERY_KEY,
  RUNNING_SESSIONS_QUERY_KEY,
  useAppendRunningPoints,
  useRunningActiveSession,
  useRunningSessionDetail,
  useStartRunningSession,
} from "./use-running-sessions.js";

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const createWrapper = (queryClient) =>
  function Wrapper({ children }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

describe("use-running-sessions", () => {
  let queryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createQueryClient();
    mockUseGetQuery.mockReturnValue({
      data: {
        data: {
          data: {
            workoutSessionId: "workout-1",
            status: "active",
          },
        },
      },
      isLoading: false,
    });
  });

  it("loads the active running session from the running endpoint", () => {
    const { result } = renderHook(() => useRunningActiveSession(), {
      wrapper: createWrapper(queryClient),
    });

    expect(mockUseGetQuery).toHaveBeenCalledWith({
      url: "/user/workout/running/active",
      queryProps: expect.objectContaining({
        queryKey: RUNNING_ACTIVE_QUERY_KEY,
      }),
    });
    expect(result.current.activeSession).toEqual(
      expect.objectContaining({
        workoutSessionId: "workout-1",
        status: "active",
      }),
    );
  });

  it("starts a running session and invalidates running queries", async () => {
    const response = {
      data: {
        data: {
          workoutSessionId: "workout-2",
          status: "active",
        },
      },
    };
    const mutateAsync = vi.fn().mockResolvedValue(response);
    mockUsePostQuery.mockReturnValue({ mutateAsync, isPending: false });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useStartRunningSession(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.startRunningSession({
        clientSessionId: "client-run-1",
      });
    });

    expect(mutateAsync).toHaveBeenCalledWith({
      url: "/user/workout/running/start",
      attributes: {
        clientSessionId: "client-run-1",
      },
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: RUNNING_ACTIVE_QUERY_KEY,
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: RUNNING_SESSIONS_QUERY_KEY,
    });
  });

  it("uploads running points in batches", async () => {
    const mutateAsync = vi.fn().mockResolvedValue({
      data: {
        data: {
          acceptedCount: 1,
        },
      },
    });
    mockUsePostQuery.mockReturnValue({ mutateAsync, isPending: false });
    const { result } = renderHook(() => useAppendRunningPoints(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.appendPoints("workout-1", [
        {
          sequence: 1,
          latitude: 41.311081,
          longitude: 69.240562,
          sourceTimestamp: "2026-05-12T10:00:00.000Z",
        },
      ]);
    });

    expect(mutateAsync).toHaveBeenCalledWith({
      url: "/user/workout/running/workout-1/points/batch",
      attributes: {
        points: [
          expect.objectContaining({
            sequence: 1,
            latitude: 41.311081,
          }),
        ],
      },
    });
  });

  it("keeps detail route points for map rendering", () => {
    mockUseGetQuery.mockReturnValue({
      data: {
        data: {
          data: {
            workoutSessionId: "workout-1",
            status: "completed",
            metrics: {
              distanceMeters: 1000,
            },
            points: [
              {
                sequence: 1,
                latitude: 41.311081,
                longitude: 69.240562,
              },
            ],
          },
        },
      },
      isLoading: false,
    });

    const { result } = renderHook(
      () => useRunningSessionDetail("workout-1"),
      {
        wrapper: createWrapper(queryClient),
      },
    );

    expect(result.current.session.points).toEqual([
      expect.objectContaining({
        sequence: 1,
        latitude: 41.311081,
        longitude: 69.240562,
      }),
    ]);
  });
});
