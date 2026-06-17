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
  BrainCircuitIcon,
  ChefHatIcon,
  ChevronDownIcon,
  ClockIcon,
  ExternalLinkIcon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  UtensilsIcon,
} from "lucide-react";
import filter from "lodash/filter";
import every from "lodash/every";
import isArray from "lodash/isArray";
import map from "lodash/map";
import toNumber from "lodash/toNumber";
import toPairs from "lodash/toPairs";
import trim from "lodash/trim";
import IngredientEditDrawer from "./ingredient-edit-drawer.jsx";
import {
  GRAM_BASED_UNITS,
  calculateFoodPortionMacros,
  getFoodItemUnit as getItemUnit,
  getFoodSliderMax,
  normalizeNutritionNumber as normalizeNumber,
} from "./food-portion-utils.js";
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
import { useNutritionAiPantry } from "@/hooks/app/use-nutrition-ai.js";

const DEFAULT_GOALS = {
  protein: 0,
  carbs: 0,
  fat: 0,
};
const NUTRITION_VALUE_KEYS = ["cal", "protein", "carbs", "fat", "fiber"];

const formatNumber = (value) => {
  const normalized = normalizeNumber(value);
  return Number.isInteger(normalized)
    ? normalized.toLocaleString("en-US")
    : normalized.toLocaleString("en-US", { maximumFractionDigits: 1 });
};

const formatAmount = (value, unit) => `${formatNumber(value)}${unit || "g"}`;

const getIngredientName = (ingredient) =>
  trim(ingredient?.name || ingredient?.label || ingredient?.foodName || "");

const normalizeIngredients = (ingredients, item) =>
  normalizeMealIngredients(
    filter(
      isArray(ingredients) ? ingredients : item?.ingredients || [],
      (ingredient) => Boolean(getIngredientName(ingredient)),
    ),
  );

