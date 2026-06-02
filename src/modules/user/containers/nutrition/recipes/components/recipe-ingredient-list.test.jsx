import React from "react";
import i18n from "@/lib/i18n";

i18n.changeLanguage("uz");
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RecipeIngredientList from "./recipe-ingredient-list.jsx";

describe("RecipeIngredientList", () => {
  it("renders grouped display amounts, optional notes, and checklist state", () => {
    render(
      <RecipeIngredientList
        servings={2}
        ingredients={[
          {
            id: "rice",
            name: "Guruch",
            grams: 150,
            displayAmount: 1.5,
            displayUnit: "kosa",
            optional: true,
            groupName: "Asos",
            notes: "Yuvilgan",
          },
          {
            id: "salt",
            name: "Tuz",
            grams: 5,
            displayUnit: "g",
            groupName: "Ziravorlar",
          },
        ]}
      />,
    );

    expect(screen.getByText("Asos")).toBeInTheDocument();
    expect(screen.getByText("Ziravorlar")).toBeInTheDocument();
    expect(screen.getByText("3 kosa")).toBeInTheDocument();
    expect(screen.getByText("10g")).toBeInTheDocument();
    expect(screen.getByText("ixtiyoriy")).toBeInTheDocument();
    expect(screen.getByText("Yuvilgan")).toBeInTheDocument();

    const riceRow = screen.getByLabelText("Guruch tayyor").closest("label");
    expect(riceRow).not.toBeNull();
    const riceCheckbox = within(riceRow).getByRole("checkbox", {
      name: "Guruch tayyor",
    });

    fireEvent.click(riceCheckbox);

    expect(riceCheckbox).toBeChecked();
  });
});
