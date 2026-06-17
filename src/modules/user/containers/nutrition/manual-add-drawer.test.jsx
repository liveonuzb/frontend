import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ManualAddDrawer from "./manual-add-drawer.jsx";

const mocks = vi.hoisted(() => ({
  addMeal: vi.fn(),
  toggleFavoriteFood: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

const catalogFood = {
  id: "food-1",
  catalogFoodId: 42,
  name: "Tovuqli salat",
  originalName: "Chicken salad",
  barcode: "food:42",
  emoji: "🥗",
  cal: 160,
  protein: 22,
  carbs: 8,
  fat: 5,
  fiber: 3,
  serving: "100 g",
  defaultAmount: 100,
  step: 10,
  ingredients: [{ id: "chicken", name: "Tovuq", grams: 120 }],
};

vi.mock("@/components/ui/drawer", async () => {
  const ReactModule = await import("react");
  const MockSlot = (slot) => ({ children, className, ...props }) =>
    ReactModule.createElement(
      "div",
      { ...props, className, "data-slot": slot },
      children,
    );

  return {
    Drawer: ({ children, open }) => (open ? <div>{children}</div> : null),
    DrawerBody: MockSlot("drawer-body"),
    DrawerContent: MockSlot("drawer-content"),
    DrawerDescription: MockSlot("drawer-description"),
    DrawerFooter: MockSlot("drawer-footer"),
    DrawerHeader: MockSlot("drawer-header"),
    DrawerTitle: MockSlot("drawer-title"),
  };
});

vi.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children, className }) => (
    <div className={className}>{children}</div>
  ),
}));

vi.mock("framer-motion", async () => {
  const ReactModule = await import("react");

  return {
    AnimatePresence: ({ children }) => <>{children}</>,
    motion: {
      div: ReactModule.forwardRef(({ children, ...props }, ref) => (
        <div ref={ref} {...props}>
          {children}
        </div>
      )),
    },
  };
});

vi.mock("@/hooks/app/use-daily-tracking", () => ({
  useDailyTrackingActions: () => ({
    addMeal: mocks.addMeal,
  }),
  useDailyTrackingDay: () => ({
    dayData: { meals: { lunch: [] } },
  }),
}));

vi.mock("@/hooks/app/use-health-goals", () => ({
  default: () => ({
    goals: { calories: 2000 },
  }),
}));

vi.mock("@/hooks/app/use-food-catalog", () => ({
  default: () => ({
    categories: [{ id: 1, label: "Salatlar" }],
    favorites: [],
    recentFoods: [],
    favoriteIdSet: new Set(),
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useFoodQuickAddActions: () => ({
    toggleFavoriteFood: mocks.toggleFavoriteFood,
    isUpdatingFavorite: false,
  }),
  useFoodsByCategory: () => ({
    foods: [catalogFood],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: (...args) => mocks.toastError(...args),
    success: (...args) => mocks.toastSuccess(...args),
  },
}));

vi.mock("./food-detail-portion-drawer.jsx", () => ({
  default: ({ item, onSave }) => (
    <div>
      <p>{item?.name} portion drawer</p>
      <button
        type="button"
        onClick={() =>
          onSave({
            item,
            grams: 150,
            macros: {
              cal: 240,
              protein: 33,
              carbs: 12,
              fat: 8,
              fiber: 5,
            },
            ingredients: item.ingredients,
          })
        }
      >
        Portion saqlash
      </button>
    </div>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.addMeal.mockResolvedValue({});
});

describe("ManualAddDrawer", () => {
  it("logs a catalog food through the portion drawer with manual source", async () => {
    const onClose = vi.fn();

    render(
      <ManualAddDrawer
        dateKey="2026-06-09"
        mealType="lunch"
        loggedAt="2026-06-09T12:30:00.000Z"
        onClose={onClose}
      />,
    );

    expect(screen.getByText("Tushlikga qo'shish")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Tovuqli salat"));
    expect(screen.getByText("Tovuqli salat portion drawer")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Portion saqlash" }));

    await waitFor(() => {
      expect(mocks.addMeal).toHaveBeenCalledWith(
        "2026-06-09",
        "lunch",
        expect.objectContaining({
          name: "Tovuqli salat",
          source: "manual",
          qty: 1,
          grams: 150,
          cal: 240,
          protein: 33,
          carbs: 12,
          fat: 8,
          fiber: 5,
          ingredients: [{ id: "chicken", name: "Tovuq", grams: 120 }],
          addedAt: "2026-06-09T12:30:00.000Z",
          addedFromPlan: false,
        }),
      );
    });
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Tovuqli salat qo'shildi!");
  });
});
