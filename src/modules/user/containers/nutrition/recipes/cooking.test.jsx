import React from "react";
import i18n from "@/lib/i18n";

i18n.changeLanguage("uz");
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NutritionRecipeCookingPage from "./cooking.jsx";

const mockAddToMealLog = vi.fn();
const mockAddToMealPlan = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/hooks/app/use-nutrition-recipes.js", () => ({
  useNutritionRecipeDetail: () => ({
    recipe: null,
    isLoading: false,
  }),
  useNutritionRecipeActions: () => ({
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

const renderCookingPage = () =>
  render(
    <MemoryRouter initialEntries={["/user/nutrition/recipes/tovuqli-quinoa-salatasi/cook"]}>
      <Routes>
        <Route
          path="/user/nutrition/recipes/:slugOrId/cook"
          element={<NutritionRecipeCookingPage />}
        />
      </Routes>
    </MemoryRouter>,
  );

describe("NutritionRecipeCookingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddToMealLog.mockResolvedValue({});
    mockAddToMealPlan.mockResolvedValue({});
  });

  it("walks recipe steps and opens add drawer on finish", async () => {
    renderCookingPage();

    expect(screen.getByText("Quinoani tayyorlang")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Keyingi" }));
    expect(screen.getByText("Tovuqni pishiring")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Keyingi" }));
    fireEvent.click(screen.getByRole("button", { name: "Keyingi" }));
    fireEvent.click(screen.getByRole("button", { name: "Keyingi" }));
    fireEvent.click(screen.getByRole("button", { name: "Tugatish" }));

    expect(screen.getByText("Rejaga qo'shish")).toBeInTheDocument();

    const submitButtons = screen.getAllByRole("button", { name: "Qo'shish" });
    fireEvent.click(submitButtons[submitButtons.length - 1]);

    await waitFor(() => {
      expect(mockAddToMealLog).toHaveBeenCalledWith(
        101,
        expect.objectContaining({
          mealType: expect.stringMatching(/breakfast|lunch|dinner|snack/),
          servings: 1,
        }),
      );
    });
  });
});
