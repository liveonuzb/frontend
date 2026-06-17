import { act, renderHook } from "@testing-library/react";
import { find } from "lodash";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUseGetQuery = vi.fn();
const mockPostMutateAsync = vi.fn();
const mockPatchMutateAsync = vi.fn();
const mockPostFileMutateAsync = vi.fn();
const mockDeleteMutateAsync = vi.fn();
const mockInvalidateQueries = vi.fn();
const mockCancelQueries = vi.fn();
const mockGetQueriesData = vi.fn();
const mockSetQueryData = vi.fn();

vi.mock("@/hooks/api", () => ({
  useGetQuery: (...args) => mockUseGetQuery(...args),
  usePostQuery: () => ({
    mutateAsync: mockPostMutateAsync,
    isPending: false,
  }),
  usePatchQuery: () => ({
    mutateAsync: mockPatchMutateAsync,
    isPending: false,
  }),
  usePostFileQuery: () => ({
    mutateAsync: mockPostFileMutateAsync,
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
    setQueryData: mockSetQueryData,
  }),
}));

vi.mock("@/store/language-store", () => ({
  default: (selector) => selector({ currentLanguage: "uz" }),
}));

import {
  getNutritionRecipeCategoriesQueryKey,
  getNutritionRecipeFiltersQueryKey,
  MY_NUTRITION_RECIPES_QUERY_KEY,
  NUTRITION_FOODS_QUICK_ADD_QUERY_KEY,
  NUTRITION_RECIPE_DETAIL_QUERY_KEY,
  NUTRITION_RECIPES_QUERY_KEY,
  getNutritionRecipeDetailQueryKey,
  getNutritionRecipesQueryKey,
  useNutritionRecipeActions,
  useNutritionRecipeBuilderActions,
  useNutritionRecipeCategories,
  useNutritionRecipeDetail,
  useNutritionRecipeFilters,
  useNutritionRecipes,
} from "./use-nutrition-recipes.js";
import { NUTRITION_DASHBOARD_QUERY_KEY } from "./nutrition-query-keys.js";

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
    mockPatchMutateAsync.mockResolvedValue({ data: { ok: true } });
    mockPostFileMutateAsync.mockResolvedValue({ data: { data: [] } });
    mockDeleteMutateAsync.mockResolvedValue({ data: { ok: true } });
    mockCancelQueries.mockResolvedValue(undefined);
    mockGetQueriesData.mockReturnValue([]);
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

  it("normalizes recipe request filters before params and query keys", () => {
    const filters = {
      q: "  palov  ",
      sort: " highestProtein ",
      categoryId: "2.8",
      cuisineId: "bad",
      dietaryTag: " high-protein ",
      excludeAllergenTag: "",
      difficulty: " easy ",
      maxTotalTimeMinutes: "45",
      minProtein: "12.5",
      minCalories: "0",
      maxCalories: "-20",
      featuredOnly: false,
      favoriteOnly: "true",
      page: "2",
      pageSize: "20",
    };
    const normalizedFilters = {
      q: "palov",
      sort: "highestProtein",
      categoryId: 2,
      dietaryTag: "high-protein",
      difficulty: "easy",
      maxTotalTimeMinutes: 45,
      minProtein: 12.5,
      favoriteOnly: true,
      page: 2,
      pageSize: 20,
    };

    renderHook(() => useNutritionRecipes(filters));

    expect(mockUseGetQuery).toHaveBeenCalledWith({
      url: "/user/nutrition/recipes",
      params: normalizedFilters,
      queryProps: {
        queryKey: getNutritionRecipesQueryKey(normalizedFilters, "uz"),
        enabled: true,
      },
    });
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

  it("filters malformed recipe filter options and normalizes tag values", () => {
    mockUseGetQuery.mockReturnValueOnce({
      data: {
        data: {
          categories: [
            {
              id: "2.8",
              name: "Lunch",
              translations: { uz: " Tushlik " },
            },
            { id: "bad", name: "Broken category" },
          ],
          cuisines: [
            { id: "5", name: "Uzbek", translations: { uz: " O'zbek " } },
            { id: null, name: "Broken cuisine" },
          ],
          dietaryTags: [
            " quick ",
            "",
            null,
            { value: "high-protein", label: "High protein" },
            { key: "vegan" },
          ],
          allergenTags: [{ value: "gluten" }, " milk ", null],
        },
      },
      isLoading: false,
    });

    const { result } = renderHook(() => useNutritionRecipeFilters());

    expect(result.current.categories).toEqual([
      expect.objectContaining({ id: 2, label: "Tushlik" }),
    ]);
    expect(result.current.cuisines).toEqual([
      expect.objectContaining({ id: 5, label: "O'zbek" }),
    ]);
    expect(result.current.dietaryTags).toEqual([
      "quick",
      "high-protein",
      "vegan",
    ]);
    expect(result.current.allergenTags).toEqual(["gluten", "milk"]);
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
      url: "/user/nutrition/recipes/categories",
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
      await result.current.addToMealPlan(11, {
        planId: "plan-1",
        dayKey: "day-1",
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
    expect(mockPostMutateAsync).toHaveBeenCalledWith({
      url: "/user/nutrition/recipes/11/add-to-meal-plan",
      attributes: {
        planId: "plan-1",
        dayKey: "day-1",
        mealType: "lunch",
        servings: 2,
      },
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: NUTRITION_RECIPES_QUERY_KEY,
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: MY_NUTRITION_RECIPES_QUERY_KEY,
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: NUTRITION_RECIPE_DETAIL_QUERY_KEY,
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: NUTRITION_FOODS_QUICK_ADD_QUERY_KEY,
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: NUTRITION_DASHBOARD_QUERY_KEY,
    });
  });

  it("creates recipe generation jobs through the canonical job root", async () => {
    const { result } = renderHook(() => useNutritionRecipeBuilderActions());

    await act(async () => {
      await result.current.createRecipeGenerationJob({
        products: [{ name: "Pomidor", quantity: 2 }],
      });
    });

    expect(mockPostMutateAsync).toHaveBeenCalledWith({
      url: "/user/nutrition/recipe-generation-jobs",
      attributes: {
        products: [{ name: "Pomidor", quantity: 2 }],
      },
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: NUTRITION_RECIPES_QUERY_KEY,
    });
  });

  it("normalizes prefixed recipe display ids before API mutations", async () => {
    const { result } = renderHook(() => useNutritionRecipeActions());

    await act(async () => {
      await result.current.toggleFavorite({
        id: "recipe-11",
        isFavorite: false,
      });
      await result.current.addToMealLog("recipe-11", {
        date: "2026-05-31",
        mealType: "lunch",
        servings: 1,
      });
      await result.current.createShoppingList("recipe-11", {
        servings: 1,
      });
    });

    expect(mockPostMutateAsync).toHaveBeenCalledWith({
      url: "/user/nutrition/recipes/11/favorite",
    });
    expect(mockPostMutateAsync).toHaveBeenCalledWith({
      url: "/user/nutrition/recipes/11/meal-log",
      attributes: {
        date: "2026-05-31",
        mealType: "lunch",
        servings: 1,
      },
    });
    expect(mockPostMutateAsync).toHaveBeenCalledWith({
      url: "/user/nutrition/recipes/11/shopping-list",
      attributes: {
        servings: 1,
      },
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
    const favoriteListQueryKey = [
      ...NUTRITION_RECIPES_QUERY_KEY,
      "uz",
      { favoriteOnly: true },
    ];
    const myQueryKey = [...MY_NUTRITION_RECIPES_QUERY_KEY, "uz", {}];
    const detailQueryKey = [...NUTRITION_RECIPE_DETAIL_QUERY_KEY, "uz", 11];
    const quickAddQueryKey = [...NUTRITION_FOODS_QUICK_ADD_QUERY_KEY];
    const directArrayQueryKey = [
      ...NUTRITION_RECIPES_QUERY_KEY,
      "direct-array",
    ];
    const listSnapshot = {
      data: {
        data: {
          recipes: [
            { catalogFoodId: 11, title: "Toshkent palovi", isFavorite: true },
            { catalogFoodId: 12, title: "Mastava", isFavorite: false },
          ],
        },
      },
    };
    const favoriteListSnapshot = {
      data: {
        data: {
          recipes: [
            { catalogFoodId: 11, title: "Toshkent palovi", isFavorite: true },
            { catalogFoodId: 12, title: "Mastava", isFavorite: true },
          ],
        },
      },
    };
    const mySnapshot = {
      data: {
        data: {
          recipes: [
            { catalogFoodId: 11, title: "Toshkent palovi", isFavorite: true },
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
            isFavorite: true,
          },
        },
      },
    };
    const quickAddSnapshot = {
      data: {
        data: {
          favorites: [
            { id: 11, title: "Toshkent palovi", isFavorite: true },
            { id: 12, title: "Mastava", isFavorite: true },
          ],
          recent: [
            { id: 11, title: "Toshkent palovi", isFavorite: true },
            { id: 13, title: "Dimlama", isFavorite: false },
          ],
        },
      },
    };
    const directArraySnapshot = [
      { foodId: "11", title: "Toshkent palovi", isFavorite: true },
      { foodId: "12", title: "Mastava", isFavorite: true },
    ];
    mockGetQueriesData
      .mockReturnValueOnce([
        [listQueryKey, listSnapshot],
        [favoriteListQueryKey, favoriteListSnapshot],
        [myQueryKey, mySnapshot],
        [directArrayQueryKey, directArraySnapshot],
      ])
      .mockReturnValueOnce([[detailQueryKey, detailSnapshot]])
      .mockReturnValueOnce([[quickAddQueryKey, quickAddSnapshot]]);
    mockDeleteMutateAsync.mockRejectedValueOnce(new Error("network"));

    const { result } = renderHook(() => useNutritionRecipeActions());

    await expect(
      result.current.toggleFavorite({ catalogFoodId: 11, isFavorite: true }),
    ).rejects.toThrow("network");

    expect(mockCancelQueries).toHaveBeenCalledWith({
      queryKey: NUTRITION_RECIPES_QUERY_KEY,
    });
    expect(mockCancelQueries).toHaveBeenCalledWith({
      queryKey: NUTRITION_RECIPE_DETAIL_QUERY_KEY,
    });
    expect(mockCancelQueries).toHaveBeenCalledWith({
      queryKey: NUTRITION_FOODS_QUICK_ADD_QUERY_KEY,
    });

    const firstCacheWriteFor = (queryKey) =>
      find(mockSetQueryData.mock.calls, ([key]) => key === queryKey)?.[1];

    expect(firstCacheWriteFor(listQueryKey).data.data.recipes).toEqual([
      expect.objectContaining({ catalogFoodId: 11, isFavorite: false }),
      expect.objectContaining({ catalogFoodId: 12, isFavorite: false }),
    ]);
    expect(firstCacheWriteFor(favoriteListQueryKey).data.data.recipes).toEqual([
      expect.objectContaining({ catalogFoodId: 12, isFavorite: true }),
    ]);
    expect(firstCacheWriteFor(myQueryKey).data.data.recipes).toEqual([
      expect.objectContaining({ catalogFoodId: 11, isFavorite: false }),
    ]);
    expect(firstCacheWriteFor(directArrayQueryKey)).toEqual([
      expect.objectContaining({ foodId: "11", isFavorite: false }),
      expect.objectContaining({ foodId: "12", isFavorite: true }),
    ]);
    expect(firstCacheWriteFor(detailQueryKey).data.data.recipe).toEqual(
      expect.objectContaining({ catalogFoodId: 11, isFavorite: false }),
    );
    expect(firstCacheWriteFor(quickAddQueryKey).data.data.favorites).toEqual([
      expect.objectContaining({ id: 12, isFavorite: true }),
    ]);
    expect(firstCacheWriteFor(quickAddQueryKey).data.data.recent).toEqual([
      expect.objectContaining({ id: 11, isFavorite: false }),
      expect.objectContaining({ id: 13, isFavorite: false }),
    ]);
    expect(mockSetQueryData).toHaveBeenCalledWith(
      favoriteListQueryKey,
      favoriteListSnapshot,
    );
    expect(mockSetQueryData).toHaveBeenCalledWith(listQueryKey, listSnapshot);
    expect(mockSetQueryData).toHaveBeenCalledWith(myQueryKey, mySnapshot);
    expect(mockSetQueryData).toHaveBeenCalledWith(
      directArrayQueryKey,
      directArraySnapshot,
    );
    expect(mockSetQueryData).toHaveBeenCalledWith(
      detailQueryKey,
      detailSnapshot,
    );
    expect(mockSetQueryData).toHaveBeenCalledWith(
      quickAddQueryKey,
      quickAddSnapshot,
    );
  });
});
