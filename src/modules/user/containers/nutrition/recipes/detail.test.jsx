import React from "react";
import i18n from "@/lib/i18n";

i18n.changeLanguage("uz");
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NutritionRecipeDetailPage from "./detail.jsx";

const mockToggleFavorite = vi.fn();
const mockAddToMealLog = vi.fn();
const mockAddToMealPlan = vi.fn();
const mockToastSuccess = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    success: (...args) => mockToastSuccess(...args),
    error: vi.fn(),
  },
}));

vi.mock("@/hooks/app/use-nutrition-recipes.js", () => ({
  useNutritionRecipeDetail: () => ({
    recipe: null,
    isLoading: false,
    isError: false,
  }),
  useNutritionRecipeActions: () => ({
    toggleFavorite: mockToggleFavorite,
    addToMealLog: mockAddToMealLog,
    addToMealPlan: mockAddToMealPlan,
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

const renderDetailPage = () =>
  render(
    <MemoryRouter initialEntries={["/user/nutrition/recipes/tovuqli-quinoa-salatasi"]}>
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
  });

  it("renders the recipe detail fallback and scales ingredients by servings", () => {
    renderDetailPage();

    expect(
      screen.getByRole("heading", { name: "Tovuqli quinoa salatasi" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("420").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Porsiyani oshirish" }));

    expect(screen.getAllByText("840").length).toBeGreaterThan(0);
    expect(screen.getByText("240 g")).toBeInTheDocument();
  });

  it("toggles favorite and submits through the add drawer", async () => {
    renderDetailPage();

    fireEvent.click(screen.getByRole("button", { name: "Sevimlilarga qo'shish" }));

    expect(
      screen.getByRole("button", { name: "Sevimlilardan olib tashlash" }),
    ).toHaveAttribute("aria-pressed", "true");

    expect(
      screen.getByRole("button", { name: "Pishirishni boshlash" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Qo'shish" }));

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
});
