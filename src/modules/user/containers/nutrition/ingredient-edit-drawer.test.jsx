import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import IngredientEditDrawer from "./ingredient-edit-drawer.jsx";

vi.mock("@/components/ui/drawer.jsx", async () => {
  const ReactModule = await import("react");

  const MockSlot = (slot) => ({ children, className, ...props }) =>
    ReactModule.createElement(
      "div",
      { ...props, className, "data-slot": slot },
      children,
    );

  return {
    Drawer: ({ open, children }) =>
      open ? ReactModule.createElement("div", { "data-slot": "drawer" }, children) : null,
    DrawerBody: MockSlot("drawer-body"),
    DrawerDescription: MockSlot("drawer-description"),
    DrawerFooter: MockSlot("drawer-footer"),
    DrawerHeader: MockSlot("drawer-header"),
    DrawerTitle: MockSlot("drawer-title"),
  };
});

vi.mock("./nutrition-drawer-layout.jsx", async () => {
  const ReactModule = await import("react");

  return {
    NutritionDrawerContent: ({ children }) =>
      ReactModule.createElement("div", { "data-testid": "nutrition-drawer-content" }, children),
  };
});

vi.mock("@/components/ui/slider.jsx", async () => {
  const ReactModule = await import("react");

  return {
    Slider: ({ value, min, max, step, onValueChange, className, ...props }) =>
      ReactModule.createElement("input", {
        "data-testid": "ingredient-grams-slider",
        type: "range",
        value: value?.[0] ?? min,
        min,
        max,
        step,
        className,
        onChange: (event) => onValueChange?.([Number(event.target.value)]),
        ...props,
      }),
  };
});

vi.mock("@/components/reui/number-field", async () => {
  const ReactModule = await import("react");
  const FieldContext = ReactModule.createContext(null);

  return {
    NumberField: ({ value, onValueChange, children }) =>
      ReactModule.createElement(
        FieldContext.Provider,
        { value: { value, onValueChange } },
        children,
      ),
    NumberFieldGroup: ({ children, className }) =>
      ReactModule.createElement("div", { className }, children),
    NumberFieldDecrement: ({ className }) =>
      ReactModule.createElement("button", { type: "button", className }, "-"),
    NumberFieldIncrement: ({ className }) =>
      ReactModule.createElement("button", { type: "button", className }, "+"),
    NumberFieldInput: ({ className }) => {
      const context = ReactModule.useContext(FieldContext);
      return ReactModule.createElement("input", {
        type: "number",
        className,
        value: context?.value ?? "",
        onChange: (event) => context?.onValueChange?.(Number(event.target.value)),
      });
    },
  };
});

vi.mock("@/hooks/app/use-food-catalog", () => ({
  useFoodScan: () => ({
    analyzeIngredient: vi.fn(),
    isAnalyzingIngredient: false,
  }),
}));

vi.mock("@/hooks/app/use-ai-access", () => ({
  getAiAccessStatus: () => ({ isDisabled: false }),
  isAiAccessLimitError: () => false,
  useAiAccessStatus: () => ({
    access: {
      status: "trial_active",
      dailyLimit: 3,
      remainingToday: 2,
    },
  }),
}));

vi.mock("@/components/ai-access", async () => {
  const ReactModule = await import("react");

  return {
    AiAccessStatusText: () =>
      ReactModule.createElement("p", { "data-testid": "ai-access-status" }, "Bugun 2/3 qoldi"),
  };
});

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe("IngredientEditDrawer", () => {
  const ingredient = {
    id: "rice",
    name: "Guruch",
    grams: 100,
    baseGrams: 100,
    estimatedGrams: 100,
    nutrition: {
      calories: 130,
      protein: 2.7,
      carbs: 28,
      fat: 0.3,
      fiber: 0.4,
    },
  };

  it("locks ingredient identity in edit mode and uses the unified visual portion editor", () => {
    const onSave = vi.fn();

    render(
      <IngredientEditDrawer
        open
        mode="edit"
        ingredient={ingredient}
        goals={{ protein: 140, carbs: 424, fat: 84 }}
        onOpenChange={vi.fn()}
        onSave={onSave}
      />,
    );

    expect(screen.getByText("Guruch")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Masalan: guruch, tuxum, avokado")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "AI bilan aniqlash" })).not.toBeInTheDocument();
    expect(screen.queryByTestId("ai-access-status")).not.toBeInTheDocument();
    expect(screen.queryAllByRole("spinbutton")).toHaveLength(0);

    const nutritionCard = screen.getByTestId("ingredient-edit-nutrition-control-card");
    expect(nutritionCard).toHaveClass("rounded-2xl", "border", "p-3", "pb-4");
    expect(within(nutritionCard).getByTestId("ingredient-edit-chart-card")).toHaveTextContent("130");
    expect(within(nutritionCard).getByTestId("ingredient-edit-macro-carbs")).toHaveTextContent("28");
    expect(within(nutritionCard).getByTestId("ingredient-edit-macro-carbs")).toHaveTextContent("/ 424g");
    expect(within(nutritionCard).getByTestId("ingredient-edit-macro-protein")).toHaveTextContent("2.7");
    expect(within(nutritionCard).getByTestId("ingredient-edit-macro-fat")).toHaveTextContent("0.3");

    const sliderSection = within(nutritionCard).getByTestId("ingredient-edit-portion-slider-section");
    expect(within(sliderSection).getByText("Miqdori")).toBeInTheDocument();
    expect(within(sliderSection).getByText("Porsiya og'irligini tanlang")).toBeInTheDocument();
    expect(within(sliderSection).getAllByText("100g")).toHaveLength(1);
    expect(within(sliderSection).getByText("0g")).toBeInTheDocument();
    expect(within(sliderSection).getByText("250g")).toBeInTheDocument();
    expect(within(sliderSection).getByText("500g")).toBeInTheDocument();
    expect(within(sliderSection).getByText("750g")).toBeInTheDocument();
    expect(within(sliderSection).getByText("1,000g")).toBeInTheDocument();
    expect(screen.getByTestId("ingredient-grams-slider")).toHaveAttribute("min", "0");
    expect(screen.getByTestId("ingredient-grams-slider")).toHaveAttribute("max", "1000");
    expect(screen.getByTestId("ingredient-grams-slider")).toHaveAttribute("data-vaul-no-drag", "");

    fireEvent.change(screen.getByTestId("ingredient-grams-slider"), {
      target: { value: "140" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Saqlash" }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "rice",
        name: "Guruch",
        grams: 140,
        nutrition: expect.objectContaining({
          calories: 182,
          protein: 3.8,
          carbs: 39.2,
          fat: 0.4,
        }),
      }),
    );
  });

  it("keeps name input and AI analyze available in add mode", () => {
    render(
      <IngredientEditDrawer
        open
        mode="add"
        ingredient={null}
        onOpenChange={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByPlaceholderText("Masalan: guruch, tuxum, avokado")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "AI bilan aniqlash" })).toBeInTheDocument();
    expect(screen.getByTestId("ai-access-status")).toBeInTheDocument();
  });
});
