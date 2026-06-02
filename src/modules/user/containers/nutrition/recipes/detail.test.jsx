import React from "react";
import i18n from "@/lib/i18n";

i18n.changeLanguage("uz");
import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NutritionRecipeDetailPage from "./detail.jsx";

const mockUseNutritionRecipeDetail = vi.fn();
const mockToggleFavorite = vi.fn();
const mockAddToMealLog = vi.fn();
const mockAddToMealPlan = vi.fn();
const mockCreateShoppingList = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
  },
}));

vi.mock("@/hooks/app/use-nutrition-recipes.js", () => ({
  useNutritionRecipeDetail: (...args) => mockUseNutritionRecipeDetail(...args),
  useNutritionRecipeActions: () => ({
    toggleFavorite: mockToggleFavorite,
    addToMealLog: mockAddToMealLog,
    addToMealPlan: mockAddToMealPlan,
    createShoppingList: mockCreateShoppingList,
    isUpdating: false,
  }),
}));

vi.mock("@/hooks/app/use-meal-plan.js", () => ({
  useMealPlan: () => ({
    plans: [
      {
        id: "plan-1",
        name: "Balanslangan reja",
      },
    ],
    activePlan: {
      id: "plan-1",
      name: "Balanslangan reja",
    },
    draftPlan: null,
  }),
}));

const recipe = {
  catalogFoodId: 11,
  title: "Toshkent palovi",
  description: "Klassik palov",
  calories: 540,
  protein: 18,
  carbs: 62,
  fat: 22,
  fiber: 6,
  sugar: 3,
  sodium: 480,
  difficulty: "medium",
  prepTimeMinutes: 20,
  cookTimeMinutes: 60,
  totalTimeMinutes: 80,
  servings: 4,
  ratingAverage: 4.7,
  ratingCount: 12,
  servingLabel: "350 g",
  ingredients: [{ id: 1, name: "Guruch", grams: 120 }],
  instructions: [
    {
      id: 1,
      stepNumber: 1,
      title: "Tayyorlash",
      body: "Guruchni yuving",
      durationMinutes: 5,
    },
  ],
};

const renderDetailPage = () =>
  render(
    <MemoryRouter initialEntries={["/user/nutrition/recipes/toshkent-palovi"]}>
      <Routes>
        <Route
          path="/user/nutrition/recipes/:slugOrId"
          element={<NutritionRecipeDetailPage />}
        />
      </Routes>
    </MemoryRouter>,
  );

describe("NutritionRecipeDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToggleFavorite.mockResolvedValue({});
    mockAddToMealLog.mockResolvedValue({});
    mockAddToMealPlan.mockResolvedValue({});
    mockCreateShoppingList.mockResolvedValue({ id: "shopping-list-1" });
    mockUseNutritionRecipeDetail.mockReturnValue({
      recipe,
      isLoading: false,
      isError: false,
    });
  });

  it("scales nutrition and ingredients when servings change", () => {
    renderDetailPage();

    expect(screen.getByText("540")).toBeInTheDocument();
    expect(screen.getByText("80 daq")).toBeInTheDocument();
    expect(screen.getByText("medium")).toBeInTheDocument();
    expect(screen.getByText("4.7")).toBeInTheDocument();
    expect(screen.getByText("120g")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "2x" }));

    expect(screen.getByText("1080")).toBeInTheDocument();
    expect(screen.getByText("240g")).toBeInTheDocument();
  });

  it("opens cooking mode with a visible step timer", () => {
    vi.useFakeTimers();

    try {
      renderDetailPage();

      fireEvent.click(screen.getByRole("button", { name: "Pishirish rejimi" }));

      expect(screen.getByText("1-qadam")).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Tayyorlash" }),
      ).toBeInTheDocument();
      expect(screen.getByText("05:00")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Timer boshlash" }));
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.getByText("04:59")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("toggles favorite from the detail header", () => {
    renderDetailPage();

    fireEvent.click(screen.getByRole("button", { name: "Saqlash" }));

    expect(mockToggleFavorite).toHaveBeenCalledWith(
      expect.objectContaining({ catalogFoodId: 11 }),
    );
  });

  it("adds the recipe to meal log with selected meal type and servings", () => {
    renderDetailPage();

    fireEvent.click(screen.getByRole("button", { name: "2x" }));
    fireEvent.click(screen.getByRole("button", { name: "Mahal" }));
    fireEvent.click(screen.getByRole("button", { name: "Kechki ovqat" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Bugungi logga qo'shish" }),
    );

    expect(mockAddToMealLog).toHaveBeenCalledWith(
      11,
      expect.objectContaining({
        date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        mealType: "dinner",
        servings: 2,
      }),
    );
  });

  it("adds the recipe to the active meal plan", () => {
    renderDetailPage();

    fireEvent.click(screen.getByRole("button", { name: "Rejaga qo'shish" }));

    expect(mockAddToMealPlan).toHaveBeenCalledWith(
      11,
      expect.objectContaining({
        planId: "plan-1",
        dayKey: "day-1",
        mealType: "lunch",
        servings: 1,
      }),
    );
  });

  it("creates a recipe shopping list with servings and price context", () => {
    renderDetailPage();

    fireEvent.click(screen.getByRole("button", { name: "2x" }));
    fireEvent.click(screen.getByRole("button", { name: "Narx hududi" }));
    fireEvent.click(screen.getByRole("button", { name: "Toshkent" }));
    fireEvent.click(screen.getByRole("button", { name: "Mavsum" }));
    fireEvent.click(screen.getByRole("button", { name: "Qish" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Xarid ro'yxati yaratish" }),
    );

    expect(mockCreateShoppingList).toHaveBeenCalledWith(11, {
      servings: 2,
      regionKey: "toshkent",
      season: "winter",
    });
  });
});
