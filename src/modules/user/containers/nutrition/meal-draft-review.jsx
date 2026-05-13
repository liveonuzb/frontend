import React from "react";
import {
  CheckIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button.jsx";
import GaugeProgress from "@/components/meal-plan-builder/gauge-progress.jsx";
import IngredientEditDrawer from "./ingredient-edit-drawer.jsx";
import {
  formatIngredientHint,
  getIngredientNutritionPreview,
  normalizeMealIngredients,
  toNumber,
} from "./meal-ingredients.js";
import {
  formatConfidence,
  getDraftImageUrl,
  getDraftMaxCalories,
  getDraftTotals,
} from "./meal-draft-review-utils.js";

export const MealDraftSummaryCard = ({
  items,
  goals,
  emptyTitle = "Ovqat topilmadi",
  emptyDescription = "Qayta urinib ko'ring.",
}) => {
  const totals = React.useMemo(() => getDraftTotals(items), [items]);
  const maxPreviewCalories = React.useMemo(
    () => getDraftMaxCalories(items),
    [items],
  );
  const calorieGoal = toNumber(goals?.calories, 0) || maxPreviewCalories || 1;

  return (
    <div className="rounded-3xl border bg-card p-3.5">
      {items.length > 0 ? (
        <div className="grid grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)] items-center gap-3">
          <div className="min-w-0 [&>div]:max-w-none [&>div]:pt-0">
            <GaugeProgress
              value={totals.calories}
              min={0}
              max={Math.max(calorieGoal, totals.calories, 1)}
              id="meal-draft-summary"
              label="JAMI"
            />
          </div>

          <div className="min-w-0 space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Macro
              </div>
              <div className="text-xs text-muted-foreground">
                {calorieGoal} kcal
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <div className="rounded-2xl bg-muted/40 px-2.5 py-2">
                <div className="text-[10px] text-muted-foreground">Oqsil</div>
                <div className="mt-0.5 text-sm font-black">
                  {totals.protein} g
                </div>
              </div>
              <div className="rounded-2xl bg-muted/40 px-2.5 py-2">
                <div className="text-[10px] text-muted-foreground">Uglevod</div>
                <div className="mt-0.5 text-sm font-black">
                  {totals.carbs} g
                </div>
              </div>
              <div className="rounded-2xl bg-muted/40 px-2.5 py-2">
                <div className="text-[10px] text-muted-foreground">Yog'</div>
                <div className="mt-0.5 text-sm font-black">{totals.fat} g</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-1 py-2">
          <h3 className="text-sm font-semibold">{emptyTitle}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {emptyDescription}
          </p>
        </div>
      )}
    </div>
  );
};

const getIngredientBadge = (ingredient = {}) => {
  // Camera-scan ingredients are always AI-estimated. The only other source
  // that survives into review is the manual-edit drawer (commitEditedIngredient
  // sets matchStatus: "manual"), which we surface as a plain "Manual" tag.
  if (
    ingredient.matchStatus === "manual" ||
    ingredient.nutritionSource === "manual"
  ) {
    return {
      label: "Manual",
      className: "bg-muted text-muted-foreground",
    };
  }

  if (
    ingredient.matchStatus === "ai-estimated" ||
    ingredient.nutritionSource === "ai"
  ) {
    return {
      label: "AI",
      className: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
    };
  }

  return null;
};

const IngredientCompactRow = ({ ingredient, onEdit, onDelete }) => {
  const hint = React.useMemo(
    () => formatIngredientHint(ingredient),
    [ingredient],
  );
  const badge = getIngredientBadge(ingredient);
  const preview = React.useMemo(
    () => getIngredientNutritionPreview(ingredient),
    [ingredient],
  );

  return (
    <div className="rounded-2xl border border-border/50 bg-background/55 px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <p className="min-w-0 truncate text-sm font-semibold">
              {ingredient.name}
            </p>
            {badge ? (
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.className}`}
              >
                {badge.label}
              </span>
            ) : null}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="font-semibold tabular-nums text-foreground">
              {Math.round(toNumber(ingredient.grams, 0))} g
            </span>
            {preview.calories > 0 ? (
              <span className="font-semibold tabular-nums text-foreground">
                · {preview.calories} kcal
              </span>
            ) : null}
            {hint ? <span>{hint}</span> : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 rounded-full px-2.5 text-xs"
            onClick={onEdit}
          >
            <PencilIcon className="size-3.5" />
            Edit
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="rounded-full text-destructive hover:text-destructive"
            onClick={onDelete}
            aria-label={`${ingredient.name} ingredientini o'chirish`}
          >
            <Trash2Icon className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export const MealDraftCard = ({
  item,
  onIngredientUpdate,
  onIngredientRemove,
  onIngredientAdd,
  onRemove,
  onConfirm,
}) => {
  const [ingredientEditor, setIngredientEditor] = React.useState(null);
  const imageUrl = React.useMemo(() => getDraftImageUrl(item), [item]);
  const ingredientCount = Array.isArray(item?.ingredients)
    ? item.ingredients.length
    : 0;
  const normalizedIngredients = React.useMemo(
    () => normalizeMealIngredients(item?.ingredients),
    [item?.ingredients],
  );
  const closeIngredientEditor = React.useCallback(() => {
    setIngredientEditor(null);
  }, []);
  const handleSaveIngredient = React.useCallback(
    (ingredient) => {
      if (ingredientEditor?.mode === "add") {
        onIngredientAdd?.(ingredient);
        return;
      }

      onIngredientUpdate?.(ingredient.id, ingredient);
    },
    [ingredientEditor?.mode, onIngredientAdd, onIngredientUpdate],
  );
  const handleDeleteIngredient = React.useCallback(
    (ingredientId) => {
      onIngredientRemove?.(ingredientId);
    },
    [onIngredientRemove],
  );

  return (
    <div className="rounded-[1.35rem] border bg-card p-3.5">
      <div className="flex items-start gap-3">
        <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted/30">
          {imageUrl ? (
            <img loading="lazy"
              src={imageUrl}
              alt={item?.title || "Ovqat"}
              className="size-full object-cover"
            />
          ) : (
            <span className="text-lg">🍽️</span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-[17px] font-bold text-foreground">
              {item?.title || "Ovqat"}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="rounded-full bg-primary/8 px-2 py-0.5 font-medium text-primary">
                {formatConfidence(item?.confidence)} AI
              </span>
              {ingredientCount > 0 ? (
                <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground">
                  {ingredientCount} ta ingredient
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {onConfirm ? (
              <Button
                variant="ghost"
                size="icon-xs"
                className="mt-0.5 rounded-full text-emerald-600"
                onClick={onConfirm}
              >
                <CheckIcon className="size-3.5" />
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="icon-xs"
              className="mt-0.5 rounded-full"
              onClick={onRemove}
            >
              <XIcon className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-2.5">
        <div className="rounded-2xl border border-border/50 bg-muted/10 p-2.5">
          <div className="mb-2 flex items-center justify-between gap-2 px-1">
            <div>
              <p className="text-sm font-semibold">Ingredientlar</p>
              <p className="text-[11px] text-muted-foreground">
                Porsiya va macro qiymatlar alohida drawerda tahrirlanadi.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 shrink-0 rounded-full px-3 text-xs"
              onClick={() =>
                setIngredientEditor({ mode: "add", ingredient: null })
              }
            >
              <PlusIcon className="size-3.5" />
              Qo'shish
            </Button>
          </div>

          {normalizedIngredients.length > 0 ? (
            <div className="space-y-2">
              {normalizedIngredients.map((ingredient) => (
                <IngredientCompactRow
                  key={ingredient.id}
                  ingredient={ingredient}
                  onEdit={() =>
                    setIngredientEditor({ mode: "edit", ingredient })
                  }
                  onDelete={() => handleDeleteIngredient(ingredient.id)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed bg-background/60 px-4 py-4 text-sm text-muted-foreground">
              Ingredientlar topilmadi. Kerak bo'lsa ingredientni qo'lda qo'shing
              yoki AI bilan macro qiymatlarni toping.
            </div>
          )}
        </div>
      </div>

      <IngredientEditDrawer
        open={Boolean(ingredientEditor)}
        mode={ingredientEditor?.mode || "edit"}
        ingredient={ingredientEditor?.ingredient}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            closeIngredientEditor();
          }
        }}
        onSave={handleSaveIngredient}
      />
    </div>
  );
};
