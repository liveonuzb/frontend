import React from "react";
import {
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Slider } from "@/components/ui/slider.jsx";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";
import { NutritionDrawerContent } from "./nutrition-drawer-layout.jsx";
import { Loader2Icon, SparklesIcon } from "lucide-react";
import { toast } from "sonner";
import { useFoodScan } from "@/hooks/app/use-food-catalog";
import { AiAccessStatusText } from "@/components/ai-access";
import {
  getAiAccessStatus,
  isAiAccessLimitError,
  useAiAccessStatus,
} from "@/hooks/app/use-ai-access";
import {
  commitEditedIngredient,
  createMealIngredientId,
  getIngredientNutritionPreview,
  normalizeIngredientForEdit,
  normalizeMealNutrition,
  toNumber,
} from "./meal-ingredients.js";
import NutritionPortionControlCard from "./nutrition-portion-control-card.jsx";

import map from "lodash/map";
import lodashToNumber from "lodash/toNumber";
import trim from "lodash/trim";

const emptyIngredient = {
  id: "",
  name: "",
  grams: 100,
  baseGrams: 100,
  estimatedGrams: 100,
  estimatedQuantity: null,
  estimatedUnit: null,
  nutritionSource: "manual",
  matchStatus: "manual",
  reviewNeeded: false,
  matchedFood: null,
  nutrition: {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
  },
};

const DEFAULT_GOALS = {
  protein: 0,
  carbs: 0,
  fat: 0,
};

const macroFields = [
  ["calories", "Kcal", 1, 0],
  ["protein", "Oqsil", 0.1, 1],
  ["carbs", "Uglevod", 0.1, 1],
  ["fat", "Yog'", 0.1, 1],
  ["fiber", "Fiber", 0.1, 1],
];

const getSliderMax = (grams) =>
  Math.max(300, Math.ceil((Math.max(1, lodashToNumber(grams) || 100) * 2) / 10) * 10);

const createEmptyIngredientDraft = () =>
  normalizeIngredientForEdit({
    ...emptyIngredient,
    id: createMealIngredientId(),
  });

const MacroOverrideFields = ({ preview, onChange }) => (
  <div className="grid grid-cols-2 gap-3">
    {map(macroFields, ([key, label, step, maximumFractionDigits]) => (
      <label key={key} className="space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
        <NumberField
          value={preview[key]}
          onValueChange={(value) => onChange(key, value)}
          minValue={0}
          step={step}
          formatOptions={{ maximumFractionDigits }}
        >
          <NumberFieldGroup className="h-11 rounded-2xl bg-background shadow-none">
            <NumberFieldDecrement className="w-8 border-r-border/50" />
            <NumberFieldInput className="text-center text-sm font-semibold" />
            <NumberFieldIncrement className="w-8 border-l-border/50" />
          </NumberFieldGroup>
        </NumberField>
      </label>
    ))}
  </div>
);

const IngredientServingFields = ({ draft, onQuantityChange, onUnitChange }) => (
  <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-3 rounded-3xl border bg-muted/15 p-3">
    <label className="space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">
        Birlik miqdori
      </span>
      <NumberField
        value={draft.estimatedQuantity ?? 0}
        onValueChange={onQuantityChange}
        minValue={0}
        step={0.25}
        formatOptions={{ maximumFractionDigits: 2 }}
      >
        <NumberFieldGroup className="h-11 rounded-2xl bg-background shadow-none">
          <NumberFieldDecrement className="w-8 border-r-border/50" />
          <NumberFieldInput className="text-center text-sm font-semibold" />
          <NumberFieldIncrement className="w-8 border-l-border/50" />
        </NumberFieldGroup>
      </NumberField>
    </label>
    <label className="space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">Birlik</span>
      <Input
        value={draft.estimatedUnit || ""}
        onChange={(event) => onUnitChange(event.target.value)}
        placeholder="dona"
        className="h-11 rounded-2xl bg-background"
      />
    </label>
  </div>
);

