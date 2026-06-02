import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUseGetQuery = vi.fn();
const mockUsePostQuery = vi.fn();
const mockCreateMutateAsync = vi.fn();
const mockUpdateMutateAsync = vi.fn();
const mockDeleteMutateAsync = vi.fn();
const mockScanMutateAsync = vi.fn();
const mockRecipeMutateAsync = vi.fn();
const mockSubstitutionMutateAsync = vi.fn();
const mockInvalidateQueries = vi.fn();
const mockInvalidateAiAccess = vi.fn();

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
}));

vi.mock("@/hooks/api", () => ({
  useGetQuery: (...args) => mockUseGetQuery(...args),
  usePostQuery: (...args) => mockUsePostQuery(...args),
  usePatchQuery: () => ({
    mutateAsync: mockUpdateMutateAsync,
    isPending: false,
  }),
  useDeleteQuery: () => ({
    mutateAsync: mockDeleteMutateAsync,
    isPending: false,
  }),
  usePostFileQuery: () => ({
    mutateAsync: mockScanMutateAsync,
    isPending: false,
  }),
}));

vi.mock("@/hooks/app/use-ai-access", () => ({
  AI_USAGE_STATUS_QUERY_KEY: ["user", "ai-usage", "status"],
  useAiAccessInvalidation: () => ({
    invalidateAiAccess: mockInvalidateAiAccess,
  }),
}));

import {
  NUTRITION_AI_PANTRY_QUERY_KEY,
  normalizeNutritionAiCards,
  useNutritionAiPantry,
} from "./use-nutrition-ai.js";

describe("useNutritionAiPantry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    let postHookCall = 0;
    mockUsePostQuery.mockImplementation(() => {
      postHookCall += 1;
      if (postHookCall === 1) {
        return { mutateAsync: mockCreateMutateAsync, isPending: false };
      }
      if (postHookCall === 2) {
        return { mutateAsync: mockRecipeMutateAsync, isPending: false };
      }
      return { mutateAsync: mockSubstitutionMutateAsync, isPending: false };
    });
    mockUseGetQuery.mockReturnValue({
      data: {
        data: {
          data: [
            {
              id: "pantry-1",
              name: "Guruch",
              quantity: 2,
              unit: "kg",
              grams: 2000,
              source: "manual",
            },
          ],
        },
      },
      isLoading: false,
    });
    mockCreateMutateAsync.mockResolvedValue({
      data: { data: { id: "pantry-2", name: "Tuxum", quantity: 10 } },
    });
    mockUpdateMutateAsync.mockResolvedValue({
      data: { data: { id: "pantry-1", name: "Guruch", notes: "Kam qoldi" } },
    });
    mockScanMutateAsync.mockResolvedValue({
      data: {
        data: {
          suggestions: [
            { name: "kartoshka", ingredientId: 11, confidence: 0.82 },
          ],
          reviewOnly: true,
        },
      },
    });
    mockRecipeMutateAsync.mockResolvedValue({
      data: {
        data: {
          foodId: 20,
          cards: [{ type: "recipeSteps", items: [{ body: "Yuving." }] }],
        },
      },
    });
    mockSubstitutionMutateAsync.mockResolvedValue({
      data: {
        data: {
          substitutions: [
            { replacementIngredientId: 2, deltaUzS: -8000 },
          ],
        },
      },
    });
  });

  it("loads pantry items and sends CRUD requests to nutrition AI endpoints", async () => {
    const { result } = renderHook(() => useNutritionAiPantry());

    expect(mockUseGetQuery).toHaveBeenCalledWith({
      url: "/user/nutrition-ai/pantry",
      queryProps: {
        queryKey: NUTRITION_AI_PANTRY_QUERY_KEY,
        enabled: true,
      },
    });
    expect(result.current.pantryItems).toEqual([
      expect.objectContaining({ id: "pantry-1", name: "Guruch", grams: 2000 }),
    ]);

    await act(async () => {
      await result.current.createPantryItem({ name: "Tuxum", quantity: 10 });
      await result.current.updatePantryItem("pantry-1", { notes: "Kam qoldi" });
      await result.current.deletePantryItem("pantry-1");
    });

    expect(mockCreateMutateAsync).toHaveBeenCalledWith({
      url: "/user/nutrition-ai/pantry/items",
      attributes: { name: "Tuxum", quantity: 10 },
    });
    expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
      url: "/user/nutrition-ai/pantry/items/pantry-1",
      attributes: { notes: "Kam qoldi" },
    });
    expect(mockDeleteMutateAsync).toHaveBeenCalledWith({
      url: "/user/nutrition-ai/pantry/items/pantry-1",
    });
  });

  it("keeps pantry scan review-only and invalidates AI quota", async () => {
    const { result } = renderHook(() => useNutritionAiPantry());
    const file = new File(["image"], "ombor.jpg", { type: "image/jpeg" });

    let scanResult;
    await act(async () => {
      scanResult = await result.current.scanPantryImage(file);
    });

    expect(mockScanMutateAsync).toHaveBeenCalledWith({
      url: "/user/nutrition-ai/pantry/scan",
      attributes: expect.any(FormData),
      config: {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    });
    expect(mockInvalidateAiAccess).toHaveBeenCalled();
    expect(scanResult).toEqual({
      suggestions: [
        { name: "kartoshka", ingredientId: 11, confidence: 0.82 },
      ],
      reviewOnly: true,
    });
  });

  it("normalizes recipe assistant cards and substitution responses", async () => {
    const { result } = renderHook(() => useNutritionAiPantry());

    let recipe;
    let substitutions;
    await act(async () => {
      recipe = await result.current.getRecipeAssistant({ foodId: 20 });
      substitutions = await result.current.getSubstitutions({
        ingredientId: 1,
        grams: 200,
      });
    });

    expect(mockRecipeMutateAsync).toHaveBeenCalledWith({
      url: "/user/nutrition-ai/recipe-assistant",
      attributes: { foodId: 20 },
    });
    expect(recipe.cards).toEqual([
      { type: "recipeSteps", title: "", items: [{ body: "Yuving." }] },
    ]);
    expect(substitutions.substitutions).toEqual([
      { replacementIngredientId: 2, deltaUzS: -8000 },
    ]);
  });
});

describe("normalizeNutritionAiCards", () => {
  it("guards against malformed card payloads", () => {
    expect(normalizeNutritionAiCards([{ type: "x", items: "bad" }])).toEqual([
      { type: "x", title: "", items: [] },
    ]);
  });
});
