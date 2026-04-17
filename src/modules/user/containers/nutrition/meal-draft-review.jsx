import React from "react";
import { round } from "lodash";
import { XIcon } from "lucide-react";
import { Slider } from "@/components/ui/slider.jsx";
import { Button } from "@/components/ui/button.jsx";
import GaugeProgress from "@/components/meal-plan-builder/gauge-progress.jsx";

const toNumber = (value, fallback = 0) => {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : fallback;
};

const toRoundedNumber = (value) => round(toNumber(value), 1);

export const formatConfidence = (confidence = 0) =>
  `${Math.max(0, Math.min(100, Math.round(toNumber(confidence) * 100)))}%`;

export const getDraftPortion = (item = {}) =>
  Math.max(
    20,
    Math.round(toNumber(item.grams ?? item.portionGrams ?? item.defaultAmount, 100)),
  );

export const getDraftBasePortion = (item = {}) =>
  Math.max(20, Math.round(toNumber(item.portionGrams ?? item.defaultAmount, 100)));

export const getDraftSliderMax = (item = {}) =>
  Math.max(300, Math.ceil((getDraftBasePortion(item) * 3) / 10) * 10);

export const getDraftNutritionPreview = (item = {}) => {
  const basePortion = getDraftBasePortion(item);
  const currentPortion = getDraftPortion(item);
  const scale = basePortion > 0 ? currentPortion / basePortion : 1;

  return {
    calories: Math.round(toNumber(item?.nutrition?.calories) * scale),
    protein: toRoundedNumber(toNumber(item?.nutrition?.protein) * scale),
    carbs: toRoundedNumber(toNumber(item?.nutrition?.carbs) * scale),
    fat: toRoundedNumber(toNumber(item?.nutrition?.fat) * scale),
    fiber: toRoundedNumber(toNumber(item?.nutrition?.fiber) * scale),
  };
};

export const isDraftReviewNeeded = (item = {}) =>
  Boolean(item?.reviewNeeded) ||
  (Array.isArray(item?.ingredients) &&
    item.ingredients.some(
      (ingredient) =>
        ingredient?.reviewNeeded || ingredient?.matchStatus === "unmatched",
    ));

export const getDraftReviewCount = (items = []) =>
  items.filter(isDraftReviewNeeded).length;

