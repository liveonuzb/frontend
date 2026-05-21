import React from "react";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPost = vi.fn();

vi.mock("@/hooks/api/use-api", () => ({
  api: {
    post: (...args) => mockPost(...args),
  },
}));

import {
  AI_CREDIT_COSTS_QUERY_KEY,
  AI_CREDIT_WALLET_QUERY_KEY,
} from "@/hooks/app/use-ai-credits";
import {
  USER_AI_REPORT_QUERY_KEY,
  useGenerateUserAiReport,
} from "./use-user-ai-reports.js";

const createWrapper = (queryClient) =>
  function Wrapper({ children }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };

describe("useGenerateUserAiReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("invalidates report and AI credit caches after successful generation", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    mockPost.mockResolvedValue({
      data: {
        data: {
          id: "report-1",
          period: "weekly",
          cached: false,
        },
      },
    });

    const { result } = renderHook(() => useGenerateUserAiReport(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync("weekly");
    });

    expect(mockPost).toHaveBeenCalledWith("/user/reports", {
      period: "weekly",
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [...USER_AI_REPORT_QUERY_KEY, "history"],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [...USER_AI_REPORT_QUERY_KEY, "limits"],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: AI_CREDIT_WALLET_QUERY_KEY,
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: AI_CREDIT_COSTS_QUERY_KEY,
    });
  });
});
