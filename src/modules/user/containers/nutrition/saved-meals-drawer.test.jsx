import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SavedMealsDrawer from "./saved-meals-drawer.jsx";

const mocks = vi.hoisted(() => ({
  deleteSavedMeal: vi.fn(),
  onAddMeal: vi.fn(),
  onAddMealsBatch: vi.fn(),
  updateSavedMeal: vi.fn(),
  createTemplate: vi.fn(),
  updateTemplate: vi.fn(),
  deleteTemplate: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

const savedMeals = [
  {
    id: "saved-1",
    name: "Tovuqli bowl",
    calories: 420,
    protein: 34,
    carbs: 44,
    fat: 12,
    fiber: 6,
    grams: 360,
    imageUrl: "/bowl.webp",
    ingredients: [{ id: "chicken", name: "Tovuq", grams: 120 }],
    lastUsedAt: "2026-06-02T10:00:00.000Z",
  },
  {
    id: "saved-2",
    name: "Tuxumli nonushta",
    calories: 310,
    protein: 21,
    carbs: 24,
    fat: 14,
    fiber: 3,
    grams: 250,
    imageUrl: null,
    ingredients: [{ id: "egg", name: "Tuxum", grams: 100 }],
    lastUsedAt: "2026-06-01T08:00:00.000Z",
  },
];

vi.mock("@/components/ui/drawer.jsx", async () => {
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
    DrawerHeader: MockSlot("drawer-header"),
    DrawerTitle: MockSlot("drawer-title"),
  };
});

vi.mock("@/components/ui/scroll-area.jsx", () => ({
  ScrollArea: ({ children, className }) => (
    <div className={className}>{children}</div>
  ),
}));

vi.mock("@/hooks/app/use-saved-meals", () => ({
  useSavedMeals: () => ({
    items: savedMeals,
    isLoading: false,
  }),
  useSavedMealsActions: () => ({
    updateSavedMeal: mocks.updateSavedMeal,
    deleteSavedMeal: mocks.deleteSavedMeal,
    isSaving: false,
  }),
}));

vi.mock("@/hooks/app/use-saved-meal-templates", () => ({
  useSavedMealTemplates: () => ({
    templates: [
      {
        id: "template-1",
        name: "Ish kuni nonushtasi",
        mealIds: ["saved-1", "saved-2"],
      },
    ],
    createTemplate: mocks.createTemplate,
    updateTemplate: mocks.updateTemplate,
    deleteTemplate: mocks.deleteTemplate,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: (...args) => mocks.toastError(...args),
    success: (...args) => mocks.toastSuccess(...args),
  },
}));

vi.mock("./meal-ingredients-editor-drawer.jsx", () => ({
  default: ({ open, title }) => (open ? <div>{title} editor</div> : null),
}));

const renderDrawer = (props = {}) =>
  render(
    <SavedMealsDrawer
      open
      onOpenChange={vi.fn()}
      dateKey="2026-06-09"
      mealType="breakfast"
      onAddMeal={mocks.onAddMeal}
      onAddMealsBatch={mocks.onAddMealsBatch}
      {...props}
    />,
  );

beforeEach(() => {
  vi.clearAllMocks();
  mocks.onAddMeal.mockResolvedValue({});
  mocks.onAddMealsBatch.mockResolvedValue({});
  mocks.deleteSavedMeal.mockResolvedValue({});
  mocks.updateSavedMeal.mockResolvedValue({});
});

describe("SavedMealsDrawer", () => {
  it("logs a saved meal with snapshot nutrition and ingredients", async () => {
    renderDrawer();

    expect(screen.getByText("Tovuqli bowl")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Tezkor log" })[0]);

    await waitFor(() => {
      expect(mocks.onAddMeal).toHaveBeenCalledWith(
        "2026-06-09",
        "breakfast",
        expect.objectContaining({
          name: "Tovuqli bowl",
          source: "saved-meal",
          savedMealId: "saved-1",
          cal: 420,
          protein: 34,
          carbs: 44,
          fat: 12,
          fiber: 6,
          grams: 360,
          image: "/bowl.webp",
          ingredients: [{ id: "chicken", name: "Tovuq", grams: 120 }],
        }),
      );
    });
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Tovuqli bowl qo'shildi");
  });

  it("applies a saved meal template through batch meal logging", async () => {
    renderDrawer();

    fireEvent.click(screen.getByRole("button", { name: "Shablonlar" }));
    expect(screen.getByText("Ish kuni nonushtasi")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Shablonni log qilish" }),
    );

    await waitFor(() => {
      expect(mocks.onAddMealsBatch).toHaveBeenCalledWith("2026-06-09", [
        {
          mealType: "breakfast",
          food: expect.objectContaining({
            name: "Tovuqli bowl",
            source: "saved-meal",
            savedMealId: "saved-1",
          }),
        },
        {
          mealType: "breakfast",
          food: expect.objectContaining({
            name: "Tuxumli nonushta",
            source: "saved-meal",
            savedMealId: "saved-2",
          }),
        },
      ]);
    });
    expect(mocks.toastSuccess).toHaveBeenCalledWith(
      "Ish kuni nonushtasi qo'shildi",
    );
  });
});
