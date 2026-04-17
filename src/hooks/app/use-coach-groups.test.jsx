import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
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

import { useCoachGroups } from "./use-coach-groups";

describe("useCoachGroups", () => {
  const createMutateAsync = vi.fn();
  const addClientsMutateAsync = vi.fn();
  const assignMealMutateAsync = vi.fn();
  const assignWorkoutMutateAsync = vi.fn();
  const updateMutateAsync = vi.fn();
  const deleteMutateAsync = vi.fn();

  const wrapper = ({ children }) => (
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseGetQuery.mockReturnValue({
      data: {
        data: {
          items: [],
        },
      },
      isLoading: false,
    });
    mockUsePostQuery
      .mockReturnValueOnce({ mutateAsync: createMutateAsync, isPending: false })
      .mockReturnValueOnce({
        mutateAsync: addClientsMutateAsync,
        isPending: false,
      })
      .mockReturnValueOnce({
        mutateAsync: assignMealMutateAsync,
        isPending: false,
      })
      .mockReturnValueOnce({
        mutateAsync: assignWorkoutMutateAsync,
        isPending: false,
      });
    mockUsePatchQuery.mockReturnValue({
      mutateAsync: updateMutateAsync,
      isPending: false,
    });
    mockUseDeleteQuery.mockReturnValue({
      mutateAsync: deleteMutateAsync,
      isPending: false,
    });
  });

  it("uses telegram-groups endpoints for listing and mutations", async () => {
    const { result } = renderHook(() => useCoachGroups(), { wrapper });

    expect(mockUseGetQuery).toHaveBeenCalledWith({
      url: "/coach/telegram-groups",
      queryProps: {
        queryKey: ["coach", "groups"],
      },
    });

    await act(async () => {
      await result.current.addGroup({ name: "VIP" });
      await result.current.updateGroup("group-1", { name: "Updated" });
      await result.current.removeGroup("group-1");
      await result.current.addClientsToGroup("group-1", ["client-1"]);
      await result.current.assignMealPlanToGroup("group-1", "meal-1");
      await result.current.assignWorkoutPlanToGroup("group-1", "workout-1");
    });

    expect(createMutateAsync).toHaveBeenCalledWith({
      url: "/coach/telegram-groups",
      attributes: { name: "VIP" },
    });
    expect(updateMutateAsync).toHaveBeenCalledWith({
      url: "/coach/telegram-groups/group-1",
      attributes: { name: "Updated" },
    });
    expect(deleteMutateAsync).toHaveBeenCalledWith({
      url: "/coach/telegram-groups/group-1",
    });
    expect(addClientsMutateAsync).toHaveBeenCalledWith({
      url: "/coach/telegram-groups/group-1/clients",
      attributes: { clientIds: ["client-1"] },
    });
    expect(assignMealMutateAsync).toHaveBeenCalledWith({
      url: "/coach/telegram-groups/group-1/assign-meal-plan",
      attributes: { planId: "meal-1" },
    });
    expect(assignWorkoutMutateAsync).toHaveBeenCalledWith({
      url: "/coach/telegram-groups/group-1/assign-workout-plan",
      attributes: { planId: "workout-1" },
    });
  });
});