export default function IngredientEditDrawer({
  open,
  mode = "edit",
  ingredient,
  goals = DEFAULT_GOALS,
  onOpenChange,
  onSave,
}) {
  const isAddMode = mode === "add";
  const { analyzeIngredient, isAnalyzingIngredient } = useFoodScan();
  const { access: aiAccess } = useAiAccessStatus({
    enabled: open && isAddMode,
  });
  const aiAccessStatus = getAiAccessStatus({
    access: aiAccess,
  });
  const [draft, setDraft] = React.useState(() =>
    ingredient
      ? normalizeIngredientForEdit(ingredient)
      : createEmptyIngredientDraft(),
  );

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (!open) return;
    setDraft(
      ingredient
        ? normalizeIngredientForEdit(ingredient)
        : createEmptyIngredientDraft(),
    );
  }, [ingredient, open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const preview = React.useMemo(
    () => getIngredientNutritionPreview(draft),
    [draft],
  );
  const previewMacros = React.useMemo(
    () => ({
      cal: preview.calories,
      protein: preview.protein,
      carbs: preview.carbs,
      fat: preview.fat,
      fiber: preview.fiber,
    }),
    [preview],
  );
  const editGaugeMax = React.useMemo(() => {
    const calories = Math.max(0, toNumber(preview.calories, 0));
    const grams = Math.max(1, toNumber(draft.grams, 100));
    return Math.max(calories, Math.round(calories * (1000 / grams)), 1);
  }, [draft.grams, preview.calories]);
  const sliderMax = React.useMemo(
    () => getSliderMax(draft.grams),
    [draft.grams],
  );

  const setMacroValue = React.useCallback((key, value) => {
    setDraft((current) => {
      const grams = Math.max(1, toNumber(current.grams, 100));
      const currentPreview = getIngredientNutritionPreview(current);
      return {
        ...current,
        baseGrams: grams,
        estimatedGrams: grams,
        nutrition: normalizeMealNutrition({
          ...currentPreview,
          [key]: toNumber(value, 0),
        }),
        nutritionSource: "manual",
        matchStatus: current.matchStatus || "manual",
      };
    });
  }, []);

  const setServingQuantity = React.useCallback((value) => {
    setDraft((current) => ({
      ...current,
      estimatedQuantity: value == null ? null : Math.max(0, toNumber(value, 0)),
    }));
  }, []);

  const setServingUnit = React.useCallback((value) => {
    setDraft((current) => ({
      ...current,
      estimatedUnit: trim(value) || null,
    }));
  }, []);

  const handleAnalyze = React.useCallback(async () => {
    const name = trim(draft.name);
    if (!name) {
      toast.error("Ingredient nomini yozing.");
      return;
    }
    if (aiAccessStatus.isDisabled) {
      toast.error("Bugungi AI limitingiz tugagan. Keyinroq qayta urinib ko'ring.");
      return;
    }

    try {
      const analyzed = await analyzeIngredient({
        name,
        grams: Math.max(1, Math.round(toNumber(draft.grams, 100))),
      });
      setDraft((current) =>
        normalizeIngredientForEdit({
          ...current,
          ...analyzed,
          id: current.id || analyzed.id,
          grams: toNumber(analyzed.grams, current.grams),
          baseGrams: toNumber(analyzed.baseGrams, analyzed.grams),
          estimatedGrams: toNumber(analyzed.estimatedGrams, analyzed.grams),
        }),
      );
    } catch (error) {
      toast.error(
        isAiAccessLimitError(error)
          ? "Bugungi AI limitingiz tugagan. Keyinroq qayta urinib ko'ring."
          : "Ingredient macro qiymatlarini AI orqali olib bo'lmadi.",
      );
      setDraft((current) => ({
        ...current,
        nutritionSource: "manual",
        matchStatus: "manual",
        reviewNeeded: true,
      }));
    }
  }, [aiAccessStatus.isDisabled, analyzeIngredient, draft.grams, draft.name]);

  const handleEditGramsChange = React.useCallback(([value]) => {
    setDraft((current) => ({
      ...current,
      grams: Math.max(1, Math.round(toNumber(value, current.grams))),
    }));
  }, []);

  const handleSave = React.useCallback(() => {
    const name = trim(draft.name);
    if (!name) {
      toast.error("Ingredient nomini yozing.");
      return;
    }

    onSave?.(
      commitEditedIngredient({
        ...draft,
        name,
        nutrition: preview,
      }),
    );
    onOpenChange?.(false);
  }, [draft, onOpenChange, onSave, preview]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <NutritionDrawerContent size="sm">
        <DrawerHeader className="items-center border-b border-border/40 text-center md:text-center">
          <DrawerTitle>
            {isAddMode
              ? "Ingredient qo'shish"
              : draft.name || "Ingredientni tahrirlash"}
          </DrawerTitle>
          <DrawerDescription>
            {isAddMode
              ? "Ingredient nomini kiriting yoki AI orqali aniqlang."
              : "Porsiya hajmini tanlang (g)"}
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody className="space-y-5">
          {isAddMode ? (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Ingredient nomi
              </label>
              <div className="relative">
                <Input
                  value={draft.name}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Masalan: guruch, tuxum, avokado"
                  className="h-12 rounded-2xl pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleAnalyze}
                  disabled={
                    isAnalyzingIngredient ||
                    !trim(draft.name) ||
                    aiAccessStatus.isDisabled
                  }
                  className="absolute top-1/2 right-1 size-10 -translate-y-1/2 rounded-full"
                  aria-label="AI bilan aniqlash"
                >
                  {isAnalyzingIngredient ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : (
                    <SparklesIcon className="size-4" />
                  )}
                </Button>
              </div>
              <AiAccessStatusText
                access={aiAccess}
                className="mt-1"
              />
            </div>
          ) : null}

          {isAddMode ? (
            <>
              <div className="rounded-3xl border bg-muted/15 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Porsiya</p>
                    <p className="text-xs text-muted-foreground">
                      Macro qiymatlar shu grammga mos hisoblanadi.
                    </p>
                  </div>
                  <span className="rounded-full border bg-background px-3 py-1 text-sm font-black tabular-nums">
                    {Math.round(draft.grams)} g
                  </span>
                </div>
                <Slider
                  value={[Math.max(1, toNumber(draft.grams, 100))]}
                  min={1}
                  max={sliderMax}
                  step={5}
                  className="mt-5"
                  onValueChange={([value]) =>
                    setDraft((current) => ({
                      ...current,
                      grams: Math.max(1, Math.round(value || current.grams)),
                    }))
                  }
                />
              </div>

              <IngredientServingFields
                draft={draft}
                onQuantityChange={setServingQuantity}
                onUnitChange={setServingUnit}
              />

              <MacroOverrideFields preview={preview} onChange={setMacroValue} />
            </>
          ) : (
            <>
              <NutritionPortionControlCard
                id={draft.id || "ingredient-edit"}
                macros={previewMacros}
                goals={goals}
                value={Math.max(1, toNumber(draft.grams, 100))}
                unit="g"
                min={0}
                max={1000}
                step={5}
                gaugeMax={editGaugeMax}
                onValueChange={handleEditGramsChange}
              />

              <IngredientServingFields
                draft={draft}
                onQuantityChange={setServingQuantity}
                onUnitChange={setServingUnit}
              />

              <div className="space-y-2">
                <div>
                  <p className="text-sm font-semibold">Nutrition override</p>
                  <p className="text-xs text-muted-foreground">
                    Qiymatlar joriy gramm va birlik uchun saqlanadi.
                  </p>
                </div>
                <MacroOverrideFields
                  preview={preview}
                  onChange={setMacroValue}
                />
              </div>
            </>
          )}
        </DrawerBody>

        <DrawerFooter>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!trim(draft.name)}
          >
            {isAddMode ? "Qo'shish" : "Saqlash"}
          </Button>
        </DrawerFooter>
      </NutritionDrawerContent>
    </Drawer>
  );
}
