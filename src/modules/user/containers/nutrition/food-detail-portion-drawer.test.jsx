import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import FoodDetailPortionDrawer from "./food-detail-portion-drawer.jsx";

vi.mock("@/components/ui/drawer", async () => {
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
    DrawerFooter: MockSlot("drawer-footer"),
    DrawerHeader: MockSlot("drawer-header"),
    DrawerTitle: MockSlot("drawer-title"),
  };
});

vi.mock("@/components/ui/slider", async () => {
  const ReactModule = await import("react");

  return {
    Slider: ({ value, min, max, step, onValueChange, className, ...props }) =>
      ReactModule.createElement("input", {
        "data-testid": "portion-slider",
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

vi.mock("./ingredient-edit-drawer.jsx", async () => {
  const ReactModule = await import("react");

  return {
    default: ({ open, mode, ingredient, onSave }) =>
      open
        ? ReactModule.createElement(
            "div",
            {
              "data-testid": "ingredient-edit-drawer",
              "data-mode": mode,
              "data-ingredient-id": ingredient?.id || "",
            },
            ReactModule.createElement(
              "button",
              {
                type: "button",
                onClick: () =>
                  onSave?.({
                    id: mode === "add" ? "butter" : ingredient?.id,
                    name: mode === "add" ? "Sariyog'" : `${ingredient?.name} edited`,
                    grams: mode === "add" ? 20 : 120,
                    baseGrams: mode === "add" ? 20 : 120,
                    estimatedGrams: mode === "add" ? 20 : 120,
                    nutritionSource: "manual",
                    matchStatus: "manual",
                    reviewNeeded: false,
                    nutrition:
                      mode === "add"
                        ? {
                            calories: 145,
                            protein: 0.2,
                            carbs: 0.1,
                            fat: 16.4,
                            fiber: 0,
                          }
                        : {
                            calories: 210,
                            protein: 18,
                            carbs: 1,
                            fat: 14,
                            fiber: 0,
                          },
                  }),
              },
              mode === "add" ? "mock-add-ingredient" : "mock-save-ingredient",
            ),
          )
        : null,
  };
});

describe("FoodDetailPortionDrawer", () => {
  const baseItem = {
    id: "food-1",
    barcode: "food:1",
    name: "Moskva pelmenisi",
    image: "https://cdn.example.com/pelmeni.webp",
    serving: "272 g",
    category: "Russian dumplings",
    cal: 200,
    protein: 12,
    carbs: 22,
    fat: 7,
    defaultAmount: 100,
    unit: "g",
    step: 10,
  };

  const ingredientBreakdown = [
    {
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
    },
    {
      id: "beef",
      name: "Mol go'shti",
      grams: 50,
      baseGrams: 50,
      estimatedGrams: 50,
      nutrition: {
        calories: 125,
        protein: 13,
        carbs: 0,
        fat: 9,
        fiber: 0,
      },
    },
  ];

  it("renders chart, macro cards, fixed slider labels, ingredient section, and save payload", () => {
    const onSave = vi.fn();

    render(
      <FoodDetailPortionDrawer
        item={baseItem}
        type="food"
        grams={150}
        goals={{ protein: 140, carbs: 424, fat: 84 }}
        ingredients={ingredientBreakdown}
        onGramsChange={vi.fn()}
        onSave={onSave}
      />,
    );

    expect(screen.queryByRole("img", { name: "Moskva pelmenisi" })).not.toBeInTheDocument();
    expect(screen.queryByTestId("food-detail-image-fallback")).not.toBeInTheDocument();
    expect(screen.queryByText("Russian dumplings")).not.toBeInTheDocument();
    expect(screen.queryByText("272 g")).not.toBeInTheDocument();

    const nutritionCard = screen.getByTestId("food-detail-nutrition-control-card");
    expect(nutritionCard).toHaveClass("rounded-2xl", "border", "p-3", "pb-4");

    const chartCard = within(nutritionCard).getByTestId("food-detail-chart-card");
    expect(chartCard).toHaveClass("pb-4");
    expect(within(chartCard).getByText("255")).toBeInTheDocument();

    expect(within(nutritionCard).getByTestId("food-detail-macro-carbs")).toHaveTextContent("28");
    expect(within(nutritionCard).getByTestId("food-detail-macro-protein")).toHaveTextContent("15.7");
    expect(within(nutritionCard).getByTestId("food-detail-macro-fat")).toHaveTextContent("9.3");

    const ingredientCard = screen.getByTestId("food-detail-ingredients-card");
    expect(within(ingredientCard).getByText("Ingredientlar")).toBeInTheDocument();
    expect(within(ingredientCard).getByText("2 ta")).toBeInTheDocument();
    expect(within(ingredientCard).getByText("150g")).toBeInTheDocument();
    expect(within(ingredientCard).getByText("255 kcal")).toBeInTheDocument();
    expect(
      within(ingredientCard).queryByRole("button", { name: "Ingredient qo'shish" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Guruch")).not.toBeInTheDocument();
    fireEvent.click(within(ingredientCard).getByRole("button", { name: /Ingredientlar/ }));
    expect(screen.getByText("Guruch")).toBeInTheDocument();
    expect(screen.getByText("Mol go'shti")).toBeInTheDocument();
    expect(screen.getByTestId("food-detail-add-ingredient-row")).toHaveTextContent(
      "Ingredient qo'shish",
    );
    expect(screen.queryByText("Bekor qilish")).not.toBeInTheDocument();

    const sliderSection = within(nutritionCard).getByTestId("food-detail-portion-slider-section");
    expect(within(sliderSection).getByText("Miqdori")).toBeInTheDocument();
    expect(
      within(sliderSection).getByText("Porsiya og'irligini tanlang"),
    ).toBeInTheDocument();
    expect(within(sliderSection).getAllByText("150g")).toHaveLength(1);
    expect(within(sliderSection).getByText("150g")).toHaveClass("text-2xl");
    expect(within(sliderSection).getByText("0g")).toBeInTheDocument();
    expect(within(sliderSection).queryByText("100g")).not.toBeInTheDocument();
    expect(within(sliderSection).getByText("250g")).toBeInTheDocument();
    expect(within(sliderSection).getByText("500g")).toBeInTheDocument();
    expect(within(sliderSection).getByText("750g")).toBeInTheDocument();
    expect(within(sliderSection).getByText("1,000g")).toBeInTheDocument();
    expect(screen.getByTestId("portion-slider")).toHaveClass(
      "[&_[data-slot=slider-thumb]]:size-7",
    );
    expect(screen.getByTestId("portion-slider")).toHaveAttribute("max", "1000");
    expect(screen.getByTestId("portion-slider")).toHaveAttribute("min", "0");

    const saveButton = screen.getByRole("button", { name: "Saqlash" });
    expect(saveButton).toHaveClass("h-11");
    fireEvent.click(saveButton);

    expect(onSave).toHaveBeenCalledWith({
      item: {
        ...baseItem,
        ingredients: expect.any(Array),
      },
      grams: 150,
      macros: {
        cal: 255,
        protein: 15.7,
        carbs: 28,
        fat: 9.3,
        fiber: 0.4,
      },
      ingredients: expect.arrayContaining([
        expect.objectContaining({ id: "rice", name: "Guruch", grams: 100 }),
        expect.objectContaining({ id: "beef", name: "Mol go'shti", grams: 50 }),
      ]),
    });
  });

  it("updates nutrition totals when ingredients are edited, added, removed, or scaled", () => {
    const onSave = vi.fn();
    const onGramsChange = vi.fn();

    render(
      <FoodDetailPortionDrawer
        item={{ ...baseItem, ingredients: ingredientBreakdown }}
        type="food"
        grams={150}
        goals={{ protein: 140, carbs: 424, fat: 84 }}
        onGramsChange={onGramsChange}
        onSave={onSave}
      />,
    );

    const ingredientCard = screen.getByTestId("food-detail-ingredients-card");
    fireEvent.click(within(ingredientCard).getByRole("button", { name: /Ingredientlar/ }));

    fireEvent.click(screen.getByRole("button", { name: "Guruchni tahrirlash" }));
    expect(screen.getByTestId("ingredient-edit-drawer")).toHaveAttribute("data-mode", "edit");
    expect(screen.getByTestId("ingredient-edit-drawer")).toHaveAttribute("data-ingredient-id", "rice");
    fireEvent.click(screen.getByRole("button", { name: "mock-save-ingredient" }));
    expect(screen.getByText("Guruch edited")).toBeInTheDocument();
    expect(screen.getByTestId("food-detail-macro-carbs")).toHaveTextContent("1");
    expect(screen.getByTestId("food-detail-macro-protein")).toHaveTextContent("31");
    expect(screen.getByText("335 kcal")).toBeInTheDocument();
    expect(onGramsChange).toHaveBeenLastCalledWith(170);

    fireEvent.click(screen.getByTestId("food-detail-add-ingredient-row"));
    expect(screen.getByTestId("ingredient-edit-drawer")).toHaveAttribute("data-mode", "add");
    fireEvent.click(screen.getByRole("button", { name: "mock-add-ingredient" }));
    expect(screen.getByText("Sariyog'")).toBeInTheDocument();
    expect(screen.getByText("480 kcal")).toBeInTheDocument();
    expect(onGramsChange).toHaveBeenLastCalledWith(190);

    fireEvent.click(screen.getByRole("button", { name: "Mol go'shtini o'chirish" }));
    expect(screen.queryByText("Mol go'shti")).not.toBeInTheDocument();
    expect(screen.getAllByText("140g").length).toBeGreaterThan(0);

    fireEvent.change(screen.getByTestId("portion-slider"), {
      target: { value: "280" },
    });
    expect(onGramsChange).toHaveBeenLastCalledWith(280);

    fireEvent.click(screen.getByRole("button", { name: "Saqlash" }));
    const payload = onSave.mock.calls.at(-1)[0];
    expect(payload.grams).toBe(280);
    expect(payload.ingredients).toHaveLength(2);
    expect(payload.ingredients[0]).toMatchObject({
      id: "rice",
      name: "Guruch edited",
    });
    expect(payload.ingredients[0].grams).toBeCloseTo(240, 1);
    expect(payload.ingredients[1]).toMatchObject({
      id: "butter",
      name: "Sariyog'",
    });
    expect(payload.ingredients[1].grams).toBeCloseTo(40, 1);
  });

  it("omits the removed image placeholder when image is missing", () => {
    render(
      <FoodDetailPortionDrawer
        item={{ ...baseItem, image: null, emoji: "🥣" }}
        type="food"
        grams={100}
        goals={{ protein: 140, carbs: 424, fat: 84 }}
        onGramsChange={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    expect(screen.queryByRole("img", { name: "Moskva pelmenisi" })).not.toBeInTheDocument();
    expect(screen.queryByTestId("food-detail-image-fallback")).not.toBeInTheDocument();
  });

  it("keeps slider drag gestures from moving the parent drawer", () => {
    const onPointerDown = vi.fn();
    const onTouchStart = vi.fn();
    const onMouseDown = vi.fn();

    render(
      <div
        data-testid="drawer-shell"
        onMouseDown={onMouseDown}
        onPointerDown={onPointerDown}
        onTouchStart={onTouchStart}
      >
        <FoodDetailPortionDrawer
          item={baseItem}
          grams={150}
          goals={{ protein: 140, carbs: 424, fat: 84 }}
          onGramsChange={vi.fn()}
          onSave={vi.fn()}
        />
      </div>,
    );

    const slider = screen.getByTestId("portion-slider");
    fireEvent.pointerDown(slider);
    fireEvent.mouseDown(slider);
    fireEvent.touchStart(slider);

    expect(onPointerDown).not.toHaveBeenCalled();
    expect(onMouseDown).not.toHaveBeenCalled();
    expect(onTouchStart).not.toHaveBeenCalled();
  });
});
