import React from "react";
import { HeartIcon, SparklesIcon, XIcon } from "lucide-react";
import map from "lodash/map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils.js";
import useRecipeTranslation from "../lib/recipe-i18n.js";

const sortOptions = [
  { value: "newest", labelKey: "filters.sortOptions.newest" },
  { value: "popular", labelKey: "filters.sortOptions.popular" },
  { value: "highestRated", labelKey: "filters.sortOptions.highestRated" },
  { value: "highestProtein", labelKey: "filters.sortOptions.highestProtein" },
  { value: "lowestCalories", labelKey: "filters.sortOptions.lowestCalories" },
  { value: "fastest", labelKey: "filters.sortOptions.fastest" },
  { value: "featured", labelKey: "filters.sortOptions.featured" },
];

const difficultyOptions = [
  { value: "easy", labelKey: "filters.difficultyOptions.easy" },
  { value: "medium", labelKey: "filters.difficultyOptions.medium" },
  { value: "hard", labelKey: "filters.difficultyOptions.hard" },
];

const selectClassName =
  "h-9 w-full rounded-4xl border border-input bg-input/30 px-3 text-sm font-semibold";

const formatTagLabel = (value) =>
  String(value || "")
    .replace(/[-_]+/g, " ")
    .trim();

const FilterSelect = ({ label, value, onChange, children }) => (
  <label className="space-y-1.5">
    <span className="text-xs font-bold uppercase text-muted-foreground">
      {label}
    </span>
    <select
      aria-label={label}
      className={selectClassName}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {children}
    </select>
  </label>
);

const FilterNumberInput = ({ label, value, onChange, placeholder }) => (
  <label className="space-y-1.5">
    <span className="text-xs font-bold uppercase text-muted-foreground">
      {label}
    </span>
    <Input
      type="number"
      min="0"
      value={value}
      aria-label={label}
      className="h-9"
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  </label>
);

const RecipeFilters = ({
  sort,
  categoryId,
  cuisineId,
  dietaryTag,
  excludeAllergenTag,
  difficulty,
  maxTotalTimeMinutes,
  minProtein,
  minCalories,
  maxCalories,
  featuredOnly,
  favoriteOnly,
  hasActiveFilters,
  categories,
  cuisines,
  dietaryTags,
  allergenTags,
  onSortChange,
  onCategoryChange,
  onCuisineChange,
  onDietaryTagChange,
  onExcludeAllergenTagChange,
  onDifficultyChange,
  onMaxTotalTimeMinutesChange,
  onMinProteinChange,
  onMinCaloriesChange,
  onMaxCaloriesChange,
  onFeaturedOnlyToggle,
  onFavoriteOnlyToggle,
  onClearFilters,
}) => {
  const rt = useRecipeTranslation();

  return (
    <>
      <FilterSelect
        label={rt("filters.sort")}
        value={sort}
        onChange={onSortChange}
      >
        {map(sortOptions, (item) => (
          <option key={item.value} value={item.value}>
            {rt(item.labelKey)}
          </option>
        ))}
      </FilterSelect>
      <FilterSelect
        label={rt("filters.category")}
        value={categoryId}
        onChange={onCategoryChange}
      >
        <option value="">{rt("common.all")}</option>
        {map(categories, (item) => (
          <option key={item.id} value={String(item.id)}>
            {item.label}
          </option>
        ))}
      </FilterSelect>
      <FilterSelect
        label={rt("filters.cuisine")}
        value={cuisineId}
        onChange={onCuisineChange}
      >
        <option value="">{rt("common.all")}</option>
        {map(cuisines, (item) => (
          <option key={item.id} value={String(item.id)}>
            {item.label}
          </option>
        ))}
      </FilterSelect>
      <FilterSelect
        label={rt("filters.tag")}
        value={dietaryTag}
        onChange={onDietaryTagChange}
      >
        <option value="">{rt("common.all")}</option>
        {map(dietaryTags, (item) => (
          <option key={item} value={item}>
            {formatTagLabel(item)}
          </option>
        ))}
      </FilterSelect>
      <FilterSelect
        label={rt("filters.allergen")}
        value={excludeAllergenTag}
        onChange={onExcludeAllergenTagChange}
      >
        <option value="">{rt("common.none")}</option>
        {map(allergenTags, (item) => (
          <option key={item} value={item}>
            {formatTagLabel(item)}
          </option>
        ))}
      </FilterSelect>
      <FilterSelect
        label={rt("filters.difficulty")}
        value={difficulty}
        onChange={onDifficultyChange}
      >
        <option value="">{rt("common.all")}</option>
        {map(difficultyOptions, (item) => (
          <option key={item.value} value={item.value}>
            {rt(item.labelKey)}
          </option>
        ))}
      </FilterSelect>
      <FilterNumberInput
        label={rt("filters.maxTotalTime")}
        value={maxTotalTimeMinutes}
        placeholder={rt("common.minutesShort")}
        onChange={onMaxTotalTimeMinutesChange}
      />
      <FilterNumberInput
        label={rt("filters.minProtein")}
        value={minProtein}
        placeholder="g"
        onChange={onMinProteinChange}
      />
      <FilterNumberInput
        label={rt("filters.minCalories")}
        value={minCalories}
        placeholder={rt("nutrition.calories")}
        onChange={onMinCaloriesChange}
      />
      <FilterNumberInput
        label={rt("filters.maxCalories")}
        value={maxCalories}
        placeholder={rt("nutrition.calories")}
        onChange={onMaxCaloriesChange}
      />
      <Button
        type="button"
        variant={featuredOnly ? "default" : "outline"}
        className="h-9 self-end"
        aria-pressed={featuredOnly}
        aria-label={rt("filters.featuredAria")}
        onClick={onFeaturedOnlyToggle}
      >
        <SparklesIcon
          className={cn("size-4", featuredOnly && "fill-current")}
        />
        {rt("filters.featured")}
      </Button>
      <Button
        type="button"
        variant={favoriteOnly ? "default" : "outline"}
        className="h-9 self-end"
        aria-pressed={favoriteOnly}
        aria-label={rt("filters.savedOnly")}
        onClick={onFavoriteOnlyToggle}
      >
        <HeartIcon className={cn("size-4", favoriteOnly && "fill-current")} />
        {rt("filters.savedOnly")}
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="h-9 self-end"
        disabled={!hasActiveFilters}
        aria-label={rt("filters.clearAria")}
        onClick={onClearFilters}
      >
        <XIcon className="size-4" />
        {rt("filters.clear")}
      </Button>
    </>
  );
};

export default RecipeFilters;
