import React from "react";
import i18n from "@/lib/i18n";

i18n.changeLanguage("uz");
import { fireEvent, render, screen, within } from "@testing-library/react";
import { map } from "lodash";
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

vi.mock("../portion-editor-drawer.jsx", () => ({
  default: ({ food, open, onConfirm }) =>
    open ? (
      <section role="dialog" aria-label={`${food?.name || "Ovqat"} porsiyasi`}>
        <button
          type="button"
          onClick={() =>
            onConfirm(150, {
              cal: 450,
              protein: 30,
              carbs: 12,
              fat: 20,
            })
          }
        >
          Mock portion save
        </button>
      </section>
    ) : null,
}));

vi.mock("@/modules/user/containers/dashboard/meal-details-drawer.jsx", () => ({
  default: ({
    open,
    onOpenChange,
    dateKey,
    mealType,
    mealLabel,
    loggedItems = [],
    plannedItems = [],
    onAddMeal,
    addDisabled = false,
  }) =>
    open ? (
      <section
        role="dialog"
        aria-label={`${mealLabel} ovqatlari`}
        data-testid="nutrition-meal-details-drawer"
      >
        <h2>{mealLabel}</h2>
        <p data-testid="nutrition-meal-details-drawer-date">{dateKey}</p>
        <p data-testid="nutrition-meal-details-drawer-type">{mealType}</p>
        {loggedItems.length > 0 ? (
          <div data-testid="nutrition-meal-details-logged-items">
            {map(loggedItems, (item) => (
              <p key={item.id || item.name}>{item.name}</p>
            ))}
          </div>
        ) : null}
        {plannedItems.length > 0 ? (
          <div data-testid="nutrition-meal-details-planned-items">
            {map(plannedItems, (item) => (
              <p key={item.id || item.name}>{item.name}</p>
            ))}
          </div>
        ) : null}
        <button
          type="button"
          aria-label={`${mealLabel} uchun ovqat qo'shish`}
          disabled={addDisabled}
          onClick={() => onAddMeal?.(mealType)}
        >
          Drawer add
        </button>
        <button type="button" onClick={() => onOpenChange?.(false)}>
          Drawer close
        </button>
      </section>
    ) : null,
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
    snack: { label: "Tamaddi", emoji: "S", time: "Istalgan vaqt" },
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
  onOpenPlanShopping: vi.fn(),
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
    expect(
      screen.getByText("14-may uchun vaqt bo'yicha yozuvlar"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("nutrition-meal-timeline-summary"),
    ).toHaveTextContent("1/4");
    expect(screen.queryByText("Umumiy ko'rinish")).not.toBeInTheDocument();
    expect(screen.queryByText("Обзор")).not.toBeInTheDocument();
    expect(screen.queryByText("Overview")).not.toBeInTheDocument();
    expect(screen.getAllByText(/14-may/).length).toBeGreaterThan(0);
    expect(screen.queryByText("Kaloriya holati")).not.toBeInTheDocument();
    expect(screen.queryByText(/Target:/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Qolgan" })).toBeInTheDocument();
    expect(screen.queryByText("+900 kcal")).not.toBeInTheDocument();
    expect(screen.queryByText("Makro balans")).not.toBeInTheDocument();
    expect(screen.queryByText("Tez harakatlar")).not.toBeInTheDocument();
    expect(screen.queryByTestId("nutrition-overview-quick-actions"))
      .not.toBeInTheDocument();
    expect(screen.queryByText("Home")).not.toBeInTheDocument();
  });

  it("does not render the draft-only pantry assistant panel", () => {
    renderHome();

    expect(screen.queryByText("Ombor paneli")).not.toBeInTheDocument();
  });

  it("does not render the removed overview date header", () => {
    const onOpenCalendar = vi.fn();

    renderHome({ onOpenCalendar });

    expect(
      screen.queryByRole("button", { name: /Sana tanlash/i }),
    ).not.toBeInTheDocument();
    expect(onOpenCalendar).not.toHaveBeenCalled();
  });

  it("does not render the removed date shortcuts", () => {
    const onSelectDateShortcut = vi.fn();
    const dateShortcuts = [
      {
        id: "yesterday",
        label: "Kecha",
        dateKey: "2026-05-13",
        date: new Date("2026-05-13T12:00:00"),
        active: false,
      },
      {
        id: "today",
        label: "Bugun",
        dateKey: "2026-05-14",
        date: new Date("2026-05-14T12:00:00"),
        active: true,
      },
      {
        id: "tomorrow",
        label: "Ertaga",
        dateKey: "2026-05-15",
        date: new Date("2026-05-15T12:00:00"),
        active: false,
      },
    ];

    renderHome({ dateShortcuts, onSelectDateShortcut });

    expect(screen.queryByTestId("nutrition-date-shortcuts"))
      .not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Kecha" }))
      .not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Bugun" }))
      .not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ertaga" }))
      .not.toBeInTheDocument();
    expect(onSelectDateShortcut).not.toHaveBeenCalled();
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

  it("does not render backend feedback signal cards", () => {
    const setSelectedMealTypeForAdd = vi.fn();
    const setIsActionDrawerOpen = vi.fn();

    renderHome({
      setSelectedMealTypeForAdd,
      setIsActionDrawerOpen,
      nutritionDashboard: {
        calories: {
          current: 1234,
          target: 2100,
          remaining: 866,
          percent: 59,
        },
        macros: {
          protein: { current: 42, target: 130, percent: 32 },
          carbs: { current: 144, target: 240, percent: 60 },
          fat: { current: 41, target: 70, percent: 59 },
        },
        water: {
          currentMl: 900,
          targetMl: 2600,
          percent: 35,
        },
        meals: {
          completed: 1,
          total: 4,
        },
        feedback: {
          items: [
            {
              id: "dashboard-low-water",
              metric: "water",
              severity: "info",
              title: "Suv kam ichilgan",
              message: "Kunning qolgan qismida suv qo'shing.",
              actual: 900,
              target: 2600,
              unit: "ml",
            },
            {
              id: "dashboard-low-protein",
              metric: "protein",
              severity: "warning",
              title: "Protein maqsaddan past",
              message: "Keyingi ovqatga protein qo'shing.",
              actual: 42,
              target: 130,
              unit: "g",
            },
          ],
        },
      },
    });

    expect(screen.queryByTestId("nutrition-dashboard-feedback"))
      .not.toBeInTheDocument();
    expect(screen.queryByText("Bugungi signal")).not.toBeInTheDocument();
    expect(screen.queryByText("Suv kam ichilgan")).not.toBeInTheDocument();
    expect(screen.queryByText("Protein maqsaddan past")).not.toBeInTheDocument();
    expect(screen.queryByText("900 / 2600 ml")).not.toBeInTheDocument();
    expect(setSelectedMealTypeForAdd).not.toHaveBeenCalled();
    expect(setIsActionDrawerOpen).not.toHaveBeenCalled();
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
    expect(screen.getByTestId("nutrition-meal-dashboard-list"))
      .toHaveClass("gap-2.5");
    expect(screen.getByTestId("nutrition-meal-timeline-row-breakfast"))
      .toHaveClass("rounded-2xl", "bg-card");
    expect(screen.getByTestId("nutrition-meal-dashboard-row-content-breakfast"))
      .toHaveClass("px-3", "py-2.5");

    fireEvent.click(
      screen.getByRole("button", { name: /Tushlik uchun ovqat qo'shish/i }),
    );

    expect(setSelectedMealTypeForAdd).toHaveBeenCalledWith("lunch");
    expect(setIsActionDrawerOpen).toHaveBeenCalledWith(true);
  });

  it("uses dashboard-style meal icons with calorie progress rings", () => {
    renderHome();

    const breakfastRow = screen.getByTestId(
      "nutrition-meal-timeline-row-breakfast",
    );
    const progressRing = within(breakfastRow).getByTestId(
      "nutrition-meal-progress-ring-breakfast",
    );
    const progressBar = within(progressRing).getByRole("progressbar", {
      name: /Nonushta kaloriya progress/i,
    });

    expect(progressBar).toHaveAttribute("aria-valuenow", "45");
    expect(progressRing).toHaveClass("relative", "size-14");
    expect(
      within(progressRing).getByTestId("nutrition-meal-icon-image-breakfast"),
    ).toHaveClass("breakfast", "bg-contain", "bg-center", "bg-no-repeat");
  });

  it("opens logged meal details in a bottom drawer", () => {
    renderHome({
      filteredMealSections: [
        [
          "breakfast",
          {
            time: "06:00 - 10:00",
            foods: [
              {
                id: "meal-1",
                name: "Tuxum",
                cal: 300,
                protein: 24,
                carbs: 2,
                fat: 18,
                grams: 100,
                unit: "g",
                addedAt: "2026-05-14T08:20:00",
              },
            ],
          },
        ],
        ["lunch", { time: "12:00 - 14:00", foods: [] }],
        ["dinner", { time: "18:00 - 21:00", foods: [] }],
        ["snack", { time: "Istalgan vaqt", foods: [] }],
      ],
    });

    const breakfastRow = screen.getByTestId(
      "nutrition-meal-timeline-row-breakfast",
    );

    expect(breakfastRow).toHaveTextContent("Tavsiya etiladi | 561 - 759 kcal");
    expect(breakfastRow).toHaveTextContent("Oxirgi 08:20");
    expect(screen.queryByText("Tuxum")).not.toBeInTheDocument();

    fireEvent.click(
      within(breakfastRow).getByRole("button", { name: /Nonushta tafsilotlari/i }),
    );

    expect(screen.getByTestId("nutrition-meal-details-drawer"))
      .toHaveTextContent("Tuxum");
    expect(screen.getByTestId("nutrition-meal-details-drawer-date"))
      .toHaveTextContent("2026-05-14");
    expect(screen.getByTestId("nutrition-meal-details-drawer-type"))
      .toHaveTextContent("breakfast");
  });

  it("opens add flow from the meal details drawer", () => {
    const setSelectedMealTypeForAdd = vi.fn();
    const setIsActionDrawerOpen = vi.fn();

    renderHome({
      activeMealType: "lunch",
      setSelectedMealTypeForAdd,
      setIsActionDrawerOpen,
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Tushlik tafsilotlari/i }),
    );
    fireEvent.click(
      within(screen.getByTestId("nutrition-meal-details-drawer")).getByRole(
        "button",
        { name: /Tushlik uchun ovqat qo'shish/i },
      ),
    );

    expect(setSelectedMealTypeForAdd).toHaveBeenCalledWith("lunch");
    expect(setIsActionDrawerOpen).toHaveBeenCalledWith(true);
  });

  it("opens only the selected meal in the bottom drawer", () => {
    renderHome();

    const breakfastToggle = screen.getByRole("button", {
      name: /Nonushta tafsilotlari/i,
    });
    const lunchToggle = screen.getByRole("button", {
      name: /Tushlik tafsilotlari/i,
    });

    expect(breakfastToggle).not.toHaveAttribute("aria-expanded");
    expect(lunchToggle).not.toHaveAttribute("aria-expanded");
    expect(screen.queryByText("Tuxum")).not.toBeInTheDocument();

    fireEvent.click(breakfastToggle);

    expect(screen.getByTestId("nutrition-meal-details-drawer"))
      .toHaveTextContent("Nonushta");
    expect(screen.getByTestId("nutrition-meal-details-drawer"))
      .toHaveTextContent("Tuxum");

    fireEvent.click(screen.getByRole("button", { name: "Drawer close" }));
    fireEvent.click(lunchToggle);

    expect(screen.getByTestId("nutrition-meal-details-drawer"))
      .toHaveTextContent("Tushlik");
    expect(screen.queryByText("Hali ovqat qo'shilmagan")).not.toBeInTheDocument();
  });

  it("passes planned meal items into the bottom drawer", () => {
    renderHome({
      activeMealType: "lunch",
      filteredMealSections: [
        ["breakfast", { time: "06:00 - 10:00", foods: [] }],
        [
          "lunch",
          {
            time: "12:00 - 14:00",
            foods: [],
            plannedItems: [
              {
                id: "planned-soup",
                name: "Rejadagi sho'rva",
                cal: 420,
                protein: 26,
                carbs: 48,
                fat: 12,
              },
            ],
          },
        ],
      ],
    });

    fireEvent.click(screen.getByRole("button", { name: /Tushlik tafsilotlari/i }));

    expect(screen.getByTestId("nutrition-meal-details-planned-items"))
      .toHaveTextContent("Rejadagi sho'rva");
    expect(screen.getByTestId("nutrition-meal-timeline-summary"))
      .toHaveTextContent("0/2");
  });

  it("shows active plan details and opens plan actions", () => {
    const setIsPlansDrawerOpen = vi.fn();
    const onOpenPlanShopping = vi.fn();

    renderHome({
      setIsPlansDrawerOpen,
      onOpenPlanShopping,
      currentPlan: {
        id: "plan-1",
        name: "Protein reja",
        status: "active",
        shoppingLists: [
          {
            id: "shopping-1",
            items: [{ name: "Tuxum" }, { name: "Tovuq" }],
          },
        ],
      },
      currentPlanDayStatus: {
        isDurationPlan: true,
        dayNumber: 3,
        durationDays: 14,
      },
      filteredMealSections: [
        [
          "breakfast",
          {
            time: "06:00 - 10:00",
            foods: [{ id: "meal-1", name: "Tuxum", cal: 300, qty: 1 }],
            plannedItems: [{ id: "planned-eggs", name: "Tuxum" }],
          },
        ],
        [
          "lunch",
          {
            time: "12:00 - 14:00",
            foods: [],
            plannedItems: [{ id: "planned-bowl", name: "Tovuq bowl" }],
          },
        ],
        ["dinner", { time: "18:00 - 21:00", foods: [] }],
        ["snack", { time: "Istalgan vaqt", foods: [] }],
      ],
    });

    const planCard = screen.getByTestId("nutrition-active-plan-card");

    expect(within(planCard).getByText("Protein reja")).toBeInTheDocument();
    expect(within(planCard).getByText("Faol • 3 / 14 kun")).toBeInTheDocument();
    expect(within(planCard).getByText("Keyingi ovqat")).toBeInTheDocument();
    expect(within(planCard).getByText("Tushlik: Tovuq bowl")).toBeInTheDocument();
    expect(within(planCard).getByText("Adherence 50%")).toBeInTheDocument();
    expect(
      within(planCard).getByText("Xaridlar: 2 ta mahsulot"),
    ).toBeInTheDocument();

    fireEvent.click(
      within(planCard).getByRole("button", { name: "Bugungi reja" }),
    );

    expect(screen.getByTestId("nutrition-meal-timeline-row-lunch"))
      .toHaveTextContent("Hozir");

    fireEvent.click(
      within(planCard).getByRole("button", { name: /Rejani ko'rish/i }),
    );

    expect(setIsPlansDrawerOpen).toHaveBeenCalledWith(true);

    fireEvent.click(
      within(planCard).getByRole("button", { name: /Xaridlar/i }),
    );

    expect(onOpenPlanShopping).toHaveBeenCalledWith("plan-1");
  });

  it("does not render the removed overview quick action bar", () => {
    const onOpenQuickAddMethod = vi.fn();
    const onOpenSavedMeals = vi.fn();

    renderHome({
      onOpenQuickAddMethod,
      onOpenSavedMeals,
    });

    expect(screen.queryByTestId("nutrition-overview-quick-actions"))
      .not.toBeInTheDocument();
    expect(screen.queryByText("Tez harakatlar")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Manual" }))
      .not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Kamera" }))
      .not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Barcode" }))
      .not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Matn" }))
      .not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Audio" }))
      .not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Saqlangan" }))
      .not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Oxirgi" }))
      .not.toBeInTheDocument();
    expect(onOpenQuickAddMethod).not.toHaveBeenCalled();
    expect(onOpenSavedMeals).not.toHaveBeenCalled();
  });

  it("keeps past date meal rows viewable but disables add actions", () => {
    renderHome({ isPastDate: true });

    expect(screen.getByText("Tanlangan kun ovqatlari")).toBeInTheDocument();
    expect(screen.queryByText("Bugungi ovqatlar")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Nonushta tafsilotlari/i }),
    ).not.toHaveAttribute("aria-expanded");
    expect(
      screen.getByRole("button", { name: /Tushlik uchun ovqat qo'shish/i }),
    ).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /Nonushta tafsilotlari/i }));

    expect(screen.getByTestId("nutrition-meal-details-drawer"))
      .toHaveTextContent("Tuxum");
    expect(
      within(screen.getByTestId("nutrition-meal-details-drawer")).getByRole(
        "button",
        { name: /Nonushta uchun ovqat qo'shish/i },
      ),
    ).toBeDisabled();
  });
});
