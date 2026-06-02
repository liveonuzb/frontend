import React from "react";
import i18n from "@/lib/i18n";

i18n.changeLanguage("uz");
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { describe, expect, it, vi } from "vitest";
import NutritionShell from "./nutrition-shell.jsx";
import NutritionRoutes from "./routes.jsx";

const mockUseNutritionRecipeDetail = vi.fn();

vi.mock("./home/index.jsx", () => ({
  default: () => <div>Nutrition Overview Page</div>,
}));

vi.mock("./plans/index.jsx", () => ({
  default: () => <div>Nutrition Plans Page</div>,
}));

vi.mock("./history/index.jsx", () => ({
  default: () => <div>Nutrition History Page</div>,
}));

vi.mock("./recipes/index.jsx", () => ({
  default: () => <div>Nutrition Recipes Page</div>,
}));

vi.mock("@/hooks/app/use-nutrition-recipes.js", () => ({
  useNutritionRecipeDetail: (...args) => mockUseNutritionRecipeDetail(...args),
  useNutritionRecipeActions: () => ({
    toggleFavorite: vi.fn(),
    addToMealPlan: vi.fn(),
    isUpdating: false,
  }),
}));

vi.mock("@/hooks/app/use-meal-plan.js", () => ({
  useMealPlan: () => ({
    plans: [],
    activePlan: null,
    draftPlan: null,
  }),
}));

vi.mock("./report/index.jsx", () => ({
  default: () => <div>Nutrition Report Page</div>,
}));

const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="nutrition-location">{location.pathname}</div>;
};

describe("NutritionShell", () => {
  it("shows top tabs on nutrition overview", () => {
    render(
      <MemoryRouter initialEntries={["/user/nutrition/overview"]}>
        <Routes>
          <Route path="/user/nutrition/*" element={<NutritionShell />}>
            <Route path="overview" element={<div>Nutrition Overview</div>} />
            <Route path="plans" element={<div>Nutrition Plans</div>} />
            <Route path="recipes" element={<div>Nutrition Recipes</div>} />
            <Route path="history" element={<div>Nutrition History</div>} />
            <Route path="report" element={<div>Nutrition Report</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getAllByText("Umumiy").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Rejalar").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Retseptlar").length).toBeGreaterThan(0);
    expect(screen.queryByText("Meals")).not.toBeInTheDocument();
    expect(screen.queryByText("Overview")).not.toBeInTheDocument();
    expect(screen.queryByText("Plans")).not.toBeInTheDocument();
    expect(screen.getAllByText("Tarix").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Hisobot").length).toBeGreaterThan(0);
    expect(screen.getByText("Nutrition Overview")).toBeInTheDocument();
  });

  it("hides top tabs on deep nutrition route", () => {
    render(
      <MemoryRouter initialEntries={["/user/nutrition/plans/plan-1"]}>
        <Routes>
          <Route path="/user/nutrition/*" element={<NutritionShell />}>
            <Route path="overview" element={<div>Nutrition Overview</div>} />
            <Route path="plans" element={<div>Nutrition Plans</div>} />
            <Route
              path="plans/:planId"
              element={<div>Nutrition Plan Detail</div>}
            />
            <Route path="recipes" element={<div>Nutrition Recipes</div>} />
            <Route path="history" element={<div>Nutrition History</div>} />
            <Route path="report" element={<div>Nutrition Report</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.queryByText("Umumiy")).not.toBeInTheDocument();
    expect(screen.queryByText("Rejalar")).not.toBeInTheDocument();
    expect(screen.queryByText("Retseptlar")).not.toBeInTheDocument();
    expect(screen.getByText("Nutrition Plan Detail")).toBeInTheDocument();
  });

  it("does not treat the removed nutrition home path as a primary tab", () => {
    render(
      <MemoryRouter initialEntries={["/user/nutrition/home"]}>
        <Routes>
          <Route path="/user/nutrition/*" element={<NutritionShell />}>
            <Route path="overview" element={<div>Nutrition Overview</div>} />
            <Route path="plans" element={<div>Nutrition Plans</div>} />
            <Route path="recipes" element={<div>Nutrition Recipes</div>} />
            <Route path="history" element={<div>Nutrition History</div>} />
            <Route path="report" element={<div>Nutrition Report</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.queryByText("Nutrition Overview")).not.toBeInTheDocument();
    expect(screen.queryByText("Umumiy")).not.toBeInTheDocument();
  });

  it("redirects the nutrition index to overview", async () => {
    render(
      <MemoryRouter initialEntries={["/user/nutrition"]}>
        <Routes>
          <Route
            path="/user/nutrition/*"
            element={
              <>
                <NutritionRoutes />
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("nutrition-location")).toHaveTextContent(
        "/user/nutrition/overview",
      );
    });
    expect(screen.getAllByText("Umumiy").length).toBeGreaterThan(0);
  });

  it("renders the dedicated recipes route as a primary nutrition tab", async () => {
    render(
      <MemoryRouter initialEntries={["/user/nutrition/recipes"]}>
        <Routes>
          <Route
            path="/user/nutrition/*"
            element={
              <>
                <NutritionRoutes />
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Nutrition Recipes Page")).toBeInTheDocument();
    });
    expect(screen.getByTestId("nutrition-location")).toHaveTextContent(
      "/user/nutrition/recipes",
    );
    expect(screen.getAllByText("Retseptlar").length).toBeGreaterThan(0);
  });

  it("renders recipe detail as a deep nutrition route without top tabs", async () => {
    mockUseNutritionRecipeDetail.mockReturnValue({
      recipe: {
        catalogFoodId: 11,
        title: "Toshkent palovi",
        description: "Klassik palov",
        calories: 540,
        protein: 18,
        carbs: 62,
        fat: 22,
        fiber: 6,
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
      },
      isLoading: false,
      isError: false,
    });

    render(
      <MemoryRouter
        initialEntries={["/user/nutrition/recipes/toshkent-palovi"]}
      >
        <Routes>
          <Route
            path="/user/nutrition/*"
            element={
              <>
                <NutritionRoutes />
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Toshkent palovi")).toBeInTheDocument();
    });
    expect(mockUseNutritionRecipeDetail).toHaveBeenCalledWith(
      "toshkent-palovi",
    );
    expect(screen.getByText("Klassik palov")).toBeInTheDocument();
    expect(screen.getByText("Guruch")).toBeInTheDocument();
    expect(screen.getByText("Guruchni yuving")).toBeInTheDocument();
    expect(screen.getByTestId("nutrition-location")).toHaveTextContent(
      "/user/nutrition/recipes/toshkent-palovi",
    );
    expect(screen.queryByText("Umumiy")).not.toBeInTheDocument();
    expect(screen.queryByText("Retseptlar")).not.toBeInTheDocument();
  });
});
