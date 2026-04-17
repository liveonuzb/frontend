import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUseGetQuery = vi.fn();

vi.mock("@/hooks/api", () => ({
  useGetQuery: (...args) => mockUseGetQuery(...args),
}));

vi.mock("@/store", () => ({
  useAuthStore: (selector) =>
    selector({
      isAuthenticated: true,
    }),
}));

import useMe, { ME_QUERY_KEY } from "./use-me.js";

describe("useMe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("unwraps the wrapped /users/me response into user and onboarding data", () => {
    mockUseGetQuery.mockReturnValue({
      data: {
        data: {
          data: {
            id: "user-1",
            onboarding: {
              gender: "male",
              height: {
                value: 182,
                unit: "cm",
              },
              currentWeight: {
                value: 82,
                unit: "kg",
              },
            },
          },
        },
      },
      isLoading: false,
    });

    const { result } = renderHook(() => useMe());

    expect(mockUseGetQuery).toHaveBeenCalledWith({
      url: "/users/me",
      queryProps: {
        queryKey: ME_QUERY_KEY,
        enabled: true,
      },
    });
    expect(result.current.user).toEqual({
      id: "user-1",
      onboarding: {
        gender: "male",
        height: {
          value: 182,
          unit: "cm",
        },
        currentWeight: {
          value: 82,
          unit: "kg",
        },
      },
    });
    expect(result.current.onboarding).toEqual({
      firstName: null,
      lastName: null,
      gender: "male",
      age: null,
      height: {
        value: 182,
        unit: "cm",
      },
      currentWeight: {
        value: 82,
        unit: "kg",
      },
      goal: null,
      targetWeight: null,
      weeklyPace: null,
      activityLevel: null,
      mealFrequency: null,
      waterHabits: null,
      dietRestrictions: [],
    });
  });

  it("returns nulls when the wrapped response has no user payload", () => {
    mockUseGetQuery.mockReturnValue({
      data: {
        data: {
          data: null,
        },
      },
      isLoading: false,
    });

    const { result } = renderHook(() => useMe());

    expect(result.current.user).toBeNull();
    expect(result.current.onboarding).toBeNull();
  });
});
