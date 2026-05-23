import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AddMealOverlay from "./add-meal-overlay.jsx";
import { useAddMealOverlayStore } from "@/store";

vi.mock("@/hooks/app/use-daily-tracking", () => ({
  useDailyTrackingActions: () => ({
    addMeal: vi.fn(),
    addMealsBatch: vi.fn(),
  }),
}));

vi.mock("@/hooks/utils/use-online-status.js", () => ({
  default: () => true,
}));

vi.mock("@/modules/user/containers/nutrition/action-drawer.jsx", () => ({
  default: ({ open, onCloseAll, onOpenSavedMeals }) =>
    open ? (
      <button
        type="button"
        onClick={() => {
          onOpenSavedMeals?.();
          onCloseAll?.();
        }}
      >
        Open saved meals
      </button>
    ) : null,
}));

vi.mock("@/modules/user/containers/nutrition/saved-meals-drawer.jsx", () => ({
  default: ({ dateKey, mealType, open }) =>
    open ? (
      <div data-testid="saved-meals-drawer">
        date:{dateKey} meal:{mealType}
      </div>
    ) : null,
}));

describe("AddMealOverlay", () => {
  beforeEach(() => {
    useAddMealOverlayStore.setState({
      isActionDrawerOpen: true,
      mealType: "breakfast",
      dateKey: "2026-05-23",
      initialNested: null,
      manualSearch: "",
      manualAnalyze: false,
      manualSource: "manual",
    });
  });

  it("opens saved meals drawer from the add drawer with current meal context", () => {
    render(<AddMealOverlay />);

    fireEvent.click(screen.getByRole("button", { name: "Open saved meals" }));

    expect(screen.getByTestId("saved-meals-drawer")).toHaveTextContent(
      "date:2026-05-23 meal:breakfast",
    );
    expect(useAddMealOverlayStore.getState().isActionDrawerOpen).toBe(false);
  });
});
