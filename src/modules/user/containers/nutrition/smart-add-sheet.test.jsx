import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SmartAddSheet from "./smart-add-sheet.jsx";
import {
  buildCatalogQuickAddPayload,
  buildNutritionQuickAdds,
  buildSavedMealQuickAddPayload,
} from "./nutrition-quick-adds.js";

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

    expect(quickAdds.map((item) => item.id)).toEqual([
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
    const quickItems = buildNutritionQuickAdds({
      savedMeals,
      recentFoods,
      limit: 6,
    });

    const handlers = {
      onQuickAdd: vi.fn(),
      onEditQuickAdd: vi.fn(),
      onOpenAudio: vi.fn(),
      onOpenCamera: vi.fn(),
      onOpenCatalog: vi.fn(),
      onOpenSavedMeals: vi.fn(),
      onOpenText: vi.fn(),
      onOpenTime: vi.fn(),
    };

    render(
      <SmartAddSheet
        disabled={false}
        formattedTime="Bugun, 08:30"
        mealLabel="Nonushta"
        quickItems={quickItems}
        {...handlers}
        {...props}
      />,
    );

    return { handlers, quickItems };
  };

  it("renders meal context, quick adds, and method shortcuts", () => {
    renderSheet();

    expect(screen.getByText("Nonushta")).toBeInTheDocument();
    expect(screen.getByText("Bugun, 08:30")).toBeInTheDocument();
    expect(screen.getByText("Tez qo'shish")).toBeInTheDocument();
    expect(screen.getByText("Chicken bowl")).toBeInTheDocument();
    expect(screen.getByText("Greek yogurt")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Kamera" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Matn" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Audio" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Katalog" })).toBeInTheDocument();
  });

  it("logs a quick item from its plus button and opens detail from card tap", () => {
    const { handlers, quickItems } = renderSheet();

    fireEvent.click(
      screen.getByRole("button", { name: "Chicken bowlni tez qo'shish" }),
    );
    expect(handlers.onQuickAdd).toHaveBeenCalledWith(quickItems[0]);

    fireEvent.click(screen.getByRole("button", { name: "Chicken bowlni ko'rish" }));
    expect(handlers.onEditQuickAdd).toHaveBeenCalledWith(quickItems[0]);
  });

  it("keeps add actions disabled when logging is unavailable", () => {
    const { handlers } = renderSheet({ disabled: true });

    fireEvent.click(
      screen.getByRole("button", { name: "Chicken bowlni tez qo'shish" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Kamera" }));

    expect(handlers.onQuickAdd).not.toHaveBeenCalled();
    expect(handlers.onOpenCamera).not.toHaveBeenCalled();
  });

  it("shows an empty quick-add fallback and opens saved meals", () => {
    const onOpenSavedMeals = vi.fn();
    renderSheet({ quickItems: [], onOpenSavedMeals });

    expect(screen.getByText("Hali tez qo'shish yo'q")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Barchasini ko'rish" }));
    expect(onOpenSavedMeals).toHaveBeenCalledTimes(1);
  });
});
