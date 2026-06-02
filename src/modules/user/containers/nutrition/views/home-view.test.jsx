import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import NutritionHomeView from "./home-view.jsx";

vi.mock("@/components/calorie-gauge-widget", () => ({
  default: ({ burnedCalories, consumed, goal, macros, showCalorieModeToggle }) => (
    <section aria-label="calorie-card">
      <h2>Bugungi Kaloriya</h2>
      <p>Yondirilgan {burnedCalories} kcal</p>
      <p>{consumed} / {goal} kcal</p>
      <p>Oqsil {macros?.protein?.current} / {macros?.protein?.target}</p>
      {showCalorieModeToggle ? <button type="button">Qolgan</button> : null}
    </section>
  ),
}));

vi.mock("../nutrition-plans-section.jsx", () => ({
  default: () => <section>Ovqatlanish rejalari</section>,
}));

vi.mock("../nutrition-ai-assistant-panel.jsx", () => ({
  default: () => <section>Ombor paneli</section>,
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
  burnedCalories: 875,
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
    expect(screen.getByText("Umumiy ko'rinish")).toBeInTheDocument();
    expect(screen.queryByText("Overview")).not.toBeInTheDocument();
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

  it("counts completed meal sections from the visible daily meals", () => {
    renderHome();

    expect(screen.getByText("Ovqatlar yakunlandi")).toBeInTheDocument();
    expect(screen.getByText("1 / 4")).toBeInTheDocument();
  });

  it("passes burned calories into the overview calorie gauge", () => {
    renderHome();

    expect(screen.getByText("Yondirilgan 875 kcal")).toBeInTheDocument();
  });

  it("uses backend nutrition dashboard metrics when provided", () => {
    renderHome({
      nutritionDashboard: {
        calories: {
          current: 1234,
          target: 2100,
          remaining: 866,
          percent: 59,
        },
        macros: {
          protein: { current: 77, target: 130, percent: 59 },
          carbs: { current: 144, target: 240, percent: 60 },
          fat: { current: 41, target: 70, percent: 59 },
        },
        water: {
          currentMl: 1800,
          targetMl: 2600,
          percent: 69,
        },
        meals: {
          completed: 3,
          total: 4,
        },
      },
    });

    expect(screen.getByText("1234 / 2100 kcal")).toBeInTheDocument();
    expect(screen.getByText("Oqsil 77 / 130")).toBeInTheDocument();
    expect(screen.getByText("1800 / 2600")).toBeInTheDocument();
    expect(screen.getByText("3 / 4")).toBeInTheDocument();
    expect(screen.queryByText("900 / 2200 kcal")).not.toBeInTheDocument();
    expect(screen.queryByText("1000 / 2500")).not.toBeInTheDocument();
  });

  it("does not label a zero health score as good", () => {
    renderHome({
      roundedTotals: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      },
      waterConsumedMl: 0,
    });

    expect(screen.getByText("Boshlanmagan")).toBeInTheDocument();
    expect(screen.queryByText("Yaxshi")).not.toBeInTheDocument();
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

  it("opens add flow directly from an empty meal card", () => {
    const setSelectedMealTypeForAdd = vi.fn();
    const setIsActionDrawerOpen = vi.fn();

    renderHome({
      activeMealType: "lunch",
      setSelectedMealTypeForAdd,
      setIsActionDrawerOpen,
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Tushlikka ovqat qo'shish/i }),
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
