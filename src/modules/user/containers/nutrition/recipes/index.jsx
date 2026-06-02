import React from "react";
import {
  BookOpenIcon,
  ClockIcon,
  SparklesIcon,
  UtensilsIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  useNutritionRecipeActions,
  useNutritionRecipeDetail,
  useNutritionRecipeFilters,
  useNutritionRecipes,
} from "@/hooks/app/use-nutrition-recipes.js";
import NutritionCard from "../ui/nutrition-card.jsx";
import NutritionLayout from "../ui/nutrition-layout.jsx";
import AddToMealLogButton from "./components/add-to-meal-log-button.jsx";
import RecipeCard from "./components/recipe-card.jsx";
import RecipeCategoryChips from "./components/recipe-category-chips.jsx";
import RecipeFilters from "./components/recipe-filters.jsx";
import RecipeNutritionCard from "./components/recipe-nutrition-card.jsx";
import RecipeSearchBar from "./components/recipe-search-bar.jsx";
import RecipeTagChips from "./components/recipe-tag-chips.jsx";
import { cn } from "@/lib/utils.js";
import useRecipeTranslation from "./lib/recipe-i18n.js";

import find from "lodash/find";
import map from "lodash/map";
import slice from "lodash/slice";
import toNumber from "lodash/toNumber";

const SEARCH_DEBOUNCE_MS = 350;

const getMealTypeOptions = (rt) => [
  { value: "breakfast", label: rt("meals.breakfast") },
  { value: "lunch", label: rt("meals.lunch") },
  { value: "dinner", label: rt("meals.dinner") },
  { value: "snack", label: rt("meals.snack") },
];

const todayKey = () => new Date().toISOString().slice(0, 10);

const formatMacro = (value, unit = "g") =>
  `${Math.round(toNumber(value) || 0)}${unit}`;

const selectClassName =
  "h-9 w-full rounded-4xl border border-input bg-input/30 px-3 text-sm font-semibold";

const RecipeImage = ({ recipe, className }) => {
  if (recipe?.imageUrl) {
    return (
      <img
        src={recipe.imageUrl}
        alt=""
        className={cn("h-full w-full object-cover", className)}
        loading="lazy"
      />
    );
  }

  return (
    <div
      className={cn(
        "grid h-full w-full place-items-center bg-[rgb(var(--accent-rgb)/0.10)] text-primary",
        className,
      )}
    >
      <UtensilsIcon className="size-8" />
    </div>
  );
};

