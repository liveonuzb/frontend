import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import NutritionHomeView from "./home-view.jsx";

vi.mock("@/components/calorie-gauge-widget", () => ({
  default: () => (
    <section aria-label="calorie-card">
      <h2>Bugungi Kaloriya</h2>
    </section>
  ),
}));

vi.mock("../nutrition-header.jsx", () => ({
  NutritionDatePicker: () => <div>Sana tanlash</div>,
}));

vi.mock("../nutrition-plans-section.jsx", () => ({
  default: () => <section>Ovqatlanish rejalari</section>,
}));

const baseProps = {
  date: new Date("2026-05-14T12:00:00"),
  setDate: vi.fn(),
  plans: [],
  currentPlan: null,
  goals: {
    calories: 2200,
    protein: 150,
    carbs: 250,
    fat: 70,
  },
  roundedTotals: {
    calories: 900,
    protein: 80,
    carbs: 120,
    fat: 35,
  },
  waterConsumedMl: 1000,
  waterGoalMl: 2500,
  calorieGoalMeta: null,
  isGoalLoadingState: false,
  activeMealType: "breakfast",
  mealConfig: {
    breakfast: { label: "Nonushta", emoji: "N", time: "06:00 - 10:00" },
    lunch: { label: "Tushlik", emoji: "T", time: "12:00 - 14:00" },
    dinner: { label: "Kechki ovqat", emoji: "K", time: "18:00 - 21:00" },
    snack: { label: "Snack", emoji: "S", time: "Istalgan vaqt" },
  },
  filteredMealSections: [
    ["breakfast", { time: "06:00 - 10:00", foods: [{ id: "meal-1", name: "Tuxum", cal: 300, qty: 1 }] }],
    ["lunch", { time: "12:00 - 14:00", foods: [] }],
    ["dinner", { time: "18:00 - 21:00", foods: [] }],
    ["snack", { time: "Istalgan vaqt", foods: [] }],
  ],
  setSelectedMealTypeForAdd: vi.fn(),
  setIsActionDrawerOpen: vi.fn(),
  setIsPlansDrawerOpen: vi.fn(),
  isOnline: true,
  isPastDate: false,
};

const renderHome = (props = {}) =>
  render(
    <MemoryRouter>
      <NutritionHomeView {...baseProps} {...props} />
    </MemoryRouter>,
  );

const expectBefore = (first, second) => {
  expect(
    Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING),
  ).toBe(true);
};

describe("NutritionHomeView", () => {
  it("renders today's calorie gauge before home dashboard blocks", () => {
    renderHome();

    const calorieGauge = screen.getAllByText("Bugungi Kaloriya")[0];

    expectBefore(calorieGauge, screen.getByText("Kunlik health score"));
    expectBefore(calorieGauge, screen.getByText("Suv progress"));
    expectBefore(calorieGauge, screen.getByText("Makro balans"));
    expectBefore(calorieGauge, screen.getByText("Tez harakatlar"));
  });

  it("removes goal update entry points from the home view", () => {
    renderHome();

    expect(
      screen.queryByRole("button", { name: /Maqsadimni yangilash/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Maqsad$/i }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Ovqat qo'shish/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Suv qo'shish/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ovqat rejasini ko'rish/i })).toBeInTheDocument();
  });
});
