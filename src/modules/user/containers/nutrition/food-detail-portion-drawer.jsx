import React from "react";
import {
  DrawerBody,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  CalculatorIcon,
  ChevronDownIcon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  UtensilsIcon,
} from "lucide-react";
import {
  filter,
  isArray,
  map,
  toNumber,
  toPairs,
  trim,
} from "lodash";
import IngredientEditDrawer from "./ingredient-edit-drawer.jsx";
import {
  addMealIngredient,
  getIngredientNutritionPreview,
  getMealIngredientTotals,
  getMealIngredientsGrams,
  normalizeMealIngredients,
  removeMealIngredient,
  updateMealIngredient,
} from "./meal-ingredients.js";
import NutritionPortionControlCard from "./nutrition-portion-control-card.jsx";

const GRAM_BASED_UNITS = new Set(["g", "ml"]);
const DEFAULT_GOALS = {
  protein: 0,
  carbs: 0,
  fat: 0,
};

const normalizeNumber = (value, fallback = 0) => {
  const normalized = toNumber(value);
  return Number.isFinite(normalized) ? normalized : fallback;
};

const formatNumber = (value) => {
  const normalized = normalizeNumber(value);
  return Number.isInteger(normalized)
    ? normalized.toLocaleString("en-US")
    : normalized.toLocaleString("en-US", { maximumFractionDigits: 1 });
};

const formatAmount = (value, unit) => `${formatNumber(value)}${unit || "g"}`;

const getItemUnit = (item) => item?.unit || item?.servingUnit || "g";

export const calculateFoodPortionMacros = (food, amount) => {
  const unit = getItemUnit(food);
  const isUnit = unit && !GRAM_BASED_UNITS.has(unit);
  const factor = isUnit ? amount / (food?.defaultAmount || 1) : amount / 100;

  return {
    cal: Math.round(normalizeNumber(food?.baseCal ?? food?.cal ?? food?.calories) * factor),
    protein: Math.round(
      normalizeNumber(food?.baseProtein ?? food?.protein) * factor,
    ),
    carbs: Math.round(normalizeNumber(food?.baseCarbs ?? food?.carbs) * factor),
    fat: Math.round(normalizeNumber(food?.baseFat ?? food?.fat) * factor),
  };
};

export const getFoodSliderMax = (food) => {
  const unit = getItemUnit(food);
  const isUnit = unit && !GRAM_BASED_UNITS.has(unit);
  return isUnit ? (food?.step || 1) * 20 : 1000;
};

const getIngredientName = (ingredient) =>
  trim(ingredient?.name || ingredient?.label || ingredient?.foodName || "");

const normalizeIngredients = (ingredients, item) =>
  normalizeMealIngredients(
    filter(isArray(ingredients) ? ingredients : item?.ingredients || [], (ingredient) =>
      Boolean(getIngredientName(ingredient))),
  );

const roundAmount = (value) => Math.round(normalizeNumber(value) * 10) / 10;

const scaleIngredientsToTotal = (ingredients, nextTotal, previousTotal) => {
  const normalizedIngredients = normalizeMealIngredients(ingredients);
  if (!normalizedIngredients.length) return normalizedIngredients;

  if (previousTotal <= 0) {
    const sharedAmount = roundAmount(nextTotal / normalizedIngredients.length);
    return map(normalizedIngredients, (ingredient) => ({
      ...ingredient,
      grams: sharedAmount,
    }));
  }

  const ratio = nextTotal / previousTotal;
  return map(normalizedIngredients, (ingredient) => ({
    ...ingredient,
    grams: roundAmount(ingredient.grams * ratio),
  }));
};

const buildIngredientMacros = (totals) => ({
  cal: Math.round(normalizeNumber(totals?.calories, 0)),
  protein: normalizeNumber(totals?.protein, 0),
  carbs: normalizeNumber(totals?.carbs, 0),
  fat: normalizeNumber(totals?.fat, 0),
  fiber: normalizeNumber(totals?.fiber, 0),
});

