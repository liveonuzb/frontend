import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  deleteMutateAsync: vi.fn(),
  getQueryData: vi.fn(),
  invalidateQueries: vi.fn(),
  patchMutateAsync: vi.fn(),
  postMutateAsync: vi.fn(),
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
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    getQueryData: mocks.getQueryData,
    invalidateQueries: mocks.invalidateQueries,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    warning: vi.fn(),
  },
}));

import {
  SAVED_MEALS_QUERY_KEY,
  buildSavedMealPayload,
  useSavedMeals,
  useSavedMealsActions,
} from "./use-saved-meals.js";

describe("saved meal API hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.deleteMutateAsync.mockResolvedValue({});
    mocks.getQueryData.mockReturnValue(null);
    mocks.invalidateQueries.mockResolvedValue(undefined);
    mocks.patchMutateAsync.mockResolvedValue({
      data: { data: { id: "saved-1", name: "Updated", ingredients: [] } },
    });
    mocks.postMutateAsync.mockResolvedValue({
      data: { data: { id: "saved-1", name: "Tovuq bowl", ingredients: [] } },
    });
    mocks.useGetQuery.mockReturnValue({
      data: {
        data: {
          data: {
            items: [{ id: "saved-1", name: "Tovuq bowl", ingredients: [] }],
          },
        },
      },
      isLoading: false,
    });
  });

  it("loads saved meals through the canonical nutrition saved-meals route", () => {
    const { result } = renderHook(() => useSavedMeals({ enabled: false }));

    expect(mocks.useGetQuery).toHaveBeenCalledWith({
      url: "/user/nutrition/saved-meals",
      queryProps: {
        queryKey: SAVED_MEALS_QUERY_KEY,
        enabled: false,
      },
    });
    expect(result.current.items).toEqual([
      expect.objectContaining({
        id: "saved-1",
        name: "Tovuq bowl",
      }),
    ]);
  });

  it("mutates saved meals through canonical nutrition saved-meals routes", async () => {
    const { result } = renderHook(() => useSavedMealsActions());

    await act(async () => {
      await result.current.createSavedMeal({ name: "Tovuq bowl" });
      await result.current.updateSavedMeal("saved-1", { name: "Updated" });
      await result.current.deleteSavedMeal("saved-1");
    });

    expect(mocks.postMutateAsync).toHaveBeenCalledWith({
      url: "/user/nutrition/saved-meals",
      attributes: {
        name: "Tovuq bowl",
        source: null,
        imageUrl: null,
        ingredients: [],
      },
    });
    expect(mocks.patchMutateAsync).toHaveBeenCalledWith({
      url: "/user/nutrition/saved-meals/saved-1",
      attributes: {
        name: "Updated",
        source: null,
        imageUrl: null,
        ingredients: [],
      },
    });
    expect(mocks.deleteMutateAsync).toHaveBeenCalledWith({
      url: "/user/nutrition/saved-meals/saved-1",
    });
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({
      queryKey: SAVED_MEALS_QUERY_KEY,
    });
  });
});

describe("saved meal payload helpers", () => {
  it("preserves ingredient review and catalog snapshot fields", () => {
    const payload = buildSavedMealPayload({
      name: "  Tovuq bowl  ",
      source: "camera",
      imageUrl: "https://cdn.example.com/bowl.jpg",
      ingredients: [
        {
          id: "rice",
          name: "Guruch",
          grams: 150,
          estimatedGrams: 100,
          estimatedQuantity: 1.5,
          estimatedUnit: "piyola",
          nutritionSource: "catalog",
          matchStatus: "matched",
          reviewNeeded: true,
          matchedFood: {
            id: "42",
            name: "Pishgan guruch",
            servingSize: "100",
            servingUnit: "g",
            imageUrl: "https://cdn.example.com/rice.jpg",
            ignoredField: "not-sent",
          },
          nutrition: {
            calories: 130,
            protein: 2.7,
            carbs: 28,
            fat: 0.3,
            fiber: 0.4,
          },
        },
      ],
    });

    expect(payload).toEqual({
      name: "Tovuq bowl",
      source: "camera",
      imageUrl: "https://cdn.example.com/bowl.jpg",
      ingredients: [
        {
          id: "rice",
          name: "Guruch",
          grams: 150,
          estimatedGrams: 100,
          estimatedQuantity: 1.5,
          estimatedUnit: "piyola",
          nutritionSource: "catalog",
          matchStatus: "matched",
          reviewNeeded: true,
          matchedFood: {
            id: 42,
            name: "Pishgan guruch",
            servingSize: 100,
            servingUnit: "g",
            imageUrl: "https://cdn.example.com/rice.jpg",
          },
          nutrition: {
            calories: 195,
            protein: 4.1,
            carbs: 42,
            fat: 0.5,
            fiber: 0.6,
          },
        },
      ],
    });
  });
});
