import React from "react";
import groupBy from "lodash/groupBy";
import map from "lodash/map";
import toNumber from "lodash/toNumber";
import { cn } from "@/lib/utils.js";
import NutritionCard from "../../ui/nutrition-card.jsx";
import useRecipeTranslation from "../lib/recipe-i18n.js";

const formatGram = (value) => `${Math.round(toNumber(value) || 0)}g`;

const getIngredientGrams = (ingredient, servings) =>
  (toNumber(ingredient.grams ?? ingredient.estimatedGrams) || 0) * servings;

const formatNumber = (value) => {
  const number = toNumber(value) || 0;
  const rounded = Math.round(number * 10) / 10;

  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
};

const formatDisplayAmount = (ingredient, servings) => {
  const displayAmount = toNumber(
    ingredient.displayAmount ?? ingredient.estimatedQuantity,
  );
  const displayUnit = ingredient.displayUnit || ingredient.estimatedUnit;

  if (Number.isFinite(displayAmount) && displayAmount > 0 && displayUnit) {
    const unit = String(displayUnit).trim();
    const separator = ["g", "kg", "ml", "l"].includes(unit.toLowerCase())
      ? ""
      : " ";

    return `${formatNumber(displayAmount * servings)}${separator}${unit}`;
  }

  return formatGram(getIngredientGrams(ingredient, servings));
};

const getIngredientKey = (ingredient) =>
  String(ingredient.id || ingredient.ingredientId || ingredient.name);

const RecipeIngredientList = ({ ingredients = [], servings = 1 }) => {
  const rt = useRecipeTranslation();
  const [checkedMap, setCheckedMap] = React.useState({});
  const groupedIngredients = React.useMemo(
    () =>
      groupBy(
        ingredients,
        (ingredient) => ingredient.groupName || rt("ingredients.mainGroup"),
      ),
    [ingredients, rt],
  );

  return (
    <NutritionCard className="p-5">
      <h2 className="text-sm font-black uppercase text-muted-foreground">
        {rt("ingredients.title")}
      </h2>
      <div className="mt-3 space-y-4">
        {ingredients.length ? (
          map(groupedIngredients, (groupIngredients, groupName) => (
            <div key={groupName} className="space-y-2">
              <div className="text-xs font-black uppercase text-muted-foreground">
                {groupName}
              </div>
              {map(groupIngredients, (ingredient) => {
                const key = getIngredientKey(ingredient);
                const checked = Boolean(checkedMap[key]);

                return (
                  <label
                    key={key}
                    className="flex items-start justify-between gap-3 rounded-[18px] border border-border/60 bg-background/70 px-3 py-2 text-sm"
                  >
                    <span className="flex min-w-0 items-start gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        className="mt-0.5 size-4 rounded border-border"
                        aria-label={rt("ingredients.readyLabel", {
                          name: ingredient.name,
                        })}
                        onChange={(event) =>
                          setCheckedMap((current) => ({
                            ...current,
                            [key]: event.target.checked,
                          }))
                        }
                      />
                      <span className="min-w-0">
                        <span
                          className={cn(
                            "block truncate font-semibold",
                            checked && "text-muted-foreground line-through",
                          )}
                        >
                          {ingredient.name}
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                          {ingredient.optional ? (
                            <span className="rounded-full bg-muted px-2 py-0.5 font-bold">
                              {rt("ingredients.optional")}
                            </span>
                          ) : null}
                          {ingredient.notes ? (
                            <span>{ingredient.notes}</span>
                          ) : null}
                        </span>
                      </span>
                    </span>
                    <span className="shrink-0 text-muted-foreground">
                      {formatDisplayAmount(ingredient, servings)}
                    </span>
                  </label>
                );
              })}
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            {rt("ingredients.empty")}
          </p>
        )}
      </div>
    </NutritionCard>
  );
};

export default RecipeIngredientList;
