import React from "react";
import {
  BookmarkIcon,
  ClockIcon,
  HeartIcon,
  InfoIcon,
  PackageCheckIcon,
  TriangleAlertIcon,
  PlusIcon,
} from "lucide-react";
import first from "lodash/first";
import join from "lodash/join";
import map from "lodash/map";
import size from "lodash/size";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils.js";
import RecipeImage from "./recipe-image.jsx";
import useRecipeTranslation from "../lib/recipe-i18n.js";

const RecipeStat = ({ value, label }) => (
  <div className="min-w-0 text-center">
    <div className="truncate text-sm font-semibold text-foreground">{value}</div>
    <div className="mt-0.5 truncate text-xs text-muted-foreground">{label}</div>
  </div>
);

const RecipeCard = ({
  recipe,
  isSelected,
  isUpdating,
  onSelect,
  onFavorite,
  onSave,
  onAdd,
  onDetail,
}) => {
  const rt = useRecipeTranslation();
  const minutesShort = rt("common.minutesShort");
  const pantryMatch = recipe.pantryMatch;
  const expiringItem = first(pantryMatch?.expiringItems || []);
  const substitution = first(pantryMatch?.substitutions || []);

  return (
    <Card
      className={cn(
        "gap-0 transition-colors",
        isSelected && "ring-primary",
      )}
    >
      <CardHeader className="p-3 pb-0">
        <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-muted">
          <button
            type="button"
            aria-label={recipe.title}
            className="block size-full text-left"
            onClick={() => onSelect?.(recipe)}
          >
            <RecipeImage recipe={recipe} />
          </button>
          {recipe.totalTimeMinutes ? (
            <Badge
              variant="secondary"
              className="absolute left-2 top-2 gap-1 bg-background/90"
            >
              <ClockIcon className="size-3" />
              {recipe.totalTimeMinutes} {minutesShort}
            </Badge>
          ) : null}
          <Button
            type="button"
            variant={recipe.isFavorite ? "default" : "outline"}
            size="icon-sm"
            aria-label={
              recipe.isFavorite
                ? `${recipe.title} sevimlilardan olib tashlash`
                : `${recipe.title} sevimlilarga qo'shish`
            }
            aria-pressed={Boolean(recipe.isFavorite)}
            className="absolute right-2 top-2 bg-background/90"
            disabled={isUpdating}
            onClick={() => onFavorite?.(recipe)}
          >
            <HeartIcon className={cn("size-4", recipe.isFavorite && "fill-current")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 p-3">
        <button
          type="button"
          className="min-w-0 text-left"
          onClick={() => onSelect?.(recipe)}
        >
          <CardTitle className="truncate text-base font-semibold">
            {recipe.title}
          </CardTitle>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {recipe.description}
          </p>
        </button>
        <div className="grid grid-cols-4 gap-2">
          <RecipeStat value={Math.round(recipe.caloriesPerServing ?? recipe.calories)} label={rt("nutrition.calories")} />
          <RecipeStat value={`${Math.round(recipe.proteinPerServing ?? recipe.protein)}g`} label={rt("nutrition.protein")} />
          <RecipeStat value={`${recipe.totalTimeMinutes} ${minutesShort}`} label="Vaqt" />
          <RecipeStat value={recipe.servings} label="Porsiya" />
        </div>
        {pantryMatch?.requiredCount ? (
          <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-muted/30 p-2">
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={pantryMatch.hasAllRequired ? "secondary" : "outline"}
                className="gap-1"
              >
                <PackageCheckIcon className="size-3" />
                Ombor {pantryMatch.matchedCount}/{pantryMatch.requiredCount}
              </Badge>
              {expiringItem ? (
                <Badge variant="outline" className="gap-1 text-amber-700">
                  <TriangleAlertIcon className="size-3" />
                  Tez ishlating: {expiringItem.name}
                </Badge>
              ) : null}
            </div>
            {substitution ? (
              <p className="line-clamp-2 text-xs text-muted-foreground">
                Almashtirish: {substitution.missingName} o'rniga{" "}
                {join(map(substitution.suggestionNames, String), ", ")}
              </p>
            ) : null}
            {!size(pantryMatch.missingIngredients) &&
            pantryMatch.hasAllRequired ? (
              <p className="text-xs font-semibold text-primary">
                Kerakli ingredientlar omborda bor
              </p>
            ) : null}
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="grid grid-cols-3 gap-2 border-t p-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={rt("card.detailAria", { title: recipe.title })}
          onClick={() => onDetail?.(recipe)}
        >
          <InfoIcon data-icon="inline-start" />
          {rt("card.detail")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isUpdating}
          onClick={() => onSave?.(recipe)}
        >
          <BookmarkIcon data-icon="inline-start" />
          {rt("buttons.save")}
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={isUpdating}
          onClick={() => onAdd?.(recipe)}
        >
          <PlusIcon data-icon="inline-start" />
          {rt("buttons.add")}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RecipeCard;
