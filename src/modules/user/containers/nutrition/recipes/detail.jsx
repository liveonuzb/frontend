import React from "react";
import { Link, useParams } from "react-router";
import {
  ArrowLeftIcon,
  BookOpenIcon,
  ClockIcon,
  StarIcon,
  UtensilsIcon,
} from "lucide-react";
import compact from "lodash/compact";
import map from "lodash/map";
import size from "lodash/size";
import times from "lodash/times";
import { toast } from "sonner";
import {
  useNutritionRecipeActions,
  useNutritionRecipeDetail,
} from "@/hooks/app/use-nutrition-recipes.js";
import { useMealPlan } from "@/hooks/app/use-meal-plan.js";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import OptionDrawerPicker from "@/components/option-drawer-picker";
import { cn } from "@/lib/utils.js";
import NutritionCard from "../ui/nutrition-card.jsx";
import NutritionLayout from "../ui/nutrition-layout.jsx";
import AddToMealPlanButton from "./components/add-to-meal-plan-button.jsx";
import AddToMealLogButton from "./components/add-to-meal-log-button.jsx";
import CreateRecipeShoppingListButton from "./components/create-recipe-shopping-list-button.jsx";
import FavoriteButton from "./components/favorite-button.jsx";
import RecipeCookingMode from "./components/recipe-cooking-mode.jsx";
import RecipeIngredientList from "./components/recipe-ingredient-list.jsx";
import RecipeNutritionCard from "./components/recipe-nutrition-card.jsx";
import RecipeStepList from "./components/recipe-step-list.jsx";
import ServingAdjuster from "./components/serving-adjuster.jsx";
import useRecipeTranslation from "./lib/recipe-i18n.js";

const getMealTypeOptions = (rt) => [
  { value: "breakfast", label: rt("meals.breakfast") },
  { value: "lunch", label: rt("meals.lunch") },
  { value: "dinner", label: rt("meals.dinner") },
  { value: "snack", label: rt("meals.snack") },
];

const getDayOptions = (rt) =>
  times(7, (index) => ({
    value: `day-${index + 1}`,
    label: rt("detail.dayNumber", { count: index + 1 }),
  }));

const getPriceRegions = (rt) => [
  { value: "", label: rt("regions.all") },
  { value: "uzbekistan", label: rt("regions.uzbekistan") },
  { value: "toshkent", label: rt("regions.toshkent") },
  { value: "samarqand", label: rt("regions.samarqand") },
  { value: "buxoro", label: rt("regions.buxoro") },
  { value: "fargona", label: rt("regions.fargona") },
  { value: "andijon", label: rt("regions.andijon") },
  { value: "namangan", label: rt("regions.namangan") },
  { value: "qashqadaryo", label: rt("regions.qashqadaryo") },
  { value: "surxondaryo", label: rt("regions.surxondaryo") },
  { value: "xorazm", label: rt("regions.xorazm") },
  { value: "navoiy", label: rt("regions.navoiy") },
  { value: "jizzax", label: rt("regions.jizzax") },
  { value: "sirdaryo", label: rt("regions.sirdaryo") },
  { value: "qoraqalpogiston", label: rt("regions.qoraqalpogiston") },
];

const getPriceSeasons = (rt) => [
  { value: "all", label: rt("seasons.all") },
  { value: "spring", label: rt("seasons.spring") },
  { value: "summer", label: rt("seasons.summer") },
  { value: "autumn", label: rt("seasons.autumn") },
  { value: "winter", label: rt("seasons.winter") },
];

const todayKey = () => new Date().toISOString().slice(0, 10);

const selectClassName =
  "h-9 w-full rounded-4xl border border-input bg-input/30 px-3 text-sm font-semibold";

const formatRating = (value) => {
  const rating = Number(value) || 0;
  return rating ? rating.toFixed(1) : "0.0";
};

const SelectDrawerField = ({ label, value, options, onChange }) => (
  <label className="space-y-1.5">
    <span className="text-xs font-bold uppercase text-muted-foreground">
      {label}
    </span>
    <OptionDrawerPicker
      value={value}
      options={options}
      title={label}
      ariaLabel={label}
      triggerClassName={selectClassName}
      onChange={onChange}
    />
  </label>
);

