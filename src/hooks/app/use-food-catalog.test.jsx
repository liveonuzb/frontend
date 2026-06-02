import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUseGetQuery = vi.fn();

vi.mock("@/hooks/api", () => ({
  useDeleteQuery: vi.fn(),
  useGetQuery: (...args) => mockUseGetQuery(...args),
  usePostFileQuery: vi.fn(),
  usePostQuery: vi.fn(),
}));

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    useInfiniteQuery: vi.fn(),
    useQueryClient: vi.fn(),
  };
});

vi.mock("@/store/language-store", () => ({
  default: (selector) => selector({ currentLanguage: "uz" }),
}));

vi.mock("@/hooks/app/use-ai-access", () => ({
  useAiAccessInvalidation: () => ({ invalidateAiAccess: vi.fn() }),
}));

import {
  FOOD_RECIPE_QUERY_KEY,
  useFoodRecipe,
} from "./use-food-catalog.js";

describe("useFoodRecipe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGetQuery.mockReturnValue({
      data: {
        data: {
          food: {
            id: 12,
            name: "Mastava",
            translations: { uz: "Mastava", en: "Rice soup" },
            calories: 180,
            protein: 8,
            carbs: 24,
            fat: 6,
            servingSize: 300,
            servingUnit: "g",
            isActive: true,
            ingredients: [
              {
                id: 1,
                name: "Rice",
                translations: { uz: "Guruch", en: "Rice" },
                amount: 40,
                unit: "g",
              },
            ],
          },
          recipeInstructions: [
            { stepNumber: 1, text: "Masalliqlarni tayyorlang." },
          ],
        },
      },
      isLoading: false,
    });
  });

  it("loads and normalizes a dedicated catalog recipe payload", () => {
    const { result } = renderHook(() => useFoodRecipe(12));

    expect(mockUseGetQuery).toHaveBeenCalledWith({
      url: "/foods/catalog/12/recipe",
      queryProps: {
        queryKey: [...FOOD_RECIPE_QUERY_KEY, 12, "uz"],
        enabled: true,
      },
    });
    expect(result.current.food).toMatchObject({
      catalogFoodId: 12,
      name: "Mastava",
      cal: 180,
      serving: "300 g",
    });
    expect(result.current.ingredients).toEqual([
      expect.objectContaining({ name: "Guruch", amount: 40, unit: "g" }),
    ]);
    expect(result.current.recipeInstructions).toEqual([
      { stepNumber: 1, text: "Masalliqlarni tayyorlang." },
    ]);
  });

  it("keeps the recipe query disabled without a catalog food id", () => {
    renderHook(() => useFoodRecipe(null));

    expect(mockUseGetQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "",
        queryProps: expect.objectContaining({
          enabled: false,
        }),
      }),
    );
  });
});
