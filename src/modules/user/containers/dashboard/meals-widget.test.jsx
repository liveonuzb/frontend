import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MealsWidget from "./meals-widget.jsx";
import { useGetQuery } from "@/hooks/api";

const mocks = vi.hoisted(() => {
  const toast = vi.fn();
  toast.success = vi.fn();
  toast.error = vi.fn();

  return {
    addMeal: vi.fn(),
    patchMeal: vi.fn(),
    removeMeal: vi.fn(),
    uploadMealCapture: vi.fn(),
    openActionDrawer: vi.fn(),
    toast,
  };
});

vi.mock("@/hooks/api", () => ({
  useGetQuery: vi.fn(),
}));

vi.mock("@/hooks/app/use-daily-tracking", () => ({
  useDailyTrackingActions: () => ({
    addMeal: mocks.addMeal,
    patchMeal: mocks.patchMeal,
    removeMeal: mocks.removeMeal,
  }),
}));

vi.mock("@/hooks/app/use-food-catalog", () => ({
  useFoodScan: () => ({
    uploadMealCapture: mocks.uploadMealCapture,
    isUploadingCapture: false,
  }),
}));

vi.mock("@/hooks/app/use-saved-meals", () => ({
  useSavedMeals: () => ({
    items: [],
  }),
}));

vi.mock("@/hooks/app/use-saved-meal-templates", () => ({
  buildLoggedMealFromSavedMealTemplate: vi.fn(),
  getWeekdayNameFromDate: () => "Payshanba",
  useSavedMealTemplates: () => ({
    templates: [],
    recurringPatterns: [],
  }),
}));

vi.mock("@/store", () => ({
  useAddMealOverlayStore: (selector) =>
    selector({
      openActionDrawer: mocks.openActionDrawer,
    }),
}));

vi.mock("@/components/ui/drawer.jsx", () => ({
  Drawer: ({ open, children }) =>
    open ? <div data-testid="mock-drawer-root">{children}</div> : null,
  DrawerContent: ({ children, ...props }) => (
    <section {...props}>{children}</section>
  ),
  DrawerHeader: ({ children, ...props }) => (
    <header {...props}>{children}</header>
  ),
  DrawerBody: ({ children, ...props }) => <div {...props}>{children}</div>,
  DrawerFooter: ({ children, ...props }) => (
    <footer {...props}>{children}</footer>
  ),
  DrawerTitle: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
  DrawerDescription: ({ children, ...props }) => <p {...props}>{children}</p>,
}));

vi.mock("@/modules/user/containers/nutrition/meal-transfer-drawer.jsx", () => ({
  default: ({ open, food }) =>
    open ? <div data-testid="meal-transfer-drawer">{food?.name}</div> : null,
}));

vi.mock(
  "@/modules/user/containers/nutrition/food-detail-portion-drawer.jsx",
  () => ({
    default: ({ item, onSave, saveLabel = "Saqlash" }) => (
      <div data-testid="dashboard-portion-edit">
        <p>{item?.name}</p>
        <button
          type="button"
          onClick={() =>
            onSave?.({
              grams: 150,
              macros: {
                cal: 155,
                protein: 12,
                carbs: 3,
                fat: 8,
                fiber: 1,
              },
              ingredients: [{ id: "ingredient-1", name: "Tuxum", grams: 150 }],
            })
          }
        >
          {saveLabel}
        </button>
      </div>
    ),
  }),
);

vi.mock("sonner", () => ({
  toast: mocks.toast,
}));

