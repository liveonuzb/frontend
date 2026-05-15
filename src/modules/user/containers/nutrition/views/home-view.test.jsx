import React from "react";
import { render, screen } from "@testing-library/react";
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
  setSelectedMealTypeForAdd: vi.fn(),
  setIsActionDrawerOpen: vi.fn(),
  setIsPlansDrawerOpen: vi.fn(),
  isOnline: true,
  isPastDate: false,
};

const expectBefore = (first, second) => {
  expect(
    Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING),
  ).toBe(true);
};

describe("NutritionHomeView", () => {
  it("renders today's calorie gauge before home dashboard blocks", () => {
    render(<NutritionHomeView {...baseProps} />);

    const calorieGauge = screen.getByText("Bugungi Kaloriya");

    expectBefore(calorieGauge, screen.getByText("Sana tanlash"));
    expectBefore(calorieGauge, screen.getByText("Kunlik health score"));
    expectBefore(calorieGauge, screen.getByText("Suv progress"));
    expectBefore(calorieGauge, screen.getByText("Protein"));
    expectBefore(calorieGauge, screen.getByText("Tez harakatlar"));
  });

  it("removes goal update entry points from the home view", () => {
    render(<NutritionHomeView {...baseProps} />);

    expect(
      screen.queryByRole("button", { name: /Maqsadimni yangilash/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Maqsad$/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ovqat/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Saqlangan/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Rejalar/i })).toBeInTheDocument();
  });
});
