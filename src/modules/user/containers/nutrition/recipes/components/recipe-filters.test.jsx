import React from "react";
import i18n from "@/lib/i18n";

i18n.changeLanguage("uz");
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RecipeFilters from "./recipe-filters.jsx";

const defaultProps = {
  sort: "newest",
  categoryId: "",
  cuisineId: "",
  dietaryTag: "",
  excludeAllergenTag: "",
  difficulty: "",
  maxTotalTimeMinutes: "",
  minProtein: "",
  minCalories: "",
  maxCalories: "",
  featuredOnly: false,
  favoriteOnly: false,
  hasActiveFilters: false,
  categories: [{ id: 2, label: "Tushlik" }],
  cuisines: [{ id: 5, label: "O'zbek" }],
  dietaryTags: ["quick"],
  allergenTags: ["gluten"],
  onSortChange: vi.fn(),
  onCategoryChange: vi.fn(),
  onCuisineChange: vi.fn(),
  onDietaryTagChange: vi.fn(),
  onExcludeAllergenTagChange: vi.fn(),
  onDifficultyChange: vi.fn(),
  onMaxTotalTimeMinutesChange: vi.fn(),
  onMinProteinChange: vi.fn(),
  onMinCaloriesChange: vi.fn(),
  onMaxCaloriesChange: vi.fn(),
  onFeaturedOnlyToggle: vi.fn(),
  onFavoriteOnlyToggle: vi.fn(),
  onClearFilters: vi.fn(),
};

describe("RecipeFilters", () => {
  it("emits filter changes and clear action", () => {
    const props = {
      ...defaultProps,
      hasActiveFilters: true,
      onCategoryChange: vi.fn(),
      onDifficultyChange: vi.fn(),
      onMaxTotalTimeMinutesChange: vi.fn(),
      onMinCaloriesChange: vi.fn(),
      onFeaturedOnlyToggle: vi.fn(),
      onFavoriteOnlyToggle: vi.fn(),
      onClearFilters: vi.fn(),
    };

    render(<RecipeFilters {...props} />);

    fireEvent.change(screen.getByLabelText("Kategoriya"), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByLabelText("Minimal kcal"), {
      target: { value: "350" },
    });
    fireEvent.change(screen.getByLabelText("Qiyinlik"), {
      target: { value: "easy" },
    });
    fireEvent.change(screen.getByLabelText("Maksimal vaqt"), {
      target: { value: "30" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Tavsiya etilgan" }));
    fireEvent.click(screen.getByRole("button", { name: "Saqlanganlar" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Filterlarni tozalash" }),
    );

    expect(props.onCategoryChange).toHaveBeenCalledWith("2");
    expect(props.onMinCaloriesChange).toHaveBeenCalledWith("350");
    expect(props.onDifficultyChange).toHaveBeenCalledWith("easy");
    expect(props.onMaxTotalTimeMinutesChange).toHaveBeenCalledWith("30");
    expect(props.onFeaturedOnlyToggle).toHaveBeenCalledTimes(1);
    expect(props.onFavoriteOnlyToggle).toHaveBeenCalledTimes(1);
    expect(props.onClearFilters).toHaveBeenCalledTimes(1);
  });
});
