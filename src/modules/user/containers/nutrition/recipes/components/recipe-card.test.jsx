import React from "react";
import i18n from "@/lib/i18n";

i18n.changeLanguage("uz");
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RecipeCard from "./recipe-card.jsx";

const recipe = {
  id: "recipe-11",
  catalogFoodId: 11,
  title: "Toshkent palovi",
  description: "Uy sharoitida tayyorlanadigan to'yimli palov.",
  caloriesPerServing: 540,
  proteinPerServing: 18,
  carbsPerServing: 62,
  fatPerServing: 24,
  totalTimeMinutes: 80,
  servings: 4,
  imageUrl: null,
  isFavorite: false,
};

describe("RecipeCard", () => {
  it("renders recipe summary actions and selection", () => {
    const onFavorite = vi.fn();
    const onSelect = vi.fn();
    const onSave = vi.fn();
    const onAdd = vi.fn();
    const onDetail = vi.fn();

    render(
      <RecipeCard
        recipe={recipe}
        isSelected={false}
        isUpdating={false}
        onFavorite={onFavorite}
        onSelect={onSelect}
        onSave={onSave}
        onAdd={onAdd}
        onDetail={onDetail}
      />,
    );

    expect(screen.getByText("Toshkent palovi")).toBeInTheDocument();
    expect(screen.getByText("Uy sharoitida tayyorlanadigan to'yimli palov.")).toBeInTheDocument();
    expect(screen.getAllByText("80 min")[0]).toBeInTheDocument();
    expect(screen.getByText("540")).toBeInTheDocument();
    expect(screen.getByText("18g")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Toshkent palovi sevimlilarga qo'shish",
      }),
    );
    expect(onFavorite).toHaveBeenCalledWith(recipe);

    fireEvent.click(screen.getAllByRole("button", { name: "Toshkent palovi" })[0]);
    expect(onSelect).toHaveBeenCalledWith(recipe);

    fireEvent.click(screen.getByRole("button", { name: "Detail" }));
    expect(onDetail).toHaveBeenCalledWith(recipe);

    fireEvent.click(screen.getByRole("button", { name: "Saqlash" }));
    expect(onSave).toHaveBeenCalledWith(recipe);

    fireEvent.click(screen.getByRole("button", { name: "Qo'shish" }));
    expect(onAdd).toHaveBeenCalledWith(recipe);
  });
});
