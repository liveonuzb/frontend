import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import NutritionHomeView from "./home-view.jsx";

vi.mock("@/components/calorie-gauge-widget", () => ({
  default: ({ showCalorieModeToggle }) => (
    <section aria-label="calorie-card">
      <h2>Bugungi Kaloriya</h2>
      {showCalorieModeToggle ? <button type="button">Qolgan</button> : null}
    </section>
  ),
}));

vi.mock("../nutrition-plans-section.jsx", () => ({
  default: () => <section>Ovqatlanish rejalari</section>,
}));

const baseProps = {
  date: new Date("2026-05-14T12:00:00"),
  setDate: vi.fn(),
  plans: [],
  currentPlan: null,
  dateKey: "2026-05-14",
  todayKey: "2026-05-25",
  selectedDateLabel: "14-may",
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
  onOpenCalendar: vi.fn(),
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
  it("renders the overview calorie gauge before dashboard blocks without the external target strip", () => {
    renderHome();

    const calorieGauge = screen.getAllByText("Bugungi Kaloriya")[0];

    expectBefore(calorieGauge, screen.getByText("Kunlik health score"));
    expectBefore(calorieGauge, screen.getByText("Suv progress"));
    expectBefore(calorieGauge, screen.getByText("Bugungi ovqatlar"));
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText(/14-may/)).toBeInTheDocument();
    expect(screen.queryByText("Kaloriya holati")).not.toBeInTheDocument();
    expect(screen.queryByText(/Target:/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Qolgan" })).toBeInTheDocument();
    expect(screen.queryByText("+900 kcal")).not.toBeInTheDocument();
    expect(screen.queryByText("Makro balans")).not.toBeInTheDocument();
    expect(screen.queryByText("Tez harakatlar")).not.toBeInTheDocument();
    expect(screen.queryByText("Home")).not.toBeInTheDocument();
  });

  it("opens the overview date drawer from the calendar action", () => {
    const onOpenCalendar = vi.fn();

    renderHome({ onOpenCalendar });

    fireEvent.click(screen.getByRole("button", { name: /Sana tanlash/i }));

    expect(onOpenCalendar).toHaveBeenCalledTimes(1);
  });

  it("removes goal update entry points from the home view", () => {
    renderHome();

    expect(
      screen.queryByRole("button", { name: /Maqsadimni yangilash/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Maqsad$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /uchun ovqat qo'shish/i }).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /Suv qo'shish/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Og'irlik yozish/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Ovqat rejasini ko'rish/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Hisobotlar/i })).not.toBeInTheDocument();
  });

  it("opens add flow with the selected meal type from the compact timeline", () => {
    const setSelectedMealTypeForAdd = vi.fn();
    const setIsActionDrawerOpen = vi.fn();

    renderHome({ setSelectedMealTypeForAdd, setIsActionDrawerOpen });

    expect(
      screen.getByTestId("nutrition-meal-timeline-row-breakfast"),
    ).toHaveTextContent("Nonushta");

    fireEvent.click(
      screen.getByRole("button", { name: /Tushlik uchun ovqat qo'shish/i }),
    );

    expect(setSelectedMealTypeForAdd).toHaveBeenCalledWith("lunch");
    expect(setIsActionDrawerOpen).toHaveBeenCalledWith(true);
  });

  it("expands the active meal by default and lets another row expand", () => {
    renderHome();

    const breakfastToggle = screen.getByRole("button", {
      name: /Nonushta tafsilotlari/i,
    });
    const lunchToggle = screen.getByRole("button", {
      name: /Tushlik tafsilotlari/i,
    });

    expect(breakfastToggle).toHaveAttribute("aria-expanded", "true");
    expect(lunchToggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("Tuxum")).toBeInTheDocument();

    fireEvent.click(lunchToggle);

    expect(breakfastToggle).toHaveAttribute("aria-expanded", "false");
    expect(lunchToggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Hali ovqat qo'shilmagan")).toBeInTheDocument();
  });

  it("keeps past date meal rows viewable but disables add actions", () => {
    renderHome({ isPastDate: true });

    expect(
      screen.getByRole("button", { name: /Nonushta tafsilotlari/i }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("button", { name: /Tushlik uchun ovqat qo'shish/i }),
    ).toBeDisabled();
  });
});
