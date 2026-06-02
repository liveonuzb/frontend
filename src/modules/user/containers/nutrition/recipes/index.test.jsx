import React from "react";
import i18n from "@/lib/i18n";

i18n.changeLanguage("uz");
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NutritionRecipesPage from "./index.jsx";

const mockUseNutritionRecipes = vi.fn();
const mockToggleFavorite = vi.fn();
const mockAddToMealLog = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
  },
}));

vi.mock("@/hooks/app/use-nutrition-recipes.js", () => ({
  useNutritionRecipes: (...args) => mockUseNutritionRecipes(...args),
  useNutritionRecipeFilters: () => ({
    categories: [
      {
        id: 2,
        label: "Tushlik",
      },
    ],
    cuisines: [
      {
        id: 5,
        label: "O'zbek",
      },
    ],
    dietaryTags: ["quick"],
    allergenTags: ["gluten"],
    isLoading: false,
  }),
  useNutritionRecipeDetail: () => ({
    recipe: null,
    isLoading: false,
  }),
  useNutritionRecipeActions: () => ({
    toggleFavorite: mockToggleFavorite,
    addToMealLog: mockAddToMealLog,
    isUpdating: false,
  }),
}));

const renderRecipesPage = () =>
  render(
    <MemoryRouter initialEntries={["/user/nutrition/recipes"]}>
      <NutritionRecipesPage />
    </MemoryRouter>,
  );

describe("NutritionRecipesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToggleFavorite.mockResolvedValue({});
    mockAddToMealLog.mockResolvedValue({});
    mockUseNutritionRecipes.mockReturnValue({
      recipes: [
        {
          id: "recipe-11",
          catalogFoodId: 11,
          title: "Toshkent palovi",
          description: "Klassik palov",
          calories: 540,
          protein: 18,
          carbs: 62,
          fat: 22,
          difficulty: "medium",
          totalTimeMinutes: 80,
          ratingAverage: 4.7,
          ratingCount: 12,
          isFeatured: true,
          servingLabel: "350 g",
          imageUrl: null,
          ingredients: [],
          instructions: [],
          ingredientsCount: 3,
          stepsCount: 4,
          isFavorite: false,
        },
      ],
      pagination: {
        total: 1,
        totalPages: 1,
      },
      isLoading: false,
    });
  });

  it("passes category, cuisine, macro, allergen, dietary tag, and saved filters to the recipes query", async () => {
    renderRecipesPage();

    fireEvent.change(screen.getByLabelText("Kategoriya"), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByLabelText("Oshxona"), {
      target: { value: "5" },
    });
    fireEvent.change(screen.getByLabelText("Teg"), {
      target: { value: "quick" },
    });
    fireEvent.change(screen.getByLabelText("Allergen"), {
      target: { value: "gluten" },
    });
    fireEvent.change(screen.getByLabelText("Qiyinlik"), {
      target: { value: "easy" },
    });
    fireEvent.change(screen.getByLabelText("Maksimal vaqt"), {
      target: { value: "30" },
    });
    fireEvent.change(screen.getByLabelText("Minimal protein"), {
      target: { value: "25" },
    });
    fireEvent.change(screen.getByLabelText("Minimal kcal"), {
      target: { value: "350" },
    });
    fireEvent.change(screen.getByLabelText("Maksimal kcal"), {
      target: { value: "650" },
    });
    fireEvent.change(screen.getByLabelText("Saralash"), {
      target: { value: "highestRated" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Tavsiya etilgan" }));
    fireEvent.click(screen.getByRole("button", { name: "Saqlanganlar" }));

    await waitFor(() => {
      expect(mockUseNutritionRecipes).toHaveBeenLastCalledWith(
        expect.objectContaining({
          categoryId: "2",
          cuisineId: "5",
          dietaryTag: "quick",
          excludeAllergenTag: "gluten",
          difficulty: "easy",
          maxTotalTimeMinutes: "30",
          minProtein: "25",
          minCalories: "350",
          maxCalories: "650",
          sort: "highestRated",
          featuredOnly: true,
          favoriteOnly: true,
        }),
      );
    });
  });

  it("clears active recipe filters in one action", async () => {
    renderRecipesPage();

    fireEvent.change(screen.getByLabelText("Retsept qidirish"), {
      target: { value: "palov" },
    });
    fireEvent.change(screen.getByLabelText("Kategoriya"), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByLabelText("Allergen"), {
      target: { value: "gluten" },
    });
    fireEvent.change(screen.getByLabelText("Qiyinlik"), {
      target: { value: "easy" },
    });
    fireEvent.change(screen.getByLabelText("Maksimal vaqt"), {
      target: { value: "30" },
    });
    fireEvent.change(screen.getByLabelText("Minimal protein"), {
      target: { value: "25" },
    });
    fireEvent.change(screen.getByLabelText("Minimal kcal"), {
      target: { value: "350" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Saqlanganlar" }));
    fireEvent.click(screen.getByRole("button", { name: "Tavsiya etilgan" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Filterlarni tozalash" }),
    );

    await waitFor(() => {
      expect(mockUseNutritionRecipes).toHaveBeenLastCalledWith(
        expect.objectContaining({
          q: "",
          sort: "newest",
          categoryId: "",
          cuisineId: "",
          dietaryTag: "",
          excludeAllergenTag: "",
          difficulty: "",
          maxTotalTimeMinutes: "",
          minProtein: "",
          minCalories: "",
          maxCalories: "",
          featuredOnly: undefined,
          favoriteOnly: undefined,
        }),
      );
    });
  });

  it("debounces search before sending it to the recipes query", () => {
    vi.useFakeTimers();

    try {
      renderRecipesPage();
      mockUseNutritionRecipes.mockClear();

      fireEvent.change(screen.getByLabelText("Retsept qidirish"), {
        target: { value: "palov" },
      });

      expect(mockUseNutritionRecipes).toHaveBeenLastCalledWith(
        expect.objectContaining({
          q: "",
        }),
      );

      act(() => {
        vi.advanceTimersByTime(349);
      });
      expect(mockUseNutritionRecipes).not.toHaveBeenLastCalledWith(
        expect.objectContaining({
          q: "palov",
        }),
      );

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(mockUseNutritionRecipes).toHaveBeenLastCalledWith(
        expect.objectContaining({
          q: "palov",
        }),
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("links recipe cards to the dedicated detail route", () => {
    renderRecipesPage();

    expect(
      screen.getByRole("link", { name: "Toshkent palovi batafsil" }),
    ).toHaveAttribute("href", "/user/nutrition/recipes/11");
  });
});
