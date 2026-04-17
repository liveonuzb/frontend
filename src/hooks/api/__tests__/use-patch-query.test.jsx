import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";

// Mock the useApi hook so no real HTTP requests are made.
// The mock returns a `request` object whose `.patch` resolves with fake data.
const mockPatch = vi.fn();
vi.mock("@/hooks/api/use-api.js", () => ({
  default: () => ({ request: { patch: mockPatch } }),
}));

// Also mock lodash/isEmpty since the hook uses it to guard invalidation.
// The real implementation works fine, but we import it so the module resolves.

import usePatchQuery from "../use-patch-query.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a fresh QueryClient for each test to avoid cache leakage. */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

/** React wrapper that provides the QueryClient context. */
function createWrapper(queryClient) {
  return function Wrapper({ children }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("usePatchQuery", () => {
  let queryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createTestQueryClient();
  });

  it("returns mutate, mutateAsync, and isPending from useMutation", () => {
    const { result } = renderHook(() => usePatchQuery(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current).toHaveProperty("mutate");
    expect(result.current).toHaveProperty("mutateAsync");
    expect(result.current).toHaveProperty("isPending");
    expect(typeof result.current.mutate).toBe("function");
    expect(typeof result.current.mutateAsync).toBe("function");
    expect(typeof result.current.isPending).toBe("boolean");
  });

  it("calls request.patch with the provided url, attributes, and config", async () => {
    const responseData = { data: { id: 1, name: "updated" } };
    mockPatch.mockResolvedValueOnce(responseData);

    const { result } = renderHook(
      () => usePatchQuery({ queryKey: ["items", 1] }),
      { wrapper: createWrapper(queryClient) },
    );

    await act(async () => {
      result.current.mutate({
        url: "/items/1",
        attributes: { name: "updated" },
        config: { headers: { "X-Custom": "true" } },
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockPatch).toHaveBeenCalledOnce();
    expect(mockPatch).toHaveBeenCalledWith(
      "/items/1",
      { name: "updated" },
      { headers: { "X-Custom": "true" } },
    );
  });

  it("invalidates queryKey and listKey on success", async () => {
    mockPatch.mockResolvedValueOnce({ data: { ok: true } });

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(
      () =>
        usePatchQuery({
          queryKey: ["item", 1],
          listKey: ["items"],
        }),
      { wrapper: createWrapper(queryClient) },
    );

    await act(async () => {
      result.current.mutate({
        url: "/items/1",
        attributes: { name: "changed" },
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // The hook calls invalidateQueries twice: once for queryKey, once for listKey.
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["item", 1] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["items"] });

    invalidateSpy.mockRestore();
  });

  it("calls the onSuccess callback from mutationProps after query invalidation", async () => {
    const responseData = { data: { id: 1 } };
    mockPatch.mockResolvedValueOnce(responseData);

    const onSuccess = vi.fn();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(
      () =>
        usePatchQuery({
          queryKey: ["item", 1],
          mutationProps: { onSuccess },
        }),
      { wrapper: createWrapper(queryClient) },
    );

    const variables = { url: "/items/1", attributes: { name: "test" } };

    await act(async () => {
      result.current.mutate(variables);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Invalidation should have been called before onSuccess.
    expect(invalidateSpy).toHaveBeenCalled();

    // The user-provided onSuccess should have been called with (data, variables, context).
    expect(onSuccess).toHaveBeenCalledOnce();
    expect(onSuccess).toHaveBeenCalledWith(
      responseData,
      expect.objectContaining({ url: "/items/1" }),
      undefined,
    );

    invalidateSpy.mockRestore();
  });

  it("skips invalidation when queryKey is empty", async () => {
    mockPatch.mockResolvedValueOnce({ data: {} });

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const onSuccess = vi.fn();

    const { result } = renderHook(
      () =>
        usePatchQuery({
          queryKey: [],
          listKey: ["items"],
          mutationProps: { onSuccess },
        }),
      { wrapper: createWrapper(queryClient) },
    );

    await act(async () => {
      result.current.mutate({ url: "/items/1", attributes: {} });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // With empty queryKey, invalidation should be skipped entirely.
    expect(invalidateSpy).not.toHaveBeenCalled();

    // But onSuccess should still be called.
    expect(onSuccess).toHaveBeenCalledOnce();

    invalidateSpy.mockRestore();
  });

  it("isPending is true while the mutation is in flight", async () => {
    let resolvePatch;
    mockPatch.mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePatch = resolve;
      }),
    );

    const { result } = renderHook(() => usePatchQuery(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.isPending).toBe(false);

    act(() => {
      result.current.mutate({ url: "/items/1", attributes: {} });
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));

    await act(async () => {
      resolvePatch({ data: { ok: true } });
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
  });
});
