import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUseGetQuery = vi.fn();
const mockPostMutateAsync = vi.fn();
const mockDeleteMutateAsync = vi.fn();
const mockInvalidateQueries = vi.fn();
const mockCancelQueries = vi.fn();
const mockGetQueriesData = vi.fn();
const mockSetQueriesData = vi.fn();
const mockSetQueryData = vi.fn();

vi.mock("@/hooks/api", () => ({
  useGetQuery: (...args) => mockUseGetQuery(...args),
  usePostQuery: () => ({
    mutateAsync: mockPostMutateAsync,
    isPending: false,
  }),
  useDeleteQuery: () => ({
    mutateAsync: mockDeleteMutateAsync,
    isPending: false,
  }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    cancelQueries: mockCancelQueries,
    getQueriesData: mockGetQueriesData,
    invalidateQueries: mockInvalidateQueries,
    setQueriesData: mockSetQueriesData,
    setQueryData: mockSetQueryData,
  }),
}));

vi.mock("@/store/language-store", () => ({
  default: (selector) => selector({ currentLanguage: "uz" }),
}));

import {
  getNutritionRecipeCategoriesQueryKey,
  getNutritionRecipeFiltersQueryKey,
  NUTRITION_RECIPE_DETAIL_QUERY_KEY,
  NUTRITION_RECIPES_QUERY_KEY,
  getNutritionRecipeDetailQueryKey,
  getNutritionRecipesQueryKey,
  useNutritionRecipeActions,
  useNutritionRecipeCategories,
  useNutritionRecipeDetail,
  useNutritionRecipeFilters,
  useNutritionRecipes,
} from "./use-nutrition-recipes.js";

const RECIPE_FILTERS_STALE_TIME_MS = 5 * 60 * 1000;

