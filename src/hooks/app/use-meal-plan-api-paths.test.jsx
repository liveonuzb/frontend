import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  deleteMutateAsync: vi.fn(),
  invalidateAiAccess: vi.fn(),
  patchMutateAsync: vi.fn(),
  postMutateAsync: vi.fn(),
  putMutateAsync: vi.fn(),
  setQueryData: vi.fn(),
  useGetQuery: vi.fn(),
}));

vi.mock("@/hooks/api", () => ({
  useDeleteQuery: () => ({
    mutateAsync: mocks.deleteMutateAsync,
    isPending: false,
  }),
  useGetQuery: (...args) => mocks.useGetQuery(...args),
  usePatchQuery: () => ({
    mutateAsync: mocks.patchMutateAsync,
    isPending: false,
  }),
  usePostQuery: () => ({
    mutateAsync: mocks.postMutateAsync,
    isPending: false,
  }),
  usePutQuery: () => ({
    mutateAsync: mocks.putMutateAsync,
    isPending: false,
  }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    setQueryData: mocks.setQueryData,
  }),
}));

vi.mock("@/hooks/app/use-ai-access", () => ({
  useAiAccessInvalidation: () => ({
    invalidateAiAccess: mocks.invalidateAiAccess,
  }),
}));

import {
  MEAL_PLAN_QUERY_KEY,
  MEAL_PLAN_TEMPLATES_QUERY_KEY,
  getMealPlanShoppingListsQueryKey,
  getMealPlanTemplateConflictPreviewQueryKey,
  getMealPlanTemplateDetailQueryKey,
  useGenerateMealPlanShoppingList,
  useMealPlan,
  useMealPlanShoppingLists,
  useMealPlanTemplateConflictPreview,
  useMealPlanTemplateDetail,
  useMealPlanTemplates,
  useUpdateShoppingListItemCheck,
} from "./use-meal-plan.js";

const mutationResponse = {
  data: {
    data: {
      plans: [],
      activePlan: null,
      draftPlan: null,
    },
  },
};

describe("meal plan canonical API paths", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.deleteMutateAsync.mockResolvedValue(mutationResponse);
    mocks.invalidateAiAccess.mockResolvedValue(undefined);
    mocks.patchMutateAsync.mockResolvedValue({
      data: {
        data: {
          id: "shopping-list-1",
          items: [],
        },
      },
    });
    mocks.postMutateAsync.mockResolvedValue(mutationResponse);
    mocks.putMutateAsync.mockResolvedValue(mutationResponse);
    mocks.useGetQuery.mockReturnValue({
      data: mutationResponse,
      isLoading: false,
    });
  });

  it("loads and mutates user meal plans through canonical meal-plan routes", async () => {
    const { result } = renderHook(() => useMealPlan());

    expect(mocks.useGetQuery).toHaveBeenCalledWith({
      url: "/user/nutrition/meal-plans",
      queryProps: {
        queryKey: MEAL_PLAN_QUERY_KEY,
        enabled: true,
      },
    });

    await act(async () => {
      await result.current.saveDraftPlan({ name: "Plan", days: [] });
      await result.current.saveDraftPlan({
        id: "plan-1",
        name: "Plan",
        days: [],
      });
      await result.current.startPlan({ id: "plan-1", name: "Plan", days: [] });
      await result.current.pausePlan("plan-1");
      await result.current.duplicatePlan("plan-1");
      await result.current.archivePlan("plan-1");
      await result.current.rescalePlanCalories("plan-1");
    });

    expect(mocks.postMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/user/nutrition/meal-plans",
      }),
    );
    expect(mocks.putMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/user/nutrition/meal-plans/plan-1",
      }),
    );
    expect(mocks.postMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/user/nutrition/meal-plans/plan-1/activate",
      }),
    );
    expect(mocks.postMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/user/nutrition/meal-plans/plan-1/pause",
      }),
    );
    expect(mocks.postMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/user/nutrition/meal-plans/plan-1/duplicate",
      }),
    );
    expect(mocks.postMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/user/nutrition/meal-plans/plan-1/archive",
      }),
    );
    expect(mocks.postMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/user/nutrition/meal-plans/plan-1/rescale-calories",
      }),
    );
  });

  it("loads meal plan templates through canonical template routes", () => {
    renderHook(() => useMealPlanTemplates({ goal: "lose-weight" }));

    expect(mocks.useGetQuery).toHaveBeenCalledWith({
      url: "/user/nutrition/meal-plan-templates",
      params: { goal: "lose-weight" },
      queryProps: {
        queryKey: [...MEAL_PLAN_TEMPLATES_QUERY_KEY, { goal: "lose-weight" }],
        enabled: true,
      },
    });
  });

  it("loads template details and previews through canonical template routes", () => {
    renderHook(() => useMealPlanTemplateDetail("template-1"));
    renderHook(() => useMealPlanTemplateConflictPreview("template-1"));

    expect(mocks.useGetQuery).toHaveBeenCalledWith({
      url: "/user/nutrition/meal-plan-templates/template-1",
      queryProps: {
        queryKey: getMealPlanTemplateDetailQueryKey("template-1"),
        enabled: true,
      },
    });
    expect(mocks.useGetQuery).toHaveBeenCalledWith({
      url: "/user/nutrition/meal-plan-templates/template-1/conflicts/preview",
      queryProps: {
        queryKey: getMealPlanTemplateConflictPreviewQueryKey("template-1"),
        enabled: true,
      },
    });
  });

  it("applies templates and manages shopping lists through canonical routes", async () => {
    const mealPlan = renderHook(() => useMealPlan());
    const shoppingListGenerator = renderHook(() =>
      useGenerateMealPlanShoppingList(),
    );
    const shoppingLists = renderHook(() => useMealPlanShoppingLists("plan-1"));
    const itemCheck = renderHook(() => useUpdateShoppingListItemCheck("plan-1"));

    await act(async () => {
      await mealPlan.result.current.applyTemplatePlan("template-1");
      await shoppingListGenerator.result.current.generateShoppingList("plan-1", {
        regionKey: "tashkent",
      });
      await itemCheck.result.current.updateShoppingListItemCheck(
        "list-1",
        "item-1",
        true,
      );
    });

    expect(mocks.postMutateAsync).toHaveBeenCalledWith({
      url: "/user/nutrition/meal-plan-templates/template-1/apply",
      attributes: {},
    });
    expect(mocks.postMutateAsync).toHaveBeenCalledWith({
      url: "/user/nutrition/meal-plans/plan-1/shopping-list",
      attributes: { regionKey: "tashkent" },
    });
    expect(mocks.useGetQuery).toHaveBeenCalledWith({
      url: "/user/nutrition/meal-plans/plan-1/shopping-lists",
      queryProps: {
        queryKey: getMealPlanShoppingListsQueryKey("plan-1"),
        enabled: true,
      },
    });
    expect(mocks.patchMutateAsync).toHaveBeenCalledWith({
      url: "/user/nutrition/shopping-lists/list-1/items/item-1",
      attributes: { isChecked: true },
    });
    expect(shoppingLists.result.current.shoppingLists).toEqual([]);
  });
});
