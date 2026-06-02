import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SmartAddSheet from "./smart-add-sheet.jsx";
import {
  buildCatalogQuickAddPayload,
  buildNutritionQuickAdds,
  buildSavedMealQuickAddPayload,
} from "./nutrition-quick-adds.js";

import map from "lodash/map";

vi.mock("@/components/ui/drawer.jsx", async () => {
  const ReactModule = await import("react");

  const MockSlot = (slot) => ({ children, className, ...props }) =>
    ReactModule.createElement(
      "div",
      { ...props, className, "data-slot": slot },
      children,
    );

  return {
    DrawerBody: MockSlot("drawer-body"),
    DrawerDescription: MockSlot("drawer-description"),
    DrawerHeader: MockSlot("drawer-header"),
    DrawerTitle: MockSlot("drawer-title"),
  };
});

const savedMeals = [
  {
    id: "saved-1",
    name: "Chicken bowl",
    calories: 420,
    protein: 35,
    carbs: 48,
    fat: 10,
    fiber: 4,
    grams: 320,
    imageUrl: "https://cdn.example.com/chicken.jpg",
    ingredients: [{ id: "rice", name: "Rice", grams: 150 }],
  },
  {
    id: "saved-2",
    name: "Tvorog",
    calories: 180,
    protein: 24,
    carbs: 8,
    fat: 5,
    grams: 200,
    ingredients: [],
  },
];

const recentFoods = [
  {
    id: 11,
    catalogFoodId: 11,
    name: "Chicken bowl",
    barcode: "111",
    cal: 410,
    protein: 34,
    carbs: 47,
    fat: 9,
    defaultAmount: 300,
    unit: "g",
  },
  {
    id: 12,
    catalogFoodId: 12,
    name: "Greek yogurt",
    barcode: "222",
    cal: 95,
    protein: 12,
    carbs: 6,
    fat: 2,
    defaultAmount: 150,
    unit: "g",
  },
];

describe("nutrition quick add helpers", () => {
  it("prioritizes saved meals and de-duplicates recent catalog foods", () => {
    const quickAdds = buildNutritionQuickAdds({
      savedMeals,
      recentFoods,
      limit: 6,
    });

    expect(map(quickAdds, (item) => item.id)).toEqual([
      "saved:saved-1",
      "saved:saved-2",
      "catalog:12",
    ]);
    expect(quickAdds[0]).toMatchObject({
      type: "saved",
      title: "Chicken bowl",
      calories: 420,
      grams: 320,
    });
    expect(quickAdds[2]).toMatchObject({
      type: "catalog",
      title: "Greek yogurt",
      calories: 95,
      grams: 150,
    });
  });

  it("builds logging payloads for saved and catalog quick adds", () => {
    expect(buildSavedMealQuickAddPayload(savedMeals[0])).toMatchObject({
      name: "Chicken bowl",
      source: "saved-meal",
      savedMealId: "saved-1",
      cal: 420,
      protein: 35,
      image: "https://cdn.example.com/chicken.jpg",
      ingredients: savedMeals[0].ingredients,
    });

    expect(buildCatalogQuickAddPayload(recentFoods[1])).toMatchObject({
      name: "Greek yogurt",
      source: "manual",
      qty: 1,
      grams: 150,
      cal: 95,
      protein: 12,
      addedFromPlan: false,
    });
  });
});

describe("SmartAddSheet", () => {
  const renderSheet = (props = {}) => {
    const handlers = {
      onOpenAudio: vi.fn(),
      onOpenCamera: vi.fn(),
      onOpenCatalog: vi.fn(),
      onOpenSavedMeals: vi.fn(),
      onOpenText: vi.fn(),
    };

    render(
      <SmartAddSheet
        disabled={false}
        mealLabel="Nonushta"
        {...handlers}
        {...props}
      />,
    );

    return { handlers };
  };

  it("renders compact meal context and method shortcuts", () => {
    renderSheet();

    expect(
      screen
        .getByText("Nonushtaga ovqat qo'shish")
        .closest('[data-slot="drawer-title"]'),
    ).toBeInTheDocument();
    expect(
      screen
        .getByText("Ovqat qo'shish usulini tanlang")
        .closest('[data-slot="drawer-description"]'),
    ).toBeInTheDocument();
    expect(screen.queryByText("Nonushta")).not.toBeInTheDocument();
    expect(screen.queryByText("Bugun, 08:30")).not.toBeInTheDocument();
    expect(screen.queryByText("Yangi ovqat")).not.toBeInTheDocument();
    expect(screen.queryByText("Kerakli qo'shish usulini tanlang")).not.toBeInTheDocument();
    expect(screen.queryByText("Tez qo'shish")).not.toBeInTheDocument();
    expect(screen.queryByText("Hali saqlangan taom yo'q")).not.toBeInTheDocument();
    expect(screen.queryByText("Chicken bowl")).not.toBeInTheDocument();
    expect(screen.queryByText("Tvorog")).not.toBeInTheDocument();
    expect(screen.queryByText("Greek yogurt")).not.toBeInTheDocument();
    expect(screen.queryByText("Recent")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Kamera" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Matn" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Audio" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Katalog" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Saqlangan taomlar" }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("quick-add-list")).not.toBeInTheDocument();
    expect(screen.getByTestId("method-action-list")).toHaveClass("space-y-2");
    expect(screen.getByTestId("method-action-list").children).toHaveLength(4);
  });

  it("keeps add actions disabled when logging is unavailable", () => {
    const { handlers } = renderSheet({ disabled: true });

    fireEvent.click(screen.getByRole("button", { name: "Kamera" }));
    fireEvent.click(screen.getByRole("button", { name: "Saqlangan taomlar" }));

    expect(handlers.onOpenCamera).not.toHaveBeenCalled();
    expect(handlers.onOpenSavedMeals).not.toHaveBeenCalled();
  });

  it("keeps camera openable when daily AI quota is exhausted", () => {
    const { handlers } = renderSheet({
      aiAccessWallet: { status: "trial_active", dailyLimit: 3, remainingToday: 0 },
      aiAccessCosts: {},
    });

    fireEvent.click(screen.getByRole("button", { name: "Kamera" }));

    expect(handlers.onOpenCamera).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/AI credit/i)).not.toBeInTheDocument();
  });

  it("disables text and audio AI entries when daily quota is exhausted", () => {
    const { handlers } = renderSheet({
      aiAccessWallet: { status: "trial_active", dailyLimit: 3, remainingToday: 0 },
      aiAccessCosts: {},
    });

    fireEvent.click(screen.getByRole("button", { name: "Matn" }));
    fireEvent.click(screen.getByRole("button", { name: "Audio" }));

    expect(handlers.onOpenText).not.toHaveBeenCalled();
    expect(handlers.onOpenAudio).not.toHaveBeenCalled();
  });

  it("opens saved meals from the bottom row button", () => {
    const onOpenSavedMeals = vi.fn();
    renderSheet({ onOpenSavedMeals });

    expect(screen.queryByText("Hali saqlangan taom yo'q")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Saqlangan taomlar" }));
    expect(onOpenSavedMeals).toHaveBeenCalledTimes(1);
  });
});
