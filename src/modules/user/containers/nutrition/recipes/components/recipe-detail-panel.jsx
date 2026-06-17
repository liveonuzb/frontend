import React from "react";
import { BookmarkIcon, MinusIcon, PlusIcon, UtensilsIcon } from "lucide-react";
import map from "lodash/map";
import slice from "lodash/slice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import EmptyState from "./empty-state.jsx";
import NutritionSummary from "./nutrition-summary.jsx";
import RecipeImage from "./recipe-image.jsx";
import {
  formatQuantity,
  getRecipeNutrition,
} from "../recipe-ui-utils.js";

const TimeInfo = ({ icon: Icon, value, label }) => (
  <div className="flex items-center gap-2 rounded-2xl border border-border bg-background px-3 py-3">
    <Icon className="size-4 text-primary" />
    <div className="min-w-0">
      <div className="text-sm font-semibold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  </div>
);

const RecipeDetailPanel = ({
  recipe,
  servings,
  isUpdating,
  onServingsChange,
  onSave,
  onAdd,
}) => {
  if (!recipe) {
    return (
      <div role="complementary" aria-label="Retsept tafsilotlari" className="min-w-0">
        <EmptyState
          icon={UtensilsIcon}
          title="Retsept tanlang"
          description="Tafsilotlarni ko'rish uchun chap tomondan retsept tanlang"
          className="min-h-[440px]"
        />
      </div>
    );
  }

  const nutrition = getRecipeNutrition(recipe, servings);
  const primaryIngredients = slice(recipe.ingredients || [], 0, 5);

  return (
    <div role="complementary" aria-label="Retsept tafsilotlari" className="min-w-0">
      <Card className="gap-0">
        <CardHeader className="p-3 pb-0">
          <div className="aspect-[16/10] overflow-hidden rounded-xl bg-muted">
            <RecipeImage recipe={recipe} />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold text-foreground">
              {recipe.title}
            </h2>
            <p className="text-sm text-muted-foreground">{recipe.description}</p>
          </div>

          <NutritionSummary nutrition={nutrition} />

          <div className="grid grid-cols-2 gap-2">
            <TimeInfo
              icon={UtensilsIcon}
              value={`${recipe.totalTimeMinutes} daqiqa`}
              label="Tayyorlash vaqti"
            />
            <TimeInfo
              icon={UtensilsIcon}
              value={`${servings} porsiya`}
              label="Porsiya"
            />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background p-2">
            <span className="px-2 text-sm font-medium text-foreground">
              Porsiya soni
            </span>
            <div className="flex items-center">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label="Porsiyani kamaytirish"
                disabled={servings <= 1}
                onClick={() => onServingsChange(Math.max(1, servings - 1))}
              >
                <MinusIcon />
              </Button>
              <span className="min-w-10 text-center text-sm font-semibold">
                {servings}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label="Porsiyani oshirish"
                onClick={() => onServingsChange(servings + 1)}
              >
                <PlusIcon />
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-foreground">
              Asosiy ingredientlar
            </h3>
            <div className="flex flex-col">
              {map(primaryIngredients, (ingredient) => (
                <div
                  key={ingredient.id || ingredient.name}
                  className="flex items-center justify-between gap-3 border-b border-border py-2 text-sm last:border-b-0"
                >
                  <span className="text-foreground">{ingredient.name}</span>
                  <span className="text-muted-foreground">
                    {formatQuantity(
                      ingredient.displayAmount ?? ingredient.quantity,
                      ingredient.displayUnit ?? ingredient.unit,
                      servings,
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Separator />
        </CardContent>
        <CardFooter className="grid grid-cols-2 gap-2 p-4 pt-0">
          <Button
            type="button"
            variant="outline"
            disabled={isUpdating}
            onClick={() => onSave?.(recipe)}
          >
            <BookmarkIcon data-icon="inline-start" />
            Saqlash
          </Button>
          <Button type="button" disabled={isUpdating} onClick={() => onAdd?.(recipe)}>
            <PlusIcon data-icon="inline-start" />
            Qo'shish
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default RecipeDetailPanel;
