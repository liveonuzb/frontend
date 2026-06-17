import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockApiGet = vi.fn();
const mockDeleteMutateAsync = vi.fn();
const mockInvalidateQueries = vi.fn();
const mockPostMutateAsync = vi.fn();
const mockUseDeleteQuery = vi.fn();
const mockUseGetQuery = vi.fn();
const mockUsePostQuery = vi.fn();
const mockUseQueryClient = vi.fn();

vi.mock("@/hooks/api", () => ({
  useDeleteQuery: (...args) => mockUseDeleteQuery(...args),
  useGetQuery: (...args) => mockUseGetQuery(...args),
  usePostFileQuery: vi.fn(),
  usePostQuery: (...args) => mockUsePostQuery(...args),
}));

vi.mock("@/hooks/api/use-api.js", () => ({
  api: {
    get: (...args) => mockApiGet(...args),
  },
}));

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    useInfiniteQuery: vi.fn(),
    useQueryClient: (...args) => mockUseQueryClient(...args),
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
  FOODS_CATALOG_QUERY_KEY,
  FOODS_QUICK_ADD_QUERY_KEY,
  default as useFoodCatalog,
  useFoodBarcodeLookup,
  useFoodQuickAddActions,
  useFoodRecipe,
} from "./use-food-catalog.js";

describe("useFoodCatalog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeleteMutateAsync.mockResolvedValue({});
    mockInvalidateQueries.mockResolvedValue(undefined);
    mockPostMutateAsync.mockResolvedValue({});
    mockUseDeleteQuery.mockReturnValue({
      mutateAsync: mockDeleteMutateAsync,
      isPending: false,
    });
    mockUsePostQuery.mockReturnValue({
      mutateAsync: mockPostMutateAsync,
      isPending: false,
    });
    mockUseQueryClient.mockReturnValue({
      invalidateQueries: mockInvalidateQueries,
    });
  });

  it("loads the catalog list through the canonical foods root", () => {
    mockUseGetQuery.mockImplementation(({ url }) => ({
      data:
        url === "/user/nutrition/foods"
          ? {
              data: {
                data: {
                  categories: [],
                  foods: [],
                },
              },
            }
          : {
              data: {
                data: {
                  favorites: [],
                  recent: [],
                },
              },
            },
      isLoading: false,
    }));

    renderHook(() => useFoodCatalog());

    expect(mockUseGetQuery).toHaveBeenNthCalledWith(1, {
      url: "/user/nutrition/foods",
      queryProps: {
        queryKey: FOODS_CATALOG_QUERY_KEY,
      },
    });
    expect(mockUseGetQuery).toHaveBeenNthCalledWith(2, {
      url: "/user/nutrition/foods/quick-add",
      queryProps: {
        queryKey: FOODS_QUICK_ADD_QUERY_KEY,
      },
    });
  });

  it("looks up barcode foods through the canonical foods barcode route", async () => {
    mockApiGet.mockResolvedValue({
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
          },
        },
      },
    });

    const { result } = renderHook(() => useFoodBarcodeLookup());
    let food = null;

    await act(async () => {
      food = await result.current.lookupFoodByBarcode("  478001 ");
    });

    expect(mockApiGet).toHaveBeenCalledWith(
      "/user/nutrition/foods/barcode/478001",
    );
    expect(food).toMatchObject({
      catalogFoodId: 12,
      name: "Mastava",
      cal: 180,
    });
  });

  it("toggles quick-add favorites through canonical foods favorite routes", async () => {
    const { result } = renderHook(() => useFoodQuickAddActions());

    await act(async () => {
      await result.current.addFavoriteFood(12);
      await result.current.removeFavoriteFood(12);
    });

    expect(mockPostMutateAsync).toHaveBeenCalledWith({
      url: "/user/nutrition/foods/favorites/12",
    });
    expect(mockDeleteMutateAsync).toHaveBeenCalledWith({
      url: "/user/nutrition/foods/favorites/12",
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: FOODS_QUICK_ADD_QUERY_KEY,
    });
  });
});

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
      url: "/user/nutrition/foods/catalog/12/recipe",
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
