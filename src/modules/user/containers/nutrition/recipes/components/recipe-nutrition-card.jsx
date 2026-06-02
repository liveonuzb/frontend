import React from "react";
import { FlameIcon } from "lucide-react";
import map from "lodash/map";
import toNumber from "lodash/toNumber";
import { cn } from "@/lib/utils.js";
import RecipeMetric from "./recipe-metric.jsx";
import useRecipeTranslation from "../lib/recipe-i18n.js";

const formatMacro = (value, unit = "g") =>
  `${Math.round(toNumber(value) || 0)}${unit}`;

const formatDecimalMetric = (value, unit = "mg") => {
  const number = toNumber(value) || 0;
  const rounded = Math.round((number + Number.EPSILON) * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded}${unit}`;
};

const RecipeNutritionCard = ({
  recipe,
  servings = 1,
  includeFiber = false,
  includeDetailed = false,
  className,
}) => {
  const rt = useRecipeTranslation();
  const micronutrients =
    includeDetailed &&
    recipe.micronutrients &&
    typeof recipe.micronutrients === "object"
      ? Object.entries(recipe.micronutrients)
      : [];

  return (
    <div className={cn("grid gap-2 sm:grid-cols-4", className)}>
      <RecipeMetric
        icon={FlameIcon}
        value={formatMacro(recipe.calories * servings, "")}
        label={rt("nutrition.calories")}
      />
      <RecipeMetric
        value={formatMacro(recipe.protein * servings)}
        label={rt("nutrition.protein")}
      />
      <RecipeMetric
        value={formatMacro(recipe.carbs * servings)}
        label={rt("nutrition.carbs")}
      />
      <RecipeMetric
        value={formatMacro(recipe.fat * servings)}
        label={rt("nutrition.fat")}
      />
      {includeFiber ? (
        <RecipeMetric
          value={formatMacro(recipe.fiber * servings)}
          label={rt("nutrition.fiber")}
        />
      ) : null}
      {includeDetailed ? (
        <>
          <RecipeMetric
            value={formatMacro(recipe.sugar * servings)}
            label={rt("nutrition.sugar")}
          />
          <RecipeMetric
            value={formatMacro(recipe.sodium * servings, "mg")}
            label={rt("nutrition.sodium")}
          />
          {map(micronutrients, ([key, value]) => (
            <RecipeMetric
              key={key}
              value={formatDecimalMetric(toNumber(value) * servings)}
              label={key}
            />
          ))}
        </>
      ) : null}
    </div>
  );
};

export default RecipeNutritionCard;
