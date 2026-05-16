import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useWorkoutWeatherToday from "./use-workout-weather.js";

const mockUseGetQuery = vi.fn();

vi.mock("@/hooks/api", () => ({
  useGetQuery: (...args) => mockUseGetQuery(...args),
}));

describe("useWorkoutWeatherToday", () => {
  let getCurrentPosition;

  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentPosition = vi.fn();
    Object.defineProperty(window.navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition,
      },
    });
    mockUseGetQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
    });
  });

  it("requests browser location only once across widget rerenders", async () => {
    getCurrentPosition.mockImplementation((onSuccess) => {
      onSuccess({
        coords: {
          latitude: 41.311081,
          longitude: 69.240562,
        },
      });
    });

    const { rerender, result } = renderHook(() => useWorkoutWeatherToday());

    rerender();
    rerender();

    await waitFor(() => {
      expect(result.current.locationStatus).toBe("granted");
    });
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
    expect(mockUseGetQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({
        url: "/user/workout/weather/today?lat=41.311081&lon=69.240562",
        queryProps: expect.objectContaining({
          enabled: true,
        }),
      }),
    );
  });

  it("falls back to Tashkent when browser location is denied", async () => {
    getCurrentPosition.mockImplementation((_onSuccess, onError) => {
      onError(new Error("denied"));
    });

    const { result } = renderHook(() => useWorkoutWeatherToday());

    await waitFor(() => {
      expect(result.current.locationStatus).toBe("fallback");
    });
    expect(result.current.coordinates).toEqual({
      latitude: 41.311081,
      longitude: 69.240562,
    });
  });
});
