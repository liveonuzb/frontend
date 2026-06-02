import React from "react";
import i18n from "@/lib/i18n";

i18n.changeLanguage("uz");
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NutritionRecipesPage from "./index.jsx";
import RecipeCreateWizard from "./components/recipe-create-wizard.jsx";

const mockToggleFavorite = vi.fn();
const mockAddToMealLog = vi.fn();
const mockAddToMealPlan = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/hooks/app/use-nutrition-recipes.js", () => ({
  useNutritionRecipes: () => ({
    recipes: [],
    pagination: { total: 0, totalPages: 1 },
    isLoading: false,
  }),
  useMyNutritionRecipes: () => ({
    recipes: [],
    pagination: { total: 0 },
    isLoading: false,
  }),
  useNutritionRecipeGallery: () => ({
    images: [],
    isLoading: false,
  }),
  useNutritionRecipeFilters: () => ({
    categories: [],
    cuisines: [],
    dietaryTags: [],
    allergenTags: [],
    isLoading: false,
  }),
  useNutritionRecipeDetail: () => ({
    recipe: null,
    isLoading: false,
  }),
  useNutritionRecipeActions: () => ({
    toggleFavorite: mockToggleFavorite,
    addToMealLog: mockAddToMealLog,
    addToMealPlan: mockAddToMealPlan,
    isUpdating: false,
  }),
  useNutritionRecipeBuilderActions: () => ({
    createMyRecipe: vi.fn(),
    requestPublication: vi.fn(),
    uploadMyRecipeImage: vi.fn(),
    uploadRecipeProductImages: vi.fn(),
    createRecipeGenerationJob: vi.fn(),
    saveGeneratedRecipeSuggestion: vi.fn(),
    isUpdating: false,
  }),
}));

vi.mock("@/hooks/app/use-meal-plan.js", () => ({
  useMealPlan: () => ({
    plans: [
      {
        id: "plan-1",
        name: "Haftalik reja",
        days: [{ dayNumber: 1, dayKey: "day-1", meals: [] }],
        durationDays: 7,
      },
    ],
    activePlan: {
      id: "plan-1",
      name: "Haftalik reja",
      days: [{ dayNumber: 1, dayKey: "day-1", meals: [] }],
      durationDays: 7,
    },
    isLoading: false,
  }),
}));

const renderRecipesPage = () =>
  render(
    <MemoryRouter initialEntries={["/user/nutrition/recipes"]}>
      <Routes>
        <Route path="/user/nutrition/recipes" element={<NutritionRecipesPage />} />
      </Routes>
    </MemoryRouter>,
  );

