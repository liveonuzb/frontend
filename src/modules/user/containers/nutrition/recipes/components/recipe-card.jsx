import React from "react";
import {
  BookmarkIcon,
  ClockIcon,
  HeartIcon,
  InfoIcon,
  PlusIcon,
} from "lucide-react";
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
}) => (
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
            {recipe.totalTimeMinutes} min
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
        <RecipeStat value={Math.round(recipe.caloriesPerServing ?? recipe.calories)} label="kkal" />
        <RecipeStat value={`${Math.round(recipe.proteinPerServing ?? recipe.protein)}g`} label="Protein" />
        <RecipeStat value={`${recipe.totalTimeMinutes} min`} label="Vaqt" />
        <RecipeStat value={recipe.servings} label="Porsiya" />
      </div>
    </CardContent>
    <CardFooter className="grid grid-cols-3 gap-2 border-t p-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onDetail?.(recipe)}
      >
        <InfoIcon data-icon="inline-start" />
        Detail
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isUpdating}
        onClick={() => onSave?.(recipe)}
      >
        <BookmarkIcon data-icon="inline-start" />
        Saqlash
      </Button>
      <Button
        type="button"
        size="sm"
        disabled={isUpdating}
        onClick={() => onAdd?.(recipe)}
      >
        <PlusIcon data-icon="inline-start" />
        Qo'shish
      </Button>
    </CardFooter>
  </Card>
);

export default RecipeCard;