const normalizeRecipeInstructions = (item) => {
  const instructions = isArray(item?.recipeInstructions)
    ? item.recipeInstructions
    : isArray(item?.instructions)
      ? item.instructions
      : [];

  return instructions
    .map((instruction, index) => {
      const body = trim(instruction?.body || instruction?.text || "");
      if (!body) return null;
      const mediaUrl = trim(instruction?.mediaUrl || "");

      return {
        id:
          instruction?.id ||
          `${item?.id || item?.barcode || "food"}-${index + 1}`,
        stepNumber: normalizeNumber(instruction?.stepNumber, index + 1),
        title: trim(instruction?.title || ""),
        body,
        durationMinutes: normalizeNumber(instruction?.durationMinutes, 0),
        mediaUrl: mediaUrl || null,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.stepNumber - b.stepNumber);
};

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

const isNonNegativeFinite = (value) => {
  if (value == null) return true;
  const normalized = toNumber(value);
  return Number.isFinite(normalized) && normalized >= 0;
};

const getCatalogFoodId = (item) => {
  const direct = toNumber(item?.catalogFoodId ?? item?.foodId);
  if (Number.isFinite(direct) && direct > 0) return direct;

  const match = String(item?.barcode || item?.id || "").match(/food[:/-](\d+)/i);
  return match ? toNumber(match[1]) : 0;
};

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
  const propGrams = normalizeNumber(
    grams,
    item?.defaultAmount || item?.servingSize || 100,
  );
  const [localGrams, setLocalGrams] = React.useState(propGrams);
  const [editableIngredients, setEditableIngredients] = React.useState(() =>
    normalizeIngredients(ingredients, item),
  );
  const [ingredientsOpen, setIngredientsOpen] = React.useState(false);
  const [instructionsOpen, setInstructionsOpen] = React.useState(false);
  const [ingredientEditor, setIngredientEditor] = React.useState(null);
  const [assistantCards, setAssistantCards] = React.useState([]);
  const { getRecipeAssistant, isRecipeAssistantPending } =
    useNutritionAiPantry({ enabled: false });
  const normalizedIngredients = React.useMemo(
    () => normalizeMealIngredients(editableIngredients),
    [editableIngredients],
  );
  const recipeInstructions = React.useMemo(
    () => normalizeRecipeInstructions(item),
    [item],
  );
  const catalogFoodId = React.useMemo(() => getCatalogFoodId(item), [item]);
  const hasIngredients = normalizedIngredients.length > 0;
  const hasRecipeInstructions = recipeInstructions.length > 0;
  const ingredientTotals = React.useMemo(
    () => getMealIngredientTotals(normalizedIngredients),
    [normalizedIngredients],
  );
  const ingredientGrams = React.useMemo(
    () => getMealIngredientsGrams(normalizedIngredients),
    [normalizedIngredients],
  );
  const currentGrams = hasIngredients ? ingredientGrams : localGrams;
  const min = sliderMin ?? (GRAM_BASED_UNITS.has(unit) ? 0 : (item?.step ?? 1));
  const max = sliderMax ?? getFoodSliderMax(item);
  const step =
    sliderStep ?? item?.step ?? (GRAM_BASED_UNITS.has(unit) ? 10 : 1);
  const fallbackMacros = item ? macroCalculator(item, currentGrams) : null;
  const macros = hasIngredients
    ? buildIngredientMacros(ingredientTotals)
    : fallbackMacros;
  const validationMessage = React.useMemo(() => {
    const servingAmount = toNumber(currentGrams);
    if (!Number.isFinite(servingAmount) || servingAmount <= 0) {
      return "Porsiya hajmi 0 dan katta bo'lishi kerak.";
    }

    if (
      !macros ||
      !every(NUTRITION_VALUE_KEYS, (key) => isNonNegativeFinite(macros[key]))
    ) {
      return "Kaloriya va makro qiymatlar 0 yoki undan katta bo'lishi kerak.";
    }

    return null;
  }, [currentGrams, macros]);
  const canSave = Boolean(item && !isSaving && !validationMessage);
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
      : item
        ? macroCalculator(item, max)?.cal
        : 0) ??
    0;
  React.useEffect(() => {
    let isCancelled = false;
    queueMicrotask(() => {
      if (!isCancelled) {
        setLocalGrams(propGrams);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [item?.barcode, item?.id, propGrams]);

  React.useEffect(() => {
    let isCancelled = false;
    queueMicrotask(() => {
      if (isCancelled) return;
      setEditableIngredients(normalizeIngredients(ingredients, item));
      setIngredientsOpen(false);
      setInstructionsOpen(false);
      setIngredientEditor(null);
      setAssistantCards([]);
    });

    return () => {
      isCancelled = true;
    };
  }, [ingredients, item?.barcode, item?.id]);

  const syncIngredients = (nextIngredients) => {
    const normalized = normalizeMealIngredients(nextIngredients);
    setEditableIngredients(normalized);
    const nextGrams = getMealIngredientsGrams(normalized);
    setLocalGrams(nextGrams);
    onGramsChange?.(nextGrams);
  };

  const handleIngredientSave = (ingredient) => {
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
  };

  const handleIngredientRemove = (ingredientId) => {
    syncIngredients(removeMealIngredient(normalizedIngredients, ingredientId));
  };

  const handleSliderChange = ([value]) => {
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
  };

  const handleSave = () => {
    if (!item || !macros || validationMessage) return;
    const ingredientSnapshot = hasIngredients ? normalizedIngredients : [];
    onSave?.({
      item: hasIngredients
        ? { ...item, ingredients: ingredientSnapshot }
        : item,
      grams: currentGrams,
      macros,
      ...(hasIngredients ? { ingredients: ingredientSnapshot } : {}),
    });
  };

  const handleRecipeAssistant = async () => {
    if (!catalogFoodId) return;
    const result = await getRecipeAssistant({ foodId: catalogFoodId });
    setAssistantCards(result?.cards || []);
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
              className="rounded-2xl border border-border/60 bg-card p-3 shadow-sm"
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
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border/70 bg-muted/20 p-3 text-sm font-bold text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
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

          {hasRecipeInstructions ? (
            <Collapsible
              open={instructionsOpen}
              onOpenChange={setInstructionsOpen}
            >
              <div
                data-testid="food-detail-instructions-card"
                className="rounded-2xl border border-border/60 bg-card p-3 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <ChefHatIcon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-black text-foreground">
                          Tayyorlash qadamlari
                        </span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-semibold text-muted-foreground">
                          <span>{recipeInstructions.length} qadam</span>
                          {recipeInstructions.some(
                            (instruction) => instruction.durationMinutes > 0,
                          ) ? (
                            <span>
                              {formatNumber(
                                recipeInstructions.reduce(
                                  (total, instruction) =>
                                    total + instruction.durationMinutes,
                                  0,
                                ),
                              )}{" "}
                              daqiqa
                            </span>
                          ) : null}
                        </span>
                      </span>
                      <ChevronDownIcon
                        className={cn(
                          "size-4 shrink-0 text-muted-foreground transition-transform",
                          instructionsOpen ? "rotate-180" : "",
                        )}
                      />
                    </button>
                  </CollapsibleTrigger>
                </div>

                <CollapsibleContent>
                  <div className="mt-3 space-y-2 border-t border-border/50 pt-3">
                    {map(recipeInstructions, (instruction) => (
                      <div
                        key={instruction.id}
                        className="flex gap-3 rounded-xl border border-border/50 bg-muted/20 px-3 py-2.5"
                      >
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-black text-primary-foreground">
                          {instruction.stepNumber}
                        </div>
                        <div className="min-w-0 flex-1">
                          {instruction.title ? (
                            <div className="text-sm font-black text-foreground">
                              {instruction.title}
                            </div>
                          ) : null}
                          <div className="text-sm font-semibold leading-5 text-foreground">
                            {instruction.body}
                          </div>
                          {instruction.durationMinutes > 0 ? (
                            <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                              <ClockIcon className="size-3" />
                              {formatNumber(instruction.durationMinutes)} daqiqa
                            </div>
                          ) : null}
                          {instruction.mediaUrl ? (
                            <a
                              href={instruction.mediaUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 inline-flex max-w-full items-center gap-1 rounded-md text-xs font-bold text-primary underline-offset-2 hover:underline"
                            >
                              <ExternalLinkIcon className="size-3 shrink-0" />
                              <span className="truncate">Media qo'llanma</span>
                            </a>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ) : null}

          <div
            data-testid="food-detail-ai-assistant-card"
            className="rounded-2xl border border-border/60 bg-card p-3 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <BrainCircuitIcon className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-black text-foreground">
                    AI yordamchi
                  </p>
                  <p className="truncate text-[11px] font-semibold text-muted-foreground">
                    Ombor va recipe kontekst
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!catalogFoodId || isRecipeAssistantPending}
                onClick={handleRecipeAssistant}
              >
                {isRecipeAssistantPending ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <BrainCircuitIcon data-icon="inline-start" />
                )}
                AI yordamchi
              </Button>
            </div>
            {assistantCards.length > 0 ? (
              <div className="mt-3 grid gap-2 border-t border-border/50 pt-3">
                {map(assistantCards, (card) => (
                  <div
                    key={card.type}
                    className="rounded-xl border border-border/50 bg-muted/20 px-3 py-2"
                  >
                    <p className="text-xs font-black uppercase text-muted-foreground">
                      {card.title || card.type}
                    </p>
                    <div className="mt-1.5 grid gap-1">
                      {map(card.items || [], (assistantItem, index) => (
                        <p
                          key={`${card.type}-${assistantItem.ingredientId || assistantItem.stepNumber || index}`}
                          className="text-sm font-semibold text-foreground"
                        >
                          {assistantItem.name ||
                            assistantItem.body ||
                            assistantItem.title ||
                            `#${index + 1}`}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {item.vitamins ? (
            <div className="space-y-3 rounded-2xl border border-primary/10 bg-primary/5 p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                <CalculatorIcon className="size-3" />
                Vitaminlar va Minerallar
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                {map(toPairs(item.vitamins), ([name, amount]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="font-medium text-muted-foreground">
                      {name}
                    </span>
                    <span className="font-black text-foreground">{amount}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </DrawerBody>
      ) : null}

      <DrawerFooter>
        {validationMessage ? (
          <p role="alert" className="px-1 text-sm font-semibold text-destructive">
            {validationMessage}
          </p>
        ) : null}
        <Button
          className="h-11"
          disabled={!canSave}
          onClick={handleSave}
        >
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