describe("NutritionRecipesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Element.prototype.scrollIntoView = vi.fn();
    mockToggleFavorite.mockResolvedValue({});
    mockAddToMealLog.mockResolvedValue({});
    mockAddToMealPlan.mockResolvedValue({});
  });

  it("renders explore cards and opens the detail drawer", () => {
    renderRecipesPage();

    expect(screen.getByRole("heading", { name: "Bugungi retseptlar" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Explore" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Mening retseptlarim" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "AI From Image" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Sevimlilar" })).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Detail" })[0]);

    expect(
      screen.getByRole("button", { name: "Pishirishni boshlash" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Masalliqlar")).toBeInTheDocument();
  });

  it("filters recipes by search text", () => {
    renderRecipesPage();

    fireEvent.change(screen.getByLabelText("Retseptlar qidirish"), {
      target: { value: "banan" },
    });

    expect(screen.getAllByText("Bananli jo'xori bo'tqasi").length).toBeGreaterThan(0);
    expect(screen.queryByText("Somon va brokkoli")).not.toBeInTheDocument();
  });

  it("toggles favorite and scales detail drawer ingredients with serving controls", () => {
    renderRecipesPage();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Tovuqli quinoa salatasi sevimlilarga qo'shish",
      }),
    );
    expect(
      screen.getByRole("button", {
        name: "Tovuqli quinoa salatasi sevimlilardan olib tashlash",
      }),
    ).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getAllByRole("button", { name: "Detail" })[0]);
    fireEvent.click(screen.getByRole("button", { name: /Masalliqlar/ }));
    fireEvent.click(screen.getByRole("button", { name: "Porsiyani oshirish" }));

    expect(screen.getByText("240 g")).toBeInTheDocument();
    expect(screen.getAllByText("840").length).toBeGreaterThan(0);
  });

  it("opens add drawer and submits a recipe to the meal log", async () => {
    renderRecipesPage();

    fireEvent.click(screen.getAllByRole("button", { name: "Qo'shish" })[0]);

    expect(screen.getByText("Rejaga qo'shish")).toBeInTheDocument();

    const submitButtons = screen.getAllByRole("button", { name: "Qo'shish" });
    fireEvent.click(submitButtons[submitButtons.length - 1]);

    await waitFor(() => {
      expect(mockAddToMealLog).toHaveBeenCalledWith(
        101,
        expect.objectContaining({
          date: expect.any(String),
          mealType: expect.stringMatching(/breakfast|lunch|dinner|snack/),
          servings: 1,
        }),
      );
    });
  });

  it("submits a recipe to the selected meal plan slot", async () => {
    renderRecipesPage();

    fireEvent.click(screen.getAllByRole("button", { name: "Qo'shish" })[0]);
    fireEvent.click(screen.getByRole("tab", { name: "Meal plan" }));

    const submitButtons = screen.getAllByRole("button", { name: "Qo'shish" });
    fireEvent.click(submitButtons[submitButtons.length - 1]);

    await waitFor(() => {
      expect(mockAddToMealPlan).toHaveBeenCalledWith(101, {
        planId: "plan-1",
        dayKey: "day-1",
        mealType: expect.stringMatching(/breakfast|lunch|dinner|snack/),
        servings: 1,
      });
    });
  });

  it("shows empty states for My Recipes and Favorites", () => {
    renderRecipesPage();

    fireEvent.click(screen.getByRole("tab", { name: "Mening retseptlarim" }));
    expect(screen.getByText("Retseptlar topilmadi")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Retsept yaratish" }).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("tab", { name: "Sevimlilar" }));
    expect(screen.getByText("Birinchi retseptingizni yarating")).toBeInTheDocument();
  });

  it("supports the AI From Image mock chip flow", () => {
    renderRecipesPage();

    fireEvent.click(screen.getByRole("tab", { name: "AI From Image" }));
    expect(screen.getByText("Ingredient rasmini yuklang")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Tovuq filesi olib tashlash" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Tovuq filesi olib tashlash" }));
    expect(
      screen.queryByRole("button", { name: "Tovuq filesi olib tashlash" }),
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Ingredient qo'shish"), {
      target: { value: "Ismaloq" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ingredient qo'shish" }));

    expect(screen.getByText("Ismaloq")).toBeInTheDocument();
  });
});

describe("RecipeCreateWizard", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("validates the first step and recalculates nutrition after ingredient edits", async () => {
    render(
      <MemoryRouter>
        <RecipeCreateWizard onCancel={vi.fn()} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Keyingisi: Ingredientlar" }));
    expect(screen.getByText("Retsept nomini kiriting")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Retsept nomi"), {
      target: { value: "Yangi salat" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Kategoriya" }));
    fireEvent.click(screen.getByRole("button", { name: "Tushlik" }));
    fireEvent.click(screen.getByRole("button", { name: "Qiyinchilik darajasi" }));
    fireEvent.click(screen.getByRole("button", { name: "Oson" }));
    fireEvent.click(screen.getByRole("button", { name: "Keyingisi: Ingredientlar" }));

    expect(
      screen.getByRole("heading", { name: "2-qadam: Ingredientlar" }),
    ).toBeInTheDocument();
    expect(screen.getByText("468")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Tovuq filesi miqdori"), {
      target: { value: "240" },
    });

    await waitFor(() => {
      expect(screen.getByText("633")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Bodringni o'chirish" }));
    expect(screen.queryByText("Bodring")).not.toBeInTheDocument();
  });
});
