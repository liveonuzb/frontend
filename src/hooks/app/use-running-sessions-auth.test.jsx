import React from "react";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUseGetQuery = vi.fn();
const mockUsePostQuery = vi.fn();

vi.mock("@/config.js", () => ({
  config: {
    runningFeatureEnabled: true,
  },
}));

vi.mock("@/store", () => ({
  useAuthStore: (selector) =>
    selector({
      isAuthenticated: false,
    }),
}));

vi.mock("@/hooks/api", () => ({
  useGetQuery: (...args) => mockUseGetQuery(...args),
  usePostQuery: (...args) => mockUsePostQuery(...args),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
};

describe("use-running-sessions auth state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGetQuery.mockReturnValue({
      data: null,
      isLoading: false,
    });
  });

  it("disables running stats queries while the user is unauthenticated", async () => {
    const { useRunningStatsSummary } = await import("./use-running-sessions.js");

    renderHook(() => useRunningStatsSummary(), {
      wrapper: createWrapper(),
    });

    expect(mockUseGetQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/user/workout/running/stats/summary",
        queryProps: expect.objectContaining({
          enabled: false,
        }),
      }),
    );
  });
});
