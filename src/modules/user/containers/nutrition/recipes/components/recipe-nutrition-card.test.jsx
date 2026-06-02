import React from "react";
import i18n from "@/lib/i18n";

i18n.changeLanguage("uz");
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RecipeNutritionCard from "./recipe-nutrition-card.jsx";

describe("RecipeNutritionCard", () => {
  it("renders scaled nutrition metrics", () => {
    render(
      <RecipeNutritionCard
        recipe={{
          calories: 540,
          protein: 18,
          carbs: 62,
          fat: 22,
          fiber: 6,
          sugar: 3,
          sodium: 480,
          micronutrients: {
            iron: 2.4,
          },
        }}
        servings={2}
        includeFiber
        includeDetailed
      />,
    );

    expect(screen.getByText("1080")).toBeInTheDocument();
    expect(screen.getByText("36g")).toBeInTheDocument();
    expect(screen.getByText("124g")).toBeInTheDocument();
    expect(screen.getByText("44g")).toBeInTheDocument();
    expect(screen.getByText("12g")).toBeInTheDocument();
    expect(screen.getByText("6g")).toBeInTheDocument();
    expect(screen.getByText("960mg")).toBeInTheDocument();
    expect(screen.getByText("4.8mg")).toBeInTheDocument();
    expect(screen.getByText("iron")).toBeInTheDocument();
  });
});
