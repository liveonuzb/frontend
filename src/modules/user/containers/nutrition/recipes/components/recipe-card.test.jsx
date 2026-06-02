import React from "react";
import i18n from "@/lib/i18n";

i18n.changeLanguage("uz");
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import RecipeCard from "./recipe-card.jsx";

const recipe = {
  id: "recipe-11",
  catalogFoodId: 11,
  title: "Toshkent palovi",
  calories: 540,
  protein: 18,
  carbs: 62,
  difficulty: "medium",
  totalTimeMinutes: 80,
  ratingAverage: 4.7,
  ratingCount: 12,
  servingLabel: "350 g",
  imageUrl: null,
  ingredientsCount: 3,
  stepsCount: 4,
  isFavorite: false,
};

describe("RecipeCard", () => {
  it("renders recipe summary actions and links to detail", () => {
    const onFavorite = vi.fn();
    const onSelect = vi.fn();

    render(
      <MemoryRouter>
        <RecipeCard
          recipe={recipe}
          isSelected={false}
          isUpdating={false}
          onFavorite={onFavorite}
          onSelect={onSelect}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Toshkent palovi")).toBeInTheDocument();
    expect(screen.getByText("350 g")).toBeInTheDocument();
    expect(screen.getByText("80 daq")).toBeInTheDocument();
    expect(screen.getByText("medium")).toBeInTheDocument();
    expect(screen.getByText("4.7")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Toshkent palovi batafsil" }),
    ).toHaveAttribute("href", "/user/nutrition/recipes/11");

    fireEvent.click(screen.getByRole("button", { name: "Saqlash" }));
    expect(onFavorite).toHaveBeenCalledWith(recipe);

    fireEvent.click(screen.getByRole("button", { name: "Toshkent palovi" }));
    expect(onSelect).toHaveBeenCalledWith(recipe);
  });
});