const RecipeDetailPanel = ({
  recipe,
  isLoading,
  selectedMealType,
  servings,
  onMealTypeChange,
  onServingsChange,
  onAddToMealLog,
  isUpdating,
}) => {
  const rt = useRecipeTranslation();
  const mealTypes = React.useMemo(() => getMealTypeOptions(rt), [rt]);

  if (isLoading) {
    return (
      <NutritionCard className="min-h-[420px] animate-pulse bg-muted/30" />
    );
  }

  if (!recipe) {
    return (
      <NutritionCard className="min-h-[420px] p-5">
        <div className="flex h-full min-h-[360px] flex-col items-center justify-center text-center">
          <BookOpenIcon className="size-10 text-primary" />
          <h2 className="mt-4 text-xl font-black tracking-normal">
            {rt("page.selectRecipe")}
          </h2>
        </div>
      </NutritionCard>
    );
  }

  return (
    <NutritionCard className="overflow-hidden p-0">
      <div className="aspect-[16/10] overflow-hidden">
        <RecipeImage recipe={recipe} />
      </div>
      <div className="space-y-5 p-5">
        <div>
          <h2 className="text-2xl font-black tracking-normal text-foreground">
            {recipe.title}
          </h2>
          {recipe.description ? (
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {recipe.description}
            </p>
          ) : null}
        </div>

        <RecipeNutritionCard
          recipe={recipe}
          servings={servings}
          className="grid-cols-4"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-xs font-bold uppercase text-muted-foreground">
              {rt("detail.serving")}
            </span>
            <Input
              type="number"
              min="0.25"
              step="0.25"
              value={servings}
              onChange={(event) =>
                onServingsChange(
                  Math.max(0.25, toNumber(event.target.value) || 1),
                )
              }
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-bold uppercase text-muted-foreground">
              {rt("detail.mealType")}
            </span>
            <select
              className={selectClassName}
              value={selectedMealType}
              onChange={(event) => onMealTypeChange(event.target.value)}
            >
              {map(mealTypes, (item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <AddToMealLogButton isUpdating={isUpdating} onClick={onAddToMealLog} />

        <div>
          <h3 className="text-sm font-black uppercase text-muted-foreground">
            {rt("ingredients.title")}
          </h3>
          <div className="mt-3 space-y-2">
            {map(recipe.ingredients, (ingredient) => (
              <div
                key={
                  ingredient.id || ingredient.ingredientId || ingredient.name
                }
                className="flex items-center justify-between rounded-[18px] border border-border/60 bg-background/70 px-3 py-2 text-sm"
              >
                <span className="font-semibold">{ingredient.name}</span>
                <span className="text-muted-foreground">
                  {formatMacro(
                    (ingredient.grams || ingredient.estimatedGrams) * servings,
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-black uppercase text-muted-foreground">
            {rt("steps.title")}
          </h3>
          <div className="mt-3 space-y-3">
            {map(recipe.instructions, (step, index) => (
              <div
                key={step.id || `${step.stepNumber}-${index}`}
                className="rounded-[20px] border border-border/60 bg-background/70 p-3"
              >
                <div className="flex items-center gap-2 text-sm font-black">
                  <span className="grid size-6 place-items-center rounded-full bg-primary/10 text-xs text-primary">
                    {step.stepNumber || index + 1}
                  </span>
                  {step.title || rt("steps.fallbackTitle")}
                  {step.durationMinutes ? (
                    <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <ClockIcon className="size-3" />
                      {rt("common.minutes", { count: step.durationMinutes })}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {step.body || step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </NutritionCard>
  );
};

const NutritionRecipesPage = () => {
  const rt = useRecipeTranslation();
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const searchTimeoutRef = React.useRef(null);
  const [sort, setSort] = React.useState("newest");
  const [categoryId, setCategoryId] = React.useState("");
  const [cuisineId, setCuisineId] = React.useState("");
  const [dietaryTag, setDietaryTag] = React.useState("");
  const [excludeAllergenTag, setExcludeAllergenTag] = React.useState("");
  const [difficulty, setDifficulty] = React.useState("");
  const [maxTotalTimeMinutes, setMaxTotalTimeMinutes] = React.useState("");
  const [minProtein, setMinProtein] = React.useState("");
  const [minCalories, setMinCalories] = React.useState("");
  const [maxCalories, setMaxCalories] = React.useState("");
  const [featuredOnly, setFeaturedOnly] = React.useState(false);
  const [favoriteOnly, setFavoriteOnly] = React.useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = React.useState(null);
  const [selectedMealType, setSelectedMealType] = React.useState("lunch");
  const [servings, setServings] = React.useState(1);

  React.useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        window.clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleSearchChange = React.useCallback((nextSearch) => {
    setSearch(nextSearch);
    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = window.setTimeout(() => {
      setDebouncedSearch(nextSearch);
    }, SEARCH_DEBOUNCE_MS);
  }, []);
  const filters = React.useMemo(
    () => ({
      q: debouncedSearch,
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
      featuredOnly: featuredOnly ? true : undefined,
      favoriteOnly: favoriteOnly ? true : undefined,
    }),
    [
      categoryId,
      cuisineId,
      dietaryTag,
      difficulty,
      excludeAllergenTag,
      favoriteOnly,
      featuredOnly,
      maxCalories,
      maxTotalTimeMinutes,
      minCalories,
      minProtein,
      debouncedSearch,
      sort,
    ],
  );
  const { categories, cuisines, dietaryTags, allergenTags } =
    useNutritionRecipeFilters();
  const { recipes, pagination, isLoading } = useNutritionRecipes(filters);
  const selectedRecipeIdForQuery = React.useMemo(() => {
    if (!recipes.length) {
      return null;
    }

    const selectedExists = recipes.some(
      (item) => item.catalogFoodId === selectedRecipeId,
    );

    return selectedExists
      ? selectedRecipeId
      : recipes[0]?.catalogFoodId || null;
  }, [recipes, selectedRecipeId]);
  const { recipe, isLoading: isDetailLoading } =
    useNutritionRecipeDetail(selectedRecipeIdForQuery);
  const { toggleFavorite, addToMealLog, isUpdating } =
    useNutritionRecipeActions();
  const selectedRecipe =
    recipe ||
    find(recipes, (item) => item.catalogFoodId === selectedRecipeIdForQuery) ||
    null;

  const handleFavorite = React.useCallback(
    async (item) => {
      await toggleFavorite(item);
    },
    [toggleFavorite],
  );

  const handleAddToMealLog = React.useCallback(async () => {
    if (!selectedRecipe?.catalogFoodId) {
      return;
    }

    await addToMealLog(selectedRecipe.catalogFoodId, {
      date: todayKey(),
      mealType: selectedMealType,
      servings,
    });
    toast.success(rt("detail.logSuccess"));
  }, [addToMealLog, rt, selectedMealType, selectedRecipe, servings]);

  const hasActiveFilters = Boolean(
    search ||
    sort !== "newest" ||
    categoryId ||
    cuisineId ||
    dietaryTag ||
    excludeAllergenTag ||
    difficulty ||
    maxTotalTimeMinutes ||
    minProtein ||
    minCalories ||
    maxCalories ||
    featuredOnly ||
    favoriteOnly,
  );

  const handleClearFilters = React.useCallback(() => {
    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
    }
    setSearch("");
    setDebouncedSearch("");
    setSort("newest");
    setCategoryId("");
    setCuisineId("");
    setDietaryTag("");
    setExcludeAllergenTag("");
    setDifficulty("");
    setMaxTotalTimeMinutes("");
    setMinProtein("");
    setMinCalories("");
    setMaxCalories("");
    setFeaturedOnly(false);
    setFavoriteOnly(false);
  }, []);

  return (
    <NutritionLayout
      header={
        <NutritionCard tone="accent" className="p-5">
          <div className="flex flex-col gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background/70 px-3 py-1 text-xs font-black uppercase text-primary">
                <SparklesIcon className="size-3.5" />
                {rt("page.badge")}
              </div>
              <h1 className="mt-3 text-2xl font-black tracking-normal text-foreground sm:text-3xl">
                {rt("page.title")}
              </h1>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-10">
              <RecipeSearchBar
                value={search}
                className="relative block self-end xl:col-span-2"
                onChange={handleSearchChange}
              />
              <RecipeFilters
                sort={sort}
                categoryId={categoryId}
                cuisineId={cuisineId}
                dietaryTag={dietaryTag}
                excludeAllergenTag={excludeAllergenTag}
                difficulty={difficulty}
                maxTotalTimeMinutes={maxTotalTimeMinutes}
                minProtein={minProtein}
                minCalories={minCalories}
                maxCalories={maxCalories}
                featuredOnly={featuredOnly}
                favoriteOnly={favoriteOnly}
                hasActiveFilters={hasActiveFilters}
                categories={categories}
                cuisines={cuisines}
                dietaryTags={dietaryTags}
                allergenTags={allergenTags}
                onSortChange={setSort}
                onCategoryChange={setCategoryId}
                onCuisineChange={setCuisineId}
                onDietaryTagChange={setDietaryTag}
                onExcludeAllergenTagChange={setExcludeAllergenTag}
                onDifficultyChange={setDifficulty}
                onMaxTotalTimeMinutesChange={setMaxTotalTimeMinutes}
                onMinProteinChange={setMinProtein}
                onMinCaloriesChange={setMinCalories}
                onMaxCaloriesChange={setMaxCalories}
                onFeaturedOnlyToggle={() => setFeaturedOnly((value) => !value)}
                onFavoriteOnlyToggle={() => setFavoriteOnly((value) => !value)}
                onClearFilters={handleClearFilters}
              />
            </div>
            {categories.length ? (
              <RecipeCategoryChips
                categories={categories}
                value={categoryId}
                onChange={setCategoryId}
              />
            ) : null}
            {dietaryTags.length ? (
              <RecipeTagChips
                tags={dietaryTags}
                value={dietaryTag}
                onChange={setDietaryTag}
              />
            ) : null}
          </div>
        </NutritionCard>
      }
      sidebar={
        <RecipeDetailPanel
          recipe={selectedRecipe}
          isLoading={isDetailLoading}
          selectedMealType={selectedMealType}
          servings={servings}
          onMealTypeChange={setSelectedMealType}
          onServingsChange={setServings}
          onAddToMealLog={handleAddToMealLog}
          isUpdating={isUpdating}
        />
      }
    >
      <div className="grid gap-3">
        {isLoading ? (
          <>
            <NutritionCard className="h-44 animate-pulse bg-muted/30" />
            <NutritionCard className="h-44 animate-pulse bg-muted/30" />
          </>
        ) : recipes.length ? (
          map(recipes, (recipeItem) => (
            <RecipeCard
              key={recipeItem.id}
              recipe={recipeItem}
              isSelected={recipeItem.catalogFoodId === selectedRecipeIdForQuery}
              onSelect={(item) => {
                setSelectedRecipeId(item.catalogFoodId);
                setServings(1);
              }}
              onFavorite={handleFavorite}
              isUpdating={isUpdating}
            />
          ))
        ) : (
          <NutritionCard className="p-8 text-center">
            <BookOpenIcon className="mx-auto size-10 text-primary" />
            <h2 className="mt-4 text-xl font-black tracking-normal">
              {rt("page.empty")}
            </h2>
          </NutritionCard>
        )}
      </div>

      {recipes.length ? (
        <div className="flex items-center justify-between text-sm font-semibold text-muted-foreground">
          <span>
            {rt("page.totalCount", {
              count: pagination.total || recipes.length,
            })}
          </span>
          <span>
            {slice(recipes, 0, 1).length
              ? `1 / ${pagination.totalPages || 1}`
              : ""}
          </span>
        </div>
      ) : null}
    </NutritionLayout>
  );
};

export default NutritionRecipesPage;