export const getDraftTotals = (items = []) =>
  items.reduce(
    (acc, item) => {
      const preview = getDraftNutritionPreview(item);
      acc.calories += preview.calories;
      acc.protein += preview.protein;
      acc.carbs += preview.carbs;
      acc.fat += preview.fat;
      acc.fiber += preview.fiber;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
  );

export const getDraftMaxCalories = (items = []) =>
  items.reduce((acc, item) => {
    const maxScale =
      getDraftBasePortion(item) > 0
        ? getDraftSliderMax(item) / getDraftBasePortion(item)
        : 1;
    return (
      acc + Math.round(toNumber(item?.nutrition?.calories, 0) * Math.max(1, maxScale))
    );
  }, 0);

export const buildMealPayloadFromDraft = (
  item,
  { source = "ai", image = null, addedAt = undefined } = {},
) => {
  const preview = getDraftNutritionPreview(item);

  return {
    name: item?.title || "Ovqat",
    source,
    qty: 1,
    grams: getDraftPortion(item),
    cal: preview.calories,
    protein: preview.protein,
    carbs: preview.carbs,
    fat: preview.fat,
    fiber: preview.fiber,
    image,
    addedAt,
  };
};

export const getDraftImageUrl = (item = {}) => {
  if (item?.imageUrl || item?.image) {
    return item.imageUrl || item.image || null;
  }

  if (!Array.isArray(item?.ingredients)) {
    return null;
  }

  return (
    item.ingredients.find((ingredient) => ingredient?.matchedFood?.imageUrl)
      ?.matchedFood?.imageUrl || null
  );
};

export const MealDraftSummaryCard = ({
  items,
  goals,
  emptyTitle = "Ovqat topilmadi",
  emptyDescription = "Qayta urinib ko'ring.",
  filledDescription = "Draftni tekshirib, keyin tasdiqlang.",
}) => {
  const totals = React.useMemo(() => getDraftTotals(items), [items]);
  const maxPreviewCalories = React.useMemo(
    () => getDraftMaxCalories(items),
    [items],
  );
  const reviewCount = React.useMemo(() => getDraftReviewCount(items), [items]);

  return (
    <div className="rounded-3xl border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">
            {items.length > 0 ? `${items.length} ta draft tayyor` : emptyTitle}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {items.length > 0 ? filledDescription : emptyDescription}
          </p>
        </div>
        {reviewCount > 0 ? (
          <div className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
            {reviewCount} ta tekshirish kerak
          </div>
        ) : items.length > 0 ? (
          <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            Draft tayyor
          </div>
        ) : null}
      </div>

      {items.length > 0 ? (
        <div className="mt-5">
          <div className="flex flex-col items-center">
            <GaugeProgress
              value={totals.calories}
              min={0}
              max={Math.max(
                maxPreviewCalories,
                totals.calories,
                toNumber(goals?.calories, 0),
              )}
              id="meal-ai-preview"
              label="QO'SHILMOQDA"
            />

            <div className="grid w-full grid-cols-3 gap-8 py-6">
              <div className="flex flex-col items-center gap-1.5">
                <span className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground">
                  🍗 Oqsil
                </span>
                <span className="text-base font-black">
                  <span className="text-red-500">{totals.protein}</span>
                  <span className="text-xs font-semibold text-muted-foreground opacity-50">
                    /{toNumber(goals?.protein, 0)}g
                  </span>
                </span>
              </div>
              <div className="flex flex-col items-center gap-1.5 border-l border-r border-border/50 px-4">
                <span className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground">
                  🍴 Uglevod
                </span>
                <span className="text-base font-black">
                  <span className="text-orange-500">{totals.carbs}</span>
                  <span className="text-xs font-semibold text-muted-foreground opacity-50">
                    /{toNumber(goals?.carbs, 0)}g
                  </span>
                </span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <span className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground">
                  🥑 Yog&apos;
                </span>
                <span className="text-base font-black">
                  <span className="text-green-500">{totals.fat}</span>
                  <span className="text-xs font-semibold text-muted-foreground opacity-50">
                    /{toNumber(goals?.fat, 0)}g
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export const MealDraftCard = ({
  item,
  onPortionChange,
  onRemove,
}) => {
  const preview = React.useMemo(() => getDraftNutritionPreview(item), [item]);
  const portion = getDraftPortion(item);
  const sliderMax = getDraftSliderMax(item);
  const imageUrl = React.useMemo(() => getDraftImageUrl(item), [item]);
  const ingredientCount = Array.isArray(item?.ingredients) ? item.ingredients.length : 0;

  return (
    <div className="rounded-[1.35rem] border bg-card p-3.5">
      <div className="flex items-start gap-3">
        <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted/30">
          {imageUrl ? (
            <img
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

      <div className="mt-3 space-y-2.5">
        <div className="w-full rounded-2xl border border-border/50 bg-background/50 px-3 py-2.5">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-[13px] text-muted-foreground">Porsiya</span>
            <span className="text-[15px] font-semibold tabular-nums">{portion} g</span>
          </div>
          <Slider
            value={[portion]}
            min={20}
            max={sliderMax}
            step={10}
            onValueChange={([value]) => onPortionChange?.(value)}
            className="mt-2"
          />
        </div>

        <div className="grid w-full grid-cols-4 gap-2">
          <div className="min-w-0 rounded-xl border border-border/50 bg-background/50 px-2.5 py-2">
            <div className="text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
              Kaloriya
            </div>
            <div className="mt-1 text-[13px] font-bold leading-4">
              {preview.calories}
              <span className="block text-[10px] font-medium text-muted-foreground">
                kcal
              </span>
            </div>
          </div>
          <div className="min-w-0 rounded-xl border border-border/50 bg-background/50 px-2.5 py-2">
            <div className="text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
              Oqsil
            </div>
            <div className="mt-1 text-[13px] font-bold leading-4">{preview.protein} g</div>
          </div>
          <div className="min-w-0 rounded-xl border border-border/50 bg-background/50 px-2.5 py-2">
            <div className="text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
              Uglevod
            </div>
            <div className="mt-1 text-[13px] font-bold leading-4">{preview.carbs} g</div>
          </div>
          <div className="min-w-0 rounded-xl border border-border/50 bg-background/50 px-2.5 py-2">
            <div className="text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
              Yog&apos;
            </div>
            <div className="mt-1 text-[13px] font-bold leading-4">{preview.fat} g</div>
          </div>
        </div>
      </div>
    </div>
  );
};