const dayData = {
  date: "2026-05-14",
  meals: {
    breakfast: [
      {
        id: "breakfast-1",
        name: "Tuxum",
        cal: 120,
        qty: 2,
        protein: 14,
        carbs: 2,
        fat: 10,
        grams: 100,
        image: "https://cdn.example.com/tuxum.webp",
        addedAt: "2026-05-14T08:00:00.000Z",
        ingredients: [
          {
            id: "ingredient-egg-white",
            name: "Tuxum oqi",
            grams: 60,
            calories: 70,
            image: "https://cdn.example.com/egg-white.webp",
          },
          {
            id: "ingredient-spinach",
            name: "Ismaloq",
            grams: 40,
            calories: 10,
            imageUrl: "https://cdn.example.com/spinach.webp",
          },
        ],
      },
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

const activeMealPlan = {
  status: "active",
  startDate: "2026-05-14T00:00:00.000Z",
  durationDays: 30,
  days: [
    {
      dayNumber: 1,
      meals: [
        {
          type: "Nonushta",
          items: [
            { id: "planned-tuxum", name: "Tuxum", cal: 120, grams: 100 },
            {
              id: "planned-oats",
              name: "Rejadagi suli",
              cal: 260,
              protein: 10,
              carbs: 40,
              fat: 6,
              grams: 120,
              image: "https://cdn.example.com/oats.webp",
            },
          ],
        },
      ],
    },
  ],
};

const renderWidget = (props = {}) =>
  render(
    <MemoryRouter>
      <MealsWidget
        dateKey="2026-05-14"
        selectedDate={new Date("2026-05-14T12:00:00")}
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

  it("renders meals as recommendation rows with progress around the meal image", () => {
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
    ).toHaveClass("rounded-full");
    expect(
      screen.getByTestId("dashboard-meal-card-content-breakfast"),
    ).toHaveClass("px-3", "py-2.5");
    expect(
      screen.getByTestId("dashboard-meal-card-content-breakfast"),
    ).not.toHaveClass("p-3.5");
    expect(screen.queryByText("320 / 600 kcal")).not.toBeInTheDocument();
    expect(screen.queryByText("53%")).not.toBeInTheDocument();
    const progressRing = screen.getByTestId(
      "dashboard-meal-progress-ring-breakfast",
    );
    const progressbar = within(progressRing).getByRole("progressbar", {
      name: "Nonushta kaloriya progress",
    });

    expect(progressbar.tagName.toLowerCase()).toBe("svg");
    expect(progressbar).toHaveAttribute("aria-valuenow", "53");
  });

  it("opens a bottom drawer with logged and planned meals from the selected row", () => {
    renderWidget({ activeMealPlan });

    const breakfastToggle = screen.getByRole("button", {
      name: /^Nonushta\s+320 kcal$/i,
    });

    expect(screen.queryByText("Tuxum")).not.toBeInTheDocument();
    expect(screen.queryByText("Salat")).not.toBeInTheDocument();

    fireEvent.click(breakfastToggle);

    expect(
      screen.getByTestId("dashboard-meal-details-drawer"),
    ).toHaveTextContent("Nonushta");
    expect(screen.getByText("Tuxum")).toBeInTheDocument();
    expect(screen.getByText("Non")).toBeInTheDocument();
    expect(screen.getByText("Rejadagi suli")).toBeInTheDocument();
    expect(screen.getByText("Rejada")).toBeInTheDocument();
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
    expect(
      screen.queryByTestId("dashboard-meal-details-drawer"),
    ).not.toBeInTheDocument();
  });

  it("keeps an add button in the drawer footer", () => {
    const onAddMeal = vi.fn();

    renderWidget({ onAddMeal });

    fireEvent.click(
      screen.getByRole("button", {
        name: /^Nonushta\s+320 kcal$/i,
      }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Nonushta uchun ovqat qo'shish" }),
    );

    expect(onAddMeal).toHaveBeenCalledWith("breakfast");
  });

  it("renders compact rows with image and only delete/check row actions", () => {
    renderWidget({ activeMealPlan });

    fireEvent.click(
      screen.getByRole("button", {
        name: /^Nonushta\s+320 kcal$/i,
      }),
    );

    expect(screen.getByAltText("Tuxum")).toHaveAttribute(
      "src",
      "https://cdn.example.com/tuxum.webp",
    );
    expect(screen.getByAltText("Rejadagi suli")).toHaveAttribute(
      "src",
      "https://cdn.example.com/oats.webp",
    );
    expect(
      screen.getByRole("button", { name: "Rejadagi suli log qilish" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Tuxum log qilingan" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Non o'chirish" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /tahrirlash/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /nusxa olish/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /ko'chirish/i }),
    ).not.toBeInTheDocument();
  });

  it("supports logged meal delete with undo and planned meal logging from row actions", async () => {
    renderWidget({ activeMealPlan });

    fireEvent.click(
      screen.getByRole("button", {
        name: /^Nonushta\s+320 kcal$/i,
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Non o'chirish" }));

    expect(mocks.removeMeal).toHaveBeenCalledWith(
      "2026-05-14",
      "breakfast",
      "breakfast-2",
    );
    await waitFor(() =>
      expect(mocks.toast).toHaveBeenCalledWith(
        "Ovqat o'chirildi",
        expect.objectContaining({
          action: expect.objectContaining({ label: "Qaytarish" }),
        }),
      ),
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Rejadagi suli log qilish" }),
    );

    await waitFor(() =>
      expect(mocks.addMeal).toHaveBeenCalledWith(
        "2026-05-14",
        "breakfast",
        expect.objectContaining({
          name: "Rejadagi suli",
          addedFromPlan: true,
          source: "meal-plan",
        }),
      ),
    );
  });

  it("opens nested meal detail and edits logged food through the portion drawer", async () => {
    renderWidget({ activeMealPlan });

    fireEvent.click(
      screen.getByRole("button", {
        name: /^Nonushta\s+320 kcal$/i,
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Tuxum ma'lumotlari" }));

    const detailDrawer = screen.getByTestId("dashboard-meal-food-detail-drawer");
    const imageCard = within(detailDrawer).getByTestId(
      "dashboard-meal-detail-image-card",
    );
    const summaryGrid = within(detailDrawer).getByTestId(
      "dashboard-meal-detail-summary-grid",
    );
    const macroRow = within(detailDrawer).getByTestId(
      "dashboard-meal-detail-macro-row",
    );
    const ingredientsList = within(detailDrawer).getByTestId(
      "dashboard-meal-detail-ingredients-list",
    );

    expect(detailDrawer).toHaveTextContent("Tuxum");
    expect(within(imageCard).getByAltText("Tuxum")).toHaveAttribute(
      "src",
      "https://cdn.example.com/tuxum.webp",
    );
    expect(imageCard).not.toHaveClass("border");
    expect(imageCard).not.toHaveTextContent("Log qilindi");
    expect(imageCard).not.toHaveTextContent("P 14g");
    expect(summaryGrid.children).toHaveLength(2);
    expect(within(summaryGrid).getByText("240 kcal")).toBeInTheDocument();
    expect(within(summaryGrid).getByText("100g")).toBeInTheDocument();
    const calorieCard = within(summaryGrid)
      .getByText("Kaloriya")
      .closest("[data-slot=card]");
    const amountCard = within(summaryGrid)
      .getByText("Miqdor")
      .closest("[data-slot=card]");
    expect(
      calorieCard,
    ).toBeInTheDocument();
    expect(amountCard).toBeInTheDocument();
    expect(calorieCard).toHaveClass("!ring-0");
    expect(amountCard).toHaveClass("!ring-0");
    expect(macroRow.children).toHaveLength(3);
    expect(within(macroRow).getByText("Uglevod")).toBeInTheDocument();
    expect(within(macroRow).getByText("Oqsil")).toBeInTheDocument();
    expect(within(macroRow).getByText("Yog'")).toBeInTheDocument();
    const carbsCard = within(macroRow)
      .getByText("Uglevod")
      .closest("[data-slot=card]");
    const proteinCard = within(macroRow)
      .getByText("Oqsil")
      .closest("[data-slot=card]");
    const fatCard = within(macroRow)
      .getByText("Yog'")
      .closest("[data-slot=card]");
    expect(carbsCard).toHaveAttribute("data-size", "sm");
    expect(proteinCard).toHaveAttribute("data-size", "sm");
    expect(fatCard).toHaveAttribute("data-size", "sm");
    expect(carbsCard).toHaveClass("!ring-0");
    expect(proteinCard).toHaveClass("!ring-0");
    expect(fatCard).toHaveClass("!ring-0");
    expect(macroRow).toHaveTextContent("2/ 0g");
    expect(macroRow).toHaveTextContent("14/ 0g");
    expect(macroRow).toHaveTextContent("10/ 0g");
    expect(ingredientsList.closest("[data-slot=card]")).toBeNull();
    const eggWhiteCard = within(ingredientsList)
      .getByText("Tuxum oqi")
      .closest("[data-slot=card]");
    const spinachCard = within(ingredientsList)
      .getByText("Ismaloq")
      .closest("[data-slot=card]");
    expect(eggWhiteCard).toHaveClass("!ring-0");
    expect(spinachCard).toHaveClass("!ring-0");
    expect(within(eggWhiteCard).getByAltText("Tuxum oqi")).toHaveAttribute(
      "src",
      "https://cdn.example.com/egg-white.webp",
    );
    expect(within(spinachCard).getByAltText("Ismaloq")).toHaveAttribute(
      "src",
      "https://cdn.example.com/spinach.webp",
    );

    fireEvent.click(screen.getByRole("button", { name: "Tahrirlash" }));

    expect(screen.getByTestId("dashboard-portion-edit")).toHaveTextContent(
      "Tuxum",
    );

    fireEvent.click(screen.getByRole("button", { name: "Saqlash" }));

    await waitFor(() =>
      expect(mocks.patchMeal).toHaveBeenCalledWith(
        "2026-05-14",
        "breakfast",
        "breakfast-1",
        expect.objectContaining({
          grams: 150,
          cal: 155,
          protein: 12,
          carbs: 3,
          fat: 8,
          fiber: 1,
          ingredients: [{ id: "ingredient-1", name: "Tuxum", grams: 150 }],
        }),
      ),
    );
  });

  it("uploads an optional image for a logged meal from the detail drawer", async () => {
    mocks.uploadMealCapture.mockResolvedValue("https://cdn.example.com/non.jpg");
    mocks.patchMeal.mockResolvedValue({});

    renderWidget({ activeMealPlan });

    fireEvent.click(
      screen.getByRole("button", {
        name: /^Nonushta\s+320 kcal$/i,
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Non ma'lumotlari" }));

    const detailDrawer = screen.getByTestId("dashboard-meal-food-detail-drawer");

    expect(
      within(detailDrawer).getByRole("button", { name: "Non uchun rasm qo'shish" }),
    ).toBeInTheDocument();

    const imageFile = new File(["meal"], "non.jpg", { type: "image/jpeg" });

    fireEvent.change(
      within(detailDrawer).getByLabelText("Non uchun rasm tanlash"),
      {
        target: { files: [imageFile] },
      },
    );

    await waitFor(() =>
      expect(mocks.uploadMealCapture).toHaveBeenCalledWith(imageFile),
    );
    await waitFor(() =>
      expect(mocks.patchMeal).toHaveBeenCalledWith(
        "2026-05-14",
        "breakfast",
        "breakfast-2",
        { image: "https://cdn.example.com/non.jpg" },
      ),
    );
    await waitFor(() =>
      expect(within(detailDrawer).getByAltText("Non")).toHaveAttribute(
        "src",
        "https://cdn.example.com/non.jpg",
      ),
    );
    expect(mocks.toast.success).toHaveBeenCalledWith("Ovqat rasmi qo'shildi");
  });

  it("opens planned meal detail with a log footer action instead of edit", async () => {
    renderWidget({ activeMealPlan });

    fireEvent.click(
      screen.getByRole("button", {
        name: /^Nonushta\s+320 kcal$/i,
      }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Rejadagi suli ma'lumotlari" }),
    );

    const detailDrawer = screen.getByTestId("dashboard-meal-food-detail-drawer");

    expect(detailDrawer).toHaveTextContent("Rejadagi suli");
    expect(
      screen.queryByRole("button", { name: "Tahrirlash" }),
    ).not.toBeInTheDocument();

    fireEvent.click(
      within(detailDrawer).getByRole("button", {
        name: "Rejadagi suli log qilish",
      }),
    );

    await waitFor(() =>
      expect(mocks.addMeal).toHaveBeenCalledWith(
        "2026-05-14",
        "breakfast",
        expect.objectContaining({
          name: "Rejadagi suli",
          addedFromPlan: true,
          source: "meal-plan",
        }),
      ),
    );
  });
});