describe("useNutritionRecipes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGetQuery.mockReturnValue({
      data: {
        data: {
          recipes: [
            {
              id: 11,
              catalogFoodId: 11,
              title: "Toshkent palovi",
              translations: { uz: "Toshkent palovi", en: "Tashkent plov" },
              calories: 540,
              protein: 18,
              carbs: 62,
              fat: 22,
              servingSize: 350,
              servingUnit: "g",
              imageUrl: "/foods/plov.webp",
              ingredientsCount: 3,
              stepsCount: 4,
              isFavorite: true,
            },
          ],
          pagination: {
            page: 1,
            pageSize: 20,
            total: 1,
            totalPages: 1,
          },
          activeFilters: [
            { key: "q", label: "Qidiruv", value: "palov" },
            { key: "favoriteOnly", label: "Saqlanganlar", value: true },
          ],
        },
      },
      isLoading: false,
    });
    mockPostMutateAsync.mockResolvedValue({ data: { ok: true } });
    mockDeleteMutateAsync.mockResolvedValue({ data: { ok: true } });
    mockCancelQueries.mockResolvedValue(undefined);
    mockGetQueriesData.mockReturnValue([]);
    mockSetQueriesData.mockReturnValue(undefined);
    mockSetQueryData.mockReturnValue(undefined);
  });

  it("loads recipes from the dedicated nutrition recipes endpoint", () => {
    const filters = { q: "palov", sort: "highestProtein" };
    const { result } = renderHook(() => useNutritionRecipes(filters));

    expect(mockUseGetQuery).toHaveBeenCalledWith({
      url: "/user/nutrition/recipes",
      params: {
        q: "palov",
        sort: "highestProtein",
      },
      queryProps: {
        queryKey: getNutritionRecipesQueryKey(filters, "uz"),
        enabled: true,
      },
    });
    expect(result.current.recipes).toEqual([
      expect.objectContaining({
        id: "recipe-11",
        catalogFoodId: 11,
        title: "Toshkent palovi",
        calories: 540,
        servingLabel: "350 g",
        isFavorite: true,
      }),
    ]);
    expect(result.current.pagination.total).toBe(1);
    expect(result.current.activeFilters).toEqual([
      { key: "q", label: "Qidiruv", value: "palov" },
      { key: "favoriteOnly", label: "Saqlanganlar", value: true },
    ]);
  });

  it("keeps recipe detail disabled until an id exists", () => {
    renderHook(() => useNutritionRecipeDetail(null));

    expect(mockUseGetQuery).toHaveBeenCalledWith({
      url: "",
      queryProps: {
        queryKey: getNutritionRecipeDetailQueryKey(null, "uz"),
        enabled: false,
      },
    });
  });

  it("loads localized recipe filter options from the recipes filter endpoint", () => {
    mockUseGetQuery.mockReturnValueOnce({
      data: {
        data: {
          categories: [
            {
              id: 2,
              name: "Lunch",
              color: "#16a34a",
              translations: { uz: "Tushlik", en: "Lunch" },
            },
          ],
          cuisines: [
            {
              id: 5,
              name: "Uzbek",
              translations: { uz: "O'zbek", en: "Uzbek" },
            },
          ],
          dietaryTags: ["quick"],
          allergenTags: ["gluten"],
        },
      },
      isLoading: false,
    });

    const { result } = renderHook(() => useNutritionRecipeFilters());

    expect(mockUseGetQuery).toHaveBeenCalledWith({
      url: "/user/nutrition/recipes/filters",
      queryProps: {
        queryKey: getNutritionRecipeFiltersQueryKey("uz"),
        enabled: true,
        staleTime: RECIPE_FILTERS_STALE_TIME_MS,
      },
    });
    expect(result.current.categories).toEqual([
      expect.objectContaining({
        id: 2,
        label: "Tushlik",
      }),
    ]);
    expect(result.current.cuisines).toEqual([
      expect.objectContaining({
        id: 5,
        label: "O'zbek",
      }),
    ]);
    expect(result.current.dietaryTags).toEqual(["quick"]);
    expect(result.current.allergenTags).toEqual(["gluten"]);
  });

  it("loads active recipe categories from the dedicated categories endpoint", () => {
    mockUseGetQuery.mockReturnValueOnce({
      data: {
        data: {
          categories: [
            {
              id: 2,
              name: "Lunch",
              color: "#16a34a",
              translations: { uz: "Tushlik", en: "Lunch" },
            },
          ],
        },
      },
      isLoading: false,
    });

    const { result } = renderHook(() => useNutritionRecipeCategories());

    expect(mockUseGetQuery).toHaveBeenCalledWith({
      url: "/user/nutrition/recipe-categories",
      queryProps: {
        queryKey: getNutritionRecipeCategoriesQueryKey("uz"),
        enabled: true,
        staleTime: RECIPE_FILTERS_STALE_TIME_MS,
      },
    });
    expect(result.current.categories).toEqual([
      expect.objectContaining({
        id: 2,
        label: "Tushlik",
      }),
    ]);
  });

  it("sends favorite and meal-log actions to recipe endpoints", async () => {
    const { result } = renderHook(() => useNutritionRecipeActions());

    await act(async () => {
      await result.current.addFavorite(11);
      await result.current.removeFavorite(11);
      await result.current.addToMealLog(11, {
        date: "2026-05-31",
        mealType: "lunch",
        servings: 2,
      });
    });

    expect(mockPostMutateAsync).toHaveBeenCalledWith({
      url: "/user/nutrition/recipes/11/favorite",
    });
    expect(mockDeleteMutateAsync).toHaveBeenCalledWith({
      url: "/user/nutrition/recipes/11/favorite",
    });
    expect(mockPostMutateAsync).toHaveBeenCalledWith({
      url: "/user/nutrition/recipes/11/meal-log",
      attributes: {
        date: "2026-05-31",
        mealType: "lunch",
        servings: 2,
      },
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: NUTRITION_RECIPES_QUERY_KEY,
    });
  });

  it("creates a recipe shopping list through the recipe action endpoint", async () => {
    mockPostMutateAsync.mockResolvedValueOnce({
      data: {
        data: {
          id: "shopping-list-1",
          planId: null,
          priceContext: {
            regionKey: "toshkent",
            season: "spring",
            currency: "UZS",
          },
          items: [
            {
              id: "item-1",
              ingredientId: 1,
              name: "Guruch",
              grams: 240,
              unit: "g",
              estimatedCost: 3840,
              currency: "UZS",
              sources: [{ recipeId: 11 }],
            },
          ],
          totals: {
            estimatedCost: 3840,
            knownItems: 1,
            unknownItems: 0,
            currency: "UZS",
          },
        },
      },
    });
    const { result } = renderHook(() => useNutritionRecipeActions());
    let shoppingList;

    await act(async () => {
      shoppingList = await result.current.createShoppingList(11, {
        servings: 2,
        regionKey: "toshkent",
        season: "spring",
      });
    });

    expect(mockPostMutateAsync).toHaveBeenCalledWith({
      url: "/user/nutrition/recipes/11/shopping-list",
      attributes: {
        servings: 2,
        regionKey: "toshkent",
        season: "spring",
      },
    });
    expect(shoppingList).toEqual(
      expect.objectContaining({
        id: "shopping-list-1",
        planId: null,
        items: [
          expect.objectContaining({
            ingredientId: 1,
            name: "Guruch",
            grams: 240,
          }),
        ],
      }),
    );
  });

  it("optimistically updates favorite cache and rolls back when the request fails", async () => {
    const listQueryKey = [...NUTRITION_RECIPES_QUERY_KEY, "uz", {}];
    const detailQueryKey = [...NUTRITION_RECIPE_DETAIL_QUERY_KEY, "uz", 11];
    const listSnapshot = {
      data: {
        data: {
          recipes: [
            { catalogFoodId: 11, title: "Toshkent palovi", isFavorite: false },
            { catalogFoodId: 12, title: "Mastava", isFavorite: false },
          ],
        },
      },
    };
    const detailSnapshot = {
      data: {
        data: {
          recipe: {
            catalogFoodId: 11,
            title: "Toshkent palovi",
            isFavorite: false,
          },
        },
      },
    };
    mockGetQueriesData
      .mockReturnValueOnce([[listQueryKey, listSnapshot]])
      .mockReturnValueOnce([[detailQueryKey, detailSnapshot]]);
    mockPostMutateAsync.mockRejectedValueOnce(new Error("network"));

    const { result } = renderHook(() => useNutritionRecipeActions());

    await expect(
      result.current.toggleFavorite({ catalogFoodId: 11, isFavorite: false }),
    ).rejects.toThrow("network");

    expect(mockCancelQueries).toHaveBeenCalledWith({
      queryKey: NUTRITION_RECIPES_QUERY_KEY,
    });
    expect(mockCancelQueries).toHaveBeenCalledWith({
      queryKey: NUTRITION_RECIPE_DETAIL_QUERY_KEY,
    });
    expect(mockSetQueriesData).toHaveBeenCalledWith(
      { queryKey: NUTRITION_RECIPES_QUERY_KEY },
      expect.any(Function),
    );
    expect(mockSetQueriesData).toHaveBeenCalledWith(
      { queryKey: NUTRITION_RECIPE_DETAIL_QUERY_KEY },
      expect.any(Function),
    );

    const listUpdater = mockSetQueriesData.mock.calls.find(
      ([filters]) => filters.queryKey === NUTRITION_RECIPES_QUERY_KEY,
    )[1];
    const detailUpdater = mockSetQueriesData.mock.calls.find(
      ([filters]) => filters.queryKey === NUTRITION_RECIPE_DETAIL_QUERY_KEY,
    )[1];

    expect(listUpdater(listSnapshot).data.data.recipes).toEqual([
      expect.objectContaining({ catalogFoodId: 11, isFavorite: true }),
      expect.objectContaining({ catalogFoodId: 12, isFavorite: false }),
    ]);
    expect(detailUpdater(detailSnapshot).data.data.recipe).toEqual(
      expect.objectContaining({ catalogFoodId: 11, isFavorite: true }),
    );
    expect(mockSetQueryData).toHaveBeenCalledWith(listQueryKey, listSnapshot);
    expect(mockSetQueryData).toHaveBeenCalledWith(
      detailQueryKey,
      detailSnapshot,
    );
  });
});