export default function FoodDetailPortionDrawer({
  item,
  grams,
  goals = DEFAULT_GOALS,
  onGramsChange,
  onSave,
  ingredients,
  isSaving = false,
  saveLabel = "Saqlash",
  macroCalculator = calculateFoodPortionMacros,
  sliderMin,
  sliderMax,
  sliderStep,
  gaugeMax,
}) {
  const unit = getItemUnit(item);
  const propGrams = normalizeNumber(grams, item?.defaultAmount || item?.servingSize || 100);
  const [localGrams, setLocalGrams] = React.useState(propGrams);
  const [editableIngredients, setEditableIngredients] = React.useState(() =>
    normalizeIngredients(ingredients, item),
  );
  const [ingredientsOpen, setIngredientsOpen] = React.useState(false);
  const [ingredientEditor, setIngredientEditor] = React.useState(null);
  const normalizedIngredients = React.useMemo(
    () => normalizeMealIngredients(editableIngredients),
    [editableIngredients],
  );
  const hasIngredients = normalizedIngredients.length > 0;
  const ingredientTotals = React.useMemo(
    () => getMealIngredientTotals(normalizedIngredients),
    [normalizedIngredients],
  );
  const ingredientGrams = React.useMemo(
    () => getMealIngredientsGrams(normalizedIngredients),
    [normalizedIngredients],
  );
  const currentGrams = hasIngredients ? ingredientGrams : localGrams;
  const min = sliderMin ?? (GRAM_BASED_UNITS.has(unit) ? 0 : item?.step ?? 1);
  const max = sliderMax ?? getFoodSliderMax(item);
  const step = sliderStep ?? item?.step ?? (GRAM_BASED_UNITS.has(unit) ? 10 : 1);
  const fallbackMacros = item ? macroCalculator(item, currentGrams) : null;
  const macros = hasIngredients
    ? buildIngredientMacros(ingredientTotals)
    : fallbackMacros;
  const maxForGauge =
    gaugeMax ??
    (hasIngredients
      ? Math.max(
          macros?.cal ?? 0,
          Math.round(
            normalizeNumber(macros?.cal, 0) *
              (max / Math.max(normalizeNumber(currentGrams, 1), 1)),
          ),
        )
      : (item ? macroCalculator(item, max)?.cal : 0)) ??
    0;
  React.useEffect(() => {
    setLocalGrams(propGrams);
  }, [item?.barcode, item?.id, propGrams]);

  React.useEffect(() => {
    setEditableIngredients(normalizeIngredients(ingredients, item));
    setIngredientsOpen(false);
    setIngredientEditor(null);
  }, [ingredients, item?.barcode, item?.id]);

  const syncIngredients = React.useCallback(
    (nextIngredients) => {
      const normalized = normalizeMealIngredients(nextIngredients);
      setEditableIngredients(normalized);
      const nextGrams = getMealIngredientsGrams(normalized);
      setLocalGrams(nextGrams);
      onGramsChange?.(nextGrams);
    },
    [onGramsChange],
  );

  const handleIngredientSave = React.useCallback(
    (ingredient) => {
      const nextIngredients =
        ingredientEditor?.mode === "add"
          ? addMealIngredient(normalizedIngredients, ingredient)
          : updateMealIngredient(
              normalizedIngredients,
              ingredientEditor?.ingredient?.id,
              ingredient,
            );
      setIngredientsOpen(true);
      syncIngredients(nextIngredients);
      setIngredientEditor(null);
    },
    [ingredientEditor, normalizedIngredients, syncIngredients],
  );

  const handleIngredientRemove = React.useCallback(
    (ingredientId) => {
      syncIngredients(removeMealIngredient(normalizedIngredients, ingredientId));
    },
    [normalizedIngredients, syncIngredients],
  );

  const handleSliderChange = React.useCallback(
    ([value]) => {
      const nextGrams = normalizeNumber(value, currentGrams);

      if (hasIngredients) {
        const nextIngredients = scaleIngredientsToTotal(
          normalizedIngredients,
          nextGrams,
          ingredientGrams,
        );
        setEditableIngredients(nextIngredients);
      } else {
        setLocalGrams(nextGrams);
      }

      onGramsChange?.(nextGrams);
    },
    [currentGrams, hasIngredients, ingredientGrams, normalizedIngredients, onGramsChange],
  );

  const handleSave = () => {
    if (!item || !macros) return;
    const ingredientSnapshot = hasIngredients ? normalizedIngredients : [];
    onSave?.({
      item: hasIngredients ? { ...item, ingredients: ingredientSnapshot } : item,
      grams: currentGrams,
      macros,
      ...(hasIngredients ? { ingredients: ingredientSnapshot } : {}),
    });
  };

  return (
    <>
      <DrawerHeader className="items-center text-center md:text-center">
        <DrawerTitle className="max-w-full truncate text-center text-xl font-semibold">
          <span>{item?.name || "Ovqat"}</span>
        </DrawerTitle>
        <DrawerDescription className="text-center">
          Porsiya hajmini tanlang ({unit})
        </DrawerDescription>
      </DrawerHeader>

      {item ? (
        <DrawerBody className="space-y-3 pb-3">
          <NutritionPortionControlCard
            id={item?.barcode || item?.id || "food-detail"}
            macros={macros}
            goals={goals}
            value={currentGrams}
            unit={unit}
            min={min}
            max={max}
            step={step}
            gaugeMax={maxForGauge || macros?.cal || 1}
            onValueChange={handleSliderChange}
            testIdPrefix="food-detail"
            sliderTestId="portion-slider"
          />

          <Collapsible open={ingredientsOpen} onOpenChange={setIngredientsOpen}>
            <div
              data-testid="food-detail-ingredients-card"
              className="rounded-2xl border border-border/60 bg-card px-3 py-3 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <UtensilsIcon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-black text-foreground">
                        Ingredientlar
                      </span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-semibold text-muted-foreground">
                        <span>
                          {normalizedIngredients.length
                            ? `${normalizedIngredients.length} ta`
                            : "Hali ingredient yo'q"}
                        </span>
                        {hasIngredients ? (
                          <>
                            <span>{formatAmount(currentGrams, "g")}</span>
                            <span>{formatNumber(macros?.cal ?? 0)} kcal</span>
                          </>
                        ) : null}
                      </span>
                    </span>
                    <ChevronDownIcon
                      className={cn(
                        "size-4 shrink-0 text-muted-foreground transition-transform",
                        ingredientsOpen ? "rotate-180" : "",
                      )}
                    />
                  </button>
                </CollapsibleTrigger>
              </div>

              <CollapsibleContent>
                <div className="mt-3 space-y-2 border-t border-border/50 pt-3">
                  {map(normalizedIngredients, (ingredient) => {
                      const preview = getIngredientNutritionPreview(ingredient);
                      const name = getIngredientName(ingredient);
                      return (
                        <div
                          key={ingredient.id}
                          className="flex items-center gap-2 rounded-xl border border-border/50 bg-muted/20 px-2.5 py-2"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-bold text-foreground">
                              {name}
                            </div>
                            <div className="mt-0.5 text-xs font-semibold text-muted-foreground">
                              {formatAmount(ingredient.grams, "g")} ·{" "}
                              {formatNumber(preview.calories)} kcal
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-full"
                            aria-label={`${name}ni tahrirlash`}
                            onClick={() =>
                              setIngredientEditor({
                                mode: "edit",
                                ingredient,
                              })
                            }
                          >
                            <PencilIcon className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-full text-destructive hover:text-destructive"
                            aria-label={`${name}ni o'chirish`}
                            onClick={() => handleIngredientRemove(ingredient.id)}
                          >
                            <Trash2Icon className="size-4" />
                          </Button>
                        </div>
                      );
                    })}
                  <button
                    type="button"
                    data-testid="food-detail-add-ingredient-row"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border/70 bg-muted/20 px-3 py-3 text-sm font-bold text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                    onClick={() =>
                      setIngredientEditor({ mode: "add", ingredient: null })
                    }
                  >
                    <PlusIcon className="size-4" />
                    Ingredient qo'shish
                  </button>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {item.vitamins ? (
            <div className="space-y-3 rounded-2xl border border-primary/10 bg-primary/5 p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                <CalculatorIcon className="size-3" />
                Vitaminlar va Minerallar
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                {map(toPairs(item.vitamins), ([name, amount]) => (
                  <div key={name} className="flex items-center justify-between text-xs">
                    <span className="font-medium text-muted-foreground">{name}</span>
                    <span className="font-black text-foreground">{amount}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </DrawerBody>
      ) : null}

      <DrawerFooter>
        <Button className="h-11" disabled={!item || isSaving} onClick={handleSave}>
          {isSaving ? (
            <>
              <Loader2Icon className="mr-2 size-4 animate-spin" />
              Saqlanmoqda
            </>
          ) : (
            saveLabel
          )}
        </Button>
      </DrawerFooter>
      <IngredientEditDrawer
        open={Boolean(ingredientEditor)}
        mode={ingredientEditor?.mode || "edit"}
        ingredient={ingredientEditor?.ingredient || null}
        goals={goals}
        onOpenChange={(open) => {
          if (!open) setIngredientEditor(null);
        }}
        onSave={handleIngredientSave}
      />
    </>
  );
}
