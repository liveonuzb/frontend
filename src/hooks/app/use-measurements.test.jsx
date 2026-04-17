import React from "react";
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUseGetQuery = vi.fn();
const mockUsePostQuery = vi.fn();
const mockUseDeleteQuery = vi.fn();

vi.mock("@/hooks/api", () => ({
  useGetQuery: (...args) => mockUseGetQuery(...args),
  usePostQuery: (...args) => mockUsePostQuery(...args),
  useDeleteQuery: (...args) => mockUseDeleteQuery(...args),
}));

import {
  MEASUREMENTS_QUERY_KEY,
  MEASUREMENTS_TRENDS_QUERY_KEY,
} from "./use-measurements.js";
import useMeasurements from "./use-measurements.js";

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

describe("useMeasurements", () => {
  let queryClient;
  let mockSaveMutation;
  let mockDeleteMutation;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createQueryClient();
    mockSaveMutation = vi.fn();
    mockDeleteMutation = vi.fn();

    mockUseGetQuery.mockReturnValue({
      data: {
        data: {
          data: [
            {
              id: "latest-entry",
              date: "2026-04-14",
              weight: 82,
              chest: 101,
            },
            {
              id: "history-entry",
              date: "2026-04-01",
              weight: 80,
              chest: 96,
            },
          ],
        },
      },
      isLoading: false,
    });
    mockUsePostQuery.mockReturnValue({
      mutateAsync: mockSaveMutation,
      isPending: false,
    });
    mockUseDeleteQuery.mockReturnValue({
      mutateAsync: mockDeleteMutation,
      isPending: false,
    });
  });

  it("updates the matching day without corrupting the latest cached entry", async () => {
    mockSaveMutation.mockResolvedValueOnce({
      data: {
        data: {
          id: "history-entry",
          date: "2026-04-01",
          weight: 80,
          chest: 98,
        },
      },
    });

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useMeasurements(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.saveMeasurement({
        id: "latest-entry",
        date: "2026-04-01",
        chest: 98,
      });
    });

    expect(mockSaveMutation).toHaveBeenCalledWith({
      url: "/measurements",
      attributes: {
        date: "2026-04-01",
        weight: undefined,
        chest: 98,
        waist: undefined,
        hips: undefined,
        arm: undefined,
        thigh: undefined,
        neck: undefined,
        bodyFat: undefined,
      },
    });

    expect(queryClient.getQueryData(MEASUREMENTS_QUERY_KEY)).toEqual({
      data: [
        {
          id: "latest-entry",
          date: "2026-04-14",
          weight: 82,
          chest: 101,
          waist: 0,
          hips: 0,
          arm: 0,
          thigh: 0,
          neck: 0,
          bodyFat: 0,
        },
        {
          id: "history-entry",
          date: "2026-04-01",
          weight: 80,
          chest: 98,
          waist: 0,
          hips: 0,
          arm: 0,
          thigh: 0,
          neck: 0,
          bodyFat: 0,
        },
      ],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: MEASUREMENTS_TRENDS_QUERY_KEY,
    });
  });

  it("removes a measurement from cache and invalidates trends on delete", async () => {
    mockDeleteMutation.mockResolvedValueOnce({
      data: { id: "history-entry" },
    });

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useMeasurements(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.deleteMeasurement("2026-04-01");
    });

    expect(mockDeleteMutation).toHaveBeenCalledWith({
      url: "/measurements/history-entry",
    });
    expect(queryClient.getQueryData(MEASUREMENTS_QUERY_KEY)).toEqual({
      data: [
        {
          id: "latest-entry",
          date: "2026-04-14",
          weight: 82,
          chest: 101,
          waist: 0,
          hips: 0,
          arm: 0,
          thigh: 0,
          neck: 0,
          bodyFat: 0,
        },
      ],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: MEASUREMENTS_TRENDS_QUERY_KEY,
    });
  });
});
