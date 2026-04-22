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
import {
  commitEditedIngredient,
  createMealIngredientId,
  getIngredientNutritionPreview,
  normalizeIngredientForEdit,
  normalizeMealNutrition,
  toNumber,
} from "./meal-ingredients.js";

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

const macroFields = [
  ["calories", "Kcal", 1, 0],
  ["protein", "Oqsil", 0.1, 1],
  ["carbs", "Uglevod", 0.1, 1],
  ["fat", "Yog'", 0.1, 1],
  ["fiber", "Fiber", 0.1, 1],
];

const getSliderMax = (grams) =>
  Math.max(300, Math.ceil((Math.max(1, Number(grams) || 100) * 2) / 10) * 10);

const createEmptyIngredientDraft = () =>
  normalizeIngredientForEdit({
    ...emptyIngredient,
    id: createMealIngredientId(),
  });

export default function IngredientEditDrawer({
  open,
  mode = "edit",
  ingredient,
  onOpenChange,
  onSave,
}) {
  const isAddMode = mode === "add";
  const { analyzeIngredient, isAnalyzingIngredient } = useFoodScan();
  const [draft, setDraft] = React.useState(() =>
    ingredient
      ? normalizeIngredientForEdit(ingredient)
      : createEmptyIngredientDraft(),
  );

  React.useEffect(() => {
    if (!open) return;
    setDraft(
      ingredient
        ? normalizeIngredientForEdit(ingredient)
        : createEmptyIngredientDraft(),
    );
  }, [ingredient, open]);

  const preview = React.useMemo(
    () => getIngredientNutritionPreview(draft),
    [draft],
  );
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

  const handleAnalyze = React.useCallback(async () => {
    const name = draft.name.trim();
    if (!name) {
      toast.error("Ingredient nomini yozing.");
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
    } catch {
      toast.error("Ingredient macro qiymatlarini AI orqali olib bo'lmadi.");
      setDraft((current) => ({
        ...current,
        nutritionSource: "manual",
        matchStatus: "manual",
        reviewNeeded: true,
      }));
    }
  }, [analyzeIngredient, draft.grams, draft.name]);

  const handleSave = React.useCallback(() => {
    const name = draft.name.trim();
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
        <DrawerHeader className="border-b border-border/40">
          <DrawerTitle>
            {isAddMode ? "Ingredient qo'shish" : "Ingredientni tahrirlash"}
          </DrawerTitle>
          <DrawerDescription>
            Gram sliderni o'zgartiring yoki macro qiymatlarni qo'lda kiriting.
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody className="space-y-5">
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
                disabled={isAnalyzingIngredient || !draft.name.trim()}
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
          </div>

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

          <div className="grid grid-cols-2 gap-3">
            {macroFields.map(([key, label, step, maximumFractionDigits]) => (
              <label key={key} className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  {label}
                </span>
                <NumberField
                  value={preview[key]}
                  onValueChange={(value) => setMacroValue(key, value)}
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
        </DrawerBody>

        <DrawerFooter>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!draft.name.trim()}
          >
            {isAddMode ? "Qo'shish" : "Saqlash"}
          </Button>
        </DrawerFooter>
      </NutritionDrawerContent>
    </Drawer>
  );
}
