import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import RecipePreviewDrawer from "./index.jsx";

const mockUseGetQuery = vi.fn();
const mockCloseAdminDrawer = vi.fn();

const recipeFixture = {
  id: 41,
  name: "Tovuqli bowl",
  translations: { uz: "Tovuqli bowl" },
  description: "Mashqdan keyin oqsilga boy taom.",
  calories: 520,
  protein: 38,
  carbs: 48,
  fat: 14,
  cookingMinutes: 25,
  servings: 2,
  categories: [{ name: "Lunch", translations: { uz: "Tushlik" } }],
  cuisines: [{ name: "Fitness", translations: { uz: "Fitness" } }],
  recipeItems: [
    {
      id: 1,
      grams: 120,
      ingredient: {
        name: "Chicken breast",
        translations: { uz: "Tovuq filesi" },
      },
    },
  ],
  recipeInstructions: [
    {
      id: 1,
      stepNumber: 1,
      title: "Pishirish",
      body: "Tovuqni qizdirilgan tovada pishiring.",
      durationMinutes: 10,
    },
  ],
};

vi.mock("@/hooks/api", () => ({
  useGetQuery: (options) => mockUseGetQuery(options),
}));

vi.mock("@/store", () => ({
  useLanguageStore: (selector) => selector({ currentLanguage: "uz" }),
}));

vi.mock("@/modules/admin/lib/admin-drawer-navigation.js", () => ({
  useAdminDrawerCloseNavigation: () => mockCloseAdminDrawer,
}));

vi.mock("@/components/ui/drawer", () => ({
  Drawer: ({ children, open, onOpenChange }) =>
    open ? (
      <div>
        <button type="button" onClick={() => onOpenChange(false)}>
          Drawer close
        </button>
        {children}
      </div>
    ) : null,
  DrawerBody: ({ children }) => <main>{children}</main>,
  DrawerContent: ({ children }) => <section>{children}</section>,
  DrawerDescription: ({ children }) => <p>{children}</p>,
  DrawerHeader: ({ children }) => <header>{children}</header>,
  DrawerTitle: ({ children }) => <h2>{children}</h2>,
}));

describe("RecipePreviewDrawer", () => {
  beforeEach(() => {
    mockCloseAdminDrawer.mockClear();
    mockUseGetQuery.mockClear();
    mockUseGetQuery.mockReturnValue({
      data: { data: recipeFixture },
      isLoading: false,
    });
  });

  it("loads recipe detail and renders a read-only admin preview", () => {
    render(
      <MemoryRouter initialEntries={["/admin/recipes/list/preview/41"]}>
        <Routes>
          <Route
            path="/admin/recipes/list/preview/:id"
            element={<RecipePreviewDrawer />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(mockUseGetQuery).toHaveBeenCalledWith({
      url: "/admin/nutrition/recipes/41",
      queryProps: {
        enabled: true,
        queryKey: ["admin", "recipes", "detail", "41"],
      },
    });
    expect(screen.getByText("Retsept preview")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Tovuqli bowl" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Mashqdan keyin oqsilga boy taom."),
    ).toBeInTheDocument();
    expect(screen.getByText("520 kcal")).toBeInTheDocument();
    expect(screen.getByText("38g protein")).toBeInTheDocument();
    expect(screen.getByText("Tushlik")).toBeInTheDocument();
    expect(screen.getByText("Tovuq filesi")).toBeInTheDocument();
    expect(screen.getByText("120 g")).toBeInTheDocument();
    expect(screen.getByText("Pishirish")).toBeInTheDocument();
    expect(
      screen.getByText("Tovuqni qizdirilgan tovada pishiring."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Drawer close" }));

    expect(mockCloseAdminDrawer).toHaveBeenCalledTimes(1);
  });
});
