import React from "react";
import { Link } from "react-router";
import { ClockIcon, FlameIcon, StarIcon, UtensilsIcon } from "lucide-react";
import toNumber from "lodash/toNumber";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils.js";
import NutritionCard from "../../ui/nutrition-card.jsx";
import FavoriteButton from "./favorite-button.jsx";
import RecipeMetric from "./recipe-metric.jsx";
import useRecipeTranslation from "../lib/recipe-i18n.js";

const formatMacro = (value, unit = "g") =>
  `${Math.round(toNumber(value) || 0)}${unit}`;

const formatRating = (value) => {
  const rating = toNumber(value);
  return rating ? rating.toFixed(1) : "0.0";
};

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

const RecipeCard = ({
  recipe,
  isSelected,
  onSelect,
  onFavorite,
  isUpdating,
}) => {
  const rt = useRecipeTranslation();

  return (
    <NutritionCard
      as="article"
      className={cn(
        "grid gap-4 p-3 sm:grid-cols-[132px_minmax(0,1fr)]",
        isSelected && "border-primary/40 bg-primary/5",
      )}
    >
      <button
        type="button"
        className="block aspect-[4/3] overflow-hidden rounded-[22px] border border-border/60 text-left"
        onClick={() => onSelect(recipe)}
      >
        <RecipeImage recipe={recipe} />
      </button>
      <div className="min-w-0">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <button
            type="button"
            aria-label={recipe.title}
            className="min-w-0 text-left"
            onClick={() => onSelect(recipe)}
          >
            <h3 className="line-clamp-2 text-base font-black tracking-normal text-foreground">
              {recipe.title}
            </h3>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">
              {recipe.servingLabel}
            </p>
          </button>
          <FavoriteButton
            isFavorite={recipe.isFavorite}
            isUpdating={isUpdating}
            onClick={() => onFavorite(recipe)}
          />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <RecipeMetric
            icon={FlameIcon}
            value={formatMacro(recipe.calories, "")}
            label={rt("nutrition.calories")}
          />
          <RecipeMetric
            value={formatMacro(recipe.protein)}
            label={rt("nutrition.protein")}
          />
          <RecipeMetric
            value={formatMacro(recipe.carbs)}
            label={rt("nutrition.carbs")}
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {recipe.totalTimeMinutes ? (
            <Badge variant="outline">
              <ClockIcon className="size-3" />
              {rt("common.minutes", { count: recipe.totalTimeMinutes })}
            </Badge>
          ) : null}
          {recipe.difficulty ? (
            <Badge variant="outline">{recipe.difficulty}</Badge>
          ) : null}
          {recipe.ratingAverage ? (
            <Badge variant="outline">
              <StarIcon className="size-3" />
              {formatRating(recipe.ratingAverage)}
            </Badge>
          ) : null}
          <Badge variant="outline">
            {rt("card.ingredientsCount", { count: recipe.ingredientsCount })}
          </Badge>
          <Badge variant="outline">
            {rt("card.stepsCount", { count: recipe.stepsCount })}
          </Badge>
          <Link
            to={`/user/nutrition/recipes/${recipe.catalogFoodId}`}
            aria-label={rt("card.detailAria", { title: recipe.title })}
            className="ml-auto inline-flex h-7 items-center rounded-full px-2 text-xs font-black text-primary hover:bg-primary/10"
          >
            {rt("card.detail")}
          </Link>
        </div>
      </div>
    </NutritionCard>
  );
};

export default RecipeCard;
