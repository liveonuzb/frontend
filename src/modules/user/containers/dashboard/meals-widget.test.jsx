import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MealsWidget from "./meals-widget.jsx";
import { useGetQuery } from "@/hooks/api";

const openActionDrawer = vi.fn();

vi.mock("@/hooks/api", () => ({
  useGetQuery: vi.fn(),
}));

vi.mock("@/hooks/app/use-daily-tracking", () => ({
  useDailyTrackingActions: () => ({
    addMeal: vi.fn(),
  }),
}));

vi.mock("@/hooks/app/use-saved-meals", () => ({
  useSavedMeals: () => ({
    items: [],
  }),
}));

vi.mock("@/hooks/app/use-saved-meal-templates", () => ({
  buildLoggedMealFromSavedMealTemplate: vi.fn(),
  getWeekdayNameFromDate: () => "Du",
  useSavedMealTemplates: () => ({
    templates: [],
    recurringPatterns: [],
  }),
}));

vi.mock("@/store", () => ({
  useAddMealOverlayStore: (selector) =>
    selector({
      openActionDrawer,
    }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const dayData = {
  date: "2026-05-14",
  meals: {
    breakfast: [
      { id: "breakfast-1", name: "Tuxum", cal: 120, qty: 2 },
      { id: "breakfast-2", name: "Non", cal: 80, qty: 1 },
    ],
    lunch: [{ id: "lunch-1", name: "Salat", cal: 100, qty: 1 }],
    dinner: [],
    snack: [],
  },
};

const goalsState = {
  goals: {
    calories: 2000,
  },
};

const renderWidget = (props = {}) =>
  render(
    <MemoryRouter>
      <MealsWidget
        dateKey="2026-05-14"
        dayData={dayData}
        goalsState={goalsState}
        {...props}
      />
    </MemoryRouter>,
  );

describe("MealsWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useGetQuery).mockReturnValue({ data: null });
  });

  it("fills the width of its dashboard grid cell without an outer card", () => {
    renderWidget();

    const widget = screen.getByTestId("dashboard-meals-widget");

    expect(widget).toHaveClass("w-full");
    expect(widget.querySelector("[data-slot=card]")).not.toBeInTheDocument();
  });

  it("renders meals as recommendation rows with a text view-all action", () => {
    renderWidget();

    expect(
      screen.getByRole("button", { name: "Ovqatlanish sahifasini ochish" }),
    ).toHaveTextContent("Barchasi");
    expect(screen.getByText("Nonushta qo'shish")).toBeInTheDocument();
    expect(
      screen.getByText("Tavsiya etiladi | 510 - 690 kcal"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Nonushta qo'shish" }),
    ).toHaveClass("rounded-2xl");
  });

  it("keeps dashboard rows as compact summaries without rendering food details", () => {
    renderWidget();

    const breakfastToggle = screen.getByRole("button", {
      name: /^Nonushta\s+320 kcal$/i,
    });

    expect(screen.queryByText("Tuxum")).not.toBeInTheDocument();
    expect(screen.queryByText("Salat")).not.toBeInTheDocument();

    fireEvent.click(breakfastToggle);

    expect(screen.queryByText("Tuxum")).not.toBeInTheDocument();
    expect(screen.queryByText("Salat")).not.toBeInTheDocument();
  });

  it("keeps quick add from toggling the meal row", () => {
    const onAddMeal = vi.fn();

    renderWidget({ onAddMeal });

    const breakfastToggle = screen.getByRole("button", {
      name: /^Nonushta\s+320 kcal$/i,
    });
    fireEvent.click(screen.getByRole("button", { name: /Nonushta qo'shish/i }));

    expect(onAddMeal).toHaveBeenCalledWith("breakfast");
    expect(breakfastToggle).toBeInTheDocument();
    expect(screen.queryByText("Tuxum")).not.toBeInTheDocument();
  });
});