const RecipeImage = ({ recipe, className }) => {
  if (recipe?.imageUrl) {
    return (
      <img
        src={recipe.imageUrl}
        alt=""
        className={cn("h-full w-full object-cover", className)}
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
      <UtensilsIcon className="size-10" />
    </div>
  );
};

const RecipeDetailSkeleton = () => (
  <NutritionLayout>
    <NutritionCard className="h-64 animate-pulse bg-muted/30" />
    <NutritionCard className="h-48 animate-pulse bg-muted/30" />
  </NutritionLayout>
);

const RecipeDetailEmpty = () => {
  const rt = useRecipeTranslation();

  return (
    <NutritionLayout>
      <NutritionCard className="p-8 text-center">
        <BookOpenIcon className="mx-auto size-10 text-primary" />
        <h1 className="mt-4 text-xl font-black tracking-normal">
          {rt("detail.notFound")}
        </h1>
        <Link
          to="/user/nutrition/recipes"
          className="mt-5 inline-flex items-center gap-2 text-sm font-black text-primary"
        >
          <ArrowLeftIcon className="size-4" />
          {rt("detail.back")}
        </Link>
      </NutritionCard>
    </NutritionLayout>
  );
};

const NutritionRecipeDetailPage = () => {
  const rt = useRecipeTranslation();
  const { slugOrId } = useParams();
  const { recipe, isLoading, isError } = useNutritionRecipeDetail(slugOrId);
  const { plans, activePlan, draftPlan } = useMealPlan();
  const {
    toggleFavorite,
    addToMealLog,
    addToMealPlan,
    createShoppingList,
    isUpdating,
  } = useNutritionRecipeActions();
  const [servings, setServings] = React.useState(1);
  const [selectedMealType, setSelectedMealType] = React.useState("lunch");
  const mealPlanOptions = React.useMemo(() => {
    if (size(plans)) {
      return plans;
    }

    return compact([activePlan, draftPlan]);
  }, [activePlan, draftPlan, plans]);
  const defaultMealPlanId = mealPlanOptions[0]?.id || "";
  const mealPlanPickerOptions = React.useMemo(
    () =>
      map(mealPlanOptions, (plan) => ({
        value: plan.id,
        label: plan.name,
      })),
    [mealPlanOptions],
  );
  const [selectedPlanId, setSelectedPlanId] = React.useState("");
  const effectiveSelectedPlanId = selectedPlanId || defaultMealPlanId;
  const [selectedPlanDayKey, setSelectedPlanDayKey] = React.useState("day-1");
  const [selectedPlanMealType, setSelectedPlanMealType] =
    React.useState("lunch");
  const [selectedShoppingRegionKey, setSelectedShoppingRegionKey] =
    React.useState("");
  const [selectedShoppingSeason, setSelectedShoppingSeason] =
    React.useState("all");
  const [isCookingModeOpen, setIsCookingModeOpen] = React.useState(false);
  const mealTypes = React.useMemo(() => getMealTypeOptions(rt), [rt]);
  const dayOptions = React.useMemo(() => getDayOptions(rt), [rt]);
  const priceRegions = React.useMemo(() => getPriceRegions(rt), [rt]);
  const priceSeasons = React.useMemo(() => getPriceSeasons(rt), [rt]);

  if (isLoading) {
    return <RecipeDetailSkeleton />;
  }

  if (isError || !recipe) {
    return <RecipeDetailEmpty />;
  }

  const handleAddToMealLog = async () => {
    await addToMealLog(recipe.catalogFoodId, {
      date: todayKey(),
      mealType: selectedMealType,
      servings,
    });
    toast.success(rt("detail.logSuccess"));
  };

  const handleAddToMealPlan = async () => {
    if (!effectiveSelectedPlanId) {
      return;
    }

    await addToMealPlan(recipe.catalogFoodId, {
      planId: effectiveSelectedPlanId,
      dayKey: selectedPlanDayKey,
      mealType: selectedPlanMealType,
      servings,
    });
    toast.success(rt("detail.planSuccess"));
  };

  const handleCreateShoppingList = async () => {
    const payload = {
      servings,
      season: selectedShoppingSeason,
    };

    if (selectedShoppingRegionKey) {
      payload.regionKey = selectedShoppingRegionKey;
    }

    const shoppingList = await createShoppingList(
      recipe.catalogFoodId,
      payload,
    );
    const itemCount = size(shoppingList?.items);
    toast.success(
      itemCount
        ? rt("detail.shoppingListCreatedWithCount", { count: itemCount })
        : rt("detail.shoppingListCreated"),
    );
  };

  return (
    <NutritionLayout
      header={
        <NutritionCard tone="accent" className="overflow-hidden p-0">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-5 p-5">
              <div className="flex items-center justify-between gap-3">
                <Link
                  to="/user/nutrition/recipes"
                  className="inline-flex items-center gap-2 text-sm font-black text-primary"
                >
                  <ArrowLeftIcon className="size-4" />
                  {rt("detail.back")}
                </Link>
                <FavoriteButton
                  isFavorite={recipe.isFavorite}
                  isUpdating={isUpdating}
                  onClick={() => toggleFavorite(recipe)}
                />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-normal text-foreground">
                  {recipe.title}
                </h1>
                {recipe.description ? (
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                    {recipe.description}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {recipe.totalTimeMinutes ? (
                    <Badge variant="outline">
                      <ClockIcon className="size-3" />
                      {rt("common.minutes", { count: recipe.totalTimeMinutes })}
                    </Badge>
                  ) : null}
                  {recipe.prepTimeMinutes ? (
                    <Badge variant="outline">
                      {rt("detail.prepTime", {
                        count: recipe.prepTimeMinutes,
                      })}
                    </Badge>
                  ) : null}
                  {recipe.cookTimeMinutes ? (
                    <Badge variant="outline">
                      {rt("detail.cookTime", {
                        count: recipe.cookTimeMinutes,
                      })}
                    </Badge>
                  ) : null}
                  {recipe.difficulty ? (
                    <Badge variant="outline">{recipe.difficulty}</Badge>
                  ) : null}
                  {recipe.servings ? (
                    <Badge variant="outline">
                      {rt("detail.servingsBadge", { count: recipe.servings })}
                    </Badge>
                  ) : null}
                  {recipe.ratingAverage ? (
                    <Badge variant="outline">
                      <StarIcon className="size-3" />
                      {formatRating(recipe.ratingAverage)}
                    </Badge>
                  ) : null}
                </div>
              </div>
              <RecipeNutritionCard
                recipe={recipe}
                servings={servings}
                includeFiber
                includeDetailed
                className="sm:grid-cols-5"
              />
              <ServingAdjuster value={servings} onChange={setServings} />
              <div className="grid gap-3 sm:grid-cols-[minmax(0,180px)_minmax(0,1fr)]">
                <SelectDrawerField
                  label={rt("detail.mealType")}
                  value={selectedMealType}
                  options={mealTypes}
                  onChange={setSelectedMealType}
                />
                <AddToMealLogButton
                  isUpdating={isUpdating}
                  className="self-end"
                  onClick={handleAddToMealLog}
                />
              </div>
              {size(mealPlanOptions) ? (
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_110px_150px_minmax(0,1fr)]">
                  <SelectDrawerField
                    label={rt("detail.plan")}
                    value={effectiveSelectedPlanId}
                    options={mealPlanPickerOptions}
                    onChange={setSelectedPlanId}
                  />
                  <SelectDrawerField
                    label={rt("detail.day")}
                    value={selectedPlanDayKey}
                    options={dayOptions}
                    onChange={setSelectedPlanDayKey}
                  />
                  <SelectDrawerField
                    label={rt("detail.planMealType")}
                    value={selectedPlanMealType}
                    options={mealTypes}
                    onChange={setSelectedPlanMealType}
                  />
                  <AddToMealPlanButton
                    isUpdating={isUpdating}
                    disabled={!effectiveSelectedPlanId}
                    className="self-end"
                    onClick={handleAddToMealPlan}
                  />
                </div>
              ) : null}
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_150px_minmax(0,1fr)]">
                <SelectDrawerField
                  label={rt("detail.priceRegion")}
                  value={selectedShoppingRegionKey}
                  options={priceRegions}
                  onChange={setSelectedShoppingRegionKey}
                />
                <SelectDrawerField
                  label={rt("detail.season")}
                  value={selectedShoppingSeason}
                  options={priceSeasons}
                  onChange={setSelectedShoppingSeason}
                />
                <CreateRecipeShoppingListButton
                  isUpdating={isUpdating}
                  className="self-end"
                  onClick={handleCreateShoppingList}
                />
              </div>
              {size(recipe.instructions) ? (
                <Button
                  type="button"
                  className="h-10"
                  onClick={() => setIsCookingModeOpen(true)}
                >
                  {rt("detail.cookingMode")}
                </Button>
              ) : null}
            </div>
            <div className="min-h-[240px] overflow-hidden lg:min-h-full">
              <RecipeImage recipe={recipe} />
            </div>
          </div>
        </NutritionCard>
      }
    >
      {isCookingModeOpen ? (
        <RecipeCookingMode
          instructions={recipe.instructions}
          onClose={() => setIsCookingModeOpen(false)}
        />
      ) : null}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <RecipeIngredientList
          ingredients={recipe.ingredients}
          servings={servings}
        />
        <RecipeStepList instructions={recipe.instructions} />
      </div>
    </NutritionLayout>
  );
};

export default NutritionRecipeDetailPage;
