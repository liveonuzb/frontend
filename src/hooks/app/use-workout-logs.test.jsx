import React from "react";
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUseGetQuery = vi.fn();
const mockUsePostQuery = vi.fn();
const mockUsePatchQuery = vi.fn();
const mockUseDeleteQuery = vi.fn();

vi.mock("@/hooks/api", () => ({
  useGetQuery: (...args) => mockUseGetQuery(...args),
  usePostQuery: (...args) => mockUsePostQuery(...args),
  usePatchQuery: (...args) => mockUsePatchQuery(...args),
  useDeleteQuery: (...args) => mockUseDeleteQuery(...args),
}));

import {
  WORKOUT_LOGS_QUERY_KEY,
  useCreateWorkoutLog,
  useWorkoutLogs,
} from "./use-workout-logs.js";
import { WORKOUT_OVERVIEW_QUERY_KEY } from "./use-workout-overview.js";
import { WORKOUT_PLANS_QUERY_KEY } from "./use-workout-plans.js";
import { getDailyTrackingQueryKey } from "./use-daily-tracking.js";

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

describe("useWorkoutLogs", () => {
  let queryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createQueryClient();

    mockUseGetQuery.mockReturnValue({
      data: {
        data: {
          data: [
            {
              id: "group-1",
              date: "2026-04-14",
              source: "quick-log",
              sessionName: "Push day",
              exercise: {
                id: "exercise-1",
                name: "Bench Press",
                imageUrl: null,
                trackingType: "REPS_WEIGHT",
              },
              entries: [
                {
                  id: "entry-1",
                  reps: 8,
                  weight: 80,
                  durationSeconds: 0,
                  distanceMeters: 0,
                  durationMinutes: 2,
                  burnedCalories: 12,
                  addedAt: "2026-04-14T08:00:00.000Z",
                },
              ],
              summary: {
                totalSets: 1,
                maxReps: 8,
                maxWeight: 80,
                totalDurationSeconds: 0,
                totalDurationMinutes: 2,
                totalDistanceMeters: 0,
                totalBurnedCalories: 12,
              },
              addedAt: "2026-04-14T08:00:00.000Z",
              updatedAt: "2026-04-14T08:00:00.000Z",
            },
          ],
        },
      },
      isLoading: false,
    });
    mockUsePatchQuery.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    mockUseDeleteQuery.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
  });

  it("normalizes grouped log resources from the new workout endpoint", () => {
    const { result } = renderHook(
      () =>
        useWorkoutLogs({
          from: "2026-04-14",
          to: "2026-04-14",
        }),
      {
        wrapper: createWrapper(queryClient),
      },
    );

    expect(result.current.items).toEqual([
      expect.objectContaining({
        id: "group-1",
        name: "Bench Press",
        trackingType: "REPS_WEIGHT",
        totalSets: 1,
        items: [expect.objectContaining({ id: "entry-1", reps: 8, weight: 80 })],
      }),
    ]);
  });

  it("invalidates workout feature queries after creating a grouped log", async () => {
    const response = {
      data: {
        data: {
          id: "group-2",
          date: "2026-04-14",
          source: "quick-log",
          sessionName: "Leg day",
          exercise: {
            id: "exercise-2",
            name: "Squat",
            imageUrl: null,
            trackingType: "REPS_WEIGHT",
          },
          entries: [
            {
              id: "entry-2",
              reps: 6,
              weight: 100,
              durationSeconds: 0,
              distanceMeters: 0,
              durationMinutes: 2,
              burnedCalories: 15,
              addedAt: "2026-04-14T09:00:00.000Z",
            },
          ],
          summary: {
            totalSets: 1,
            maxReps: 6,
            maxWeight: 100,
            totalDurationSeconds: 0,
            totalDurationMinutes: 2,
            totalDistanceMeters: 0,
            totalBurnedCalories: 15,
          },
          addedAt: "2026-04-14T09:00:00.000Z",
          updatedAt: "2026-04-14T09:00:00.000Z",
        },
      },
    };

    mockUsePostQuery.mockImplementation((options = {}) => ({
      mutateAsync: async () => {
        await options?.mutationProps?.onSuccess?.(response);
        return response;
      },
      isPending: false,
    }));

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useCreateWorkoutLog(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.createLog({
        date: "2026-04-14",
        name: "Squat",
        source: "quick-log",
        entries: [{ reps: 6, weight: 100 }],
      });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: WORKOUT_LOGS_QUERY_KEY,
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: WORKOUT_OVERVIEW_QUERY_KEY,
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: WORKOUT_PLANS_QUERY_KEY,
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: getDailyTrackingQueryKey("2026-04-14"),
    });
  });
});
