import React, { useMemo, useState } from "react";
import find from "lodash/find";
import map from "lodash/map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input.jsx";
import {
  DrawerBody,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { MEAL_PLAN_GOALS } from "@/data/meal-plans.mock";
import { ChevronLeftIcon, Loader2Icon, SparklesIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import useMealPlan from "@/hooks/app/use-meal-plan";
import { useNutritionAiPantry } from "@/hooks/app/use-nutrition-ai.js";
import { AiAccessStatusText } from "@/components/ai-access";
import {
  AI_USAGE_FEATURES,
  getAiAccessDisabledProps,
  getAiAccessStatus,
  isAiAccessLimitError,
  useAiAccessStatus,
} from "@/hooks/app/use-ai-access";
import {
  NUTRITION_PRICE_REGIONS,
  NUTRITION_PRICE_SEASONS,
} from "./nutrition-price-context.js";

const MEAL_COUNTS = [
  { id: 3, label: "3 mahal", description: "Nonushta, Tushlik, Kechki ovqat" },
  { id: 4, label: "4 mahal", description: "3 mahal + 1 snack" },
  { id: 5, label: "5 mahal", description: "3 mahal + 2 snack" },
];

const BUDGET_PERIODS = [
  { id: "daily", label: "Kunlik" },
  { id: "weekly", label: "Haftalik" },
  { id: "monthly", label: "Oylik" },
];

const normalizePantryItemsForAiPlan = (items = []) =>
  items
    .slice(0, 20)
    .map((item) => {
      const name = String(item?.name || item?.ingredient?.name || "").trim();

      if (!name) {
        return null;
      }

      const quantity = Number(item?.quantity);
      const grams = Number(item?.grams);
      const ingredientId = Number(item?.ingredientId);

      return {
        id: item?.id ? String(item.id) : null,
        ingredientId:
          Number.isFinite(ingredientId) && ingredientId > 0
            ? Math.trunc(ingredientId)
            : null,
        name,
        quantity: Number.isFinite(quantity) && quantity >= 0 ? quantity : null,
        unit: item?.unit ? String(item.unit).trim() || null : null,
        grams: Number.isFinite(grams) && grams >= 0 ? grams : null,
      };
    })
    .filter(Boolean);

const AIGenerator = ({ onClose, onGenerated }) => {
  const { generateAiPlan, isGeneratingAi } = useMealPlan();
  const { pantryItems = [], isLoading: isPantryLoading } =
    useNutritionAiPantry({ enabled: true });
  const { wallet, costs } = useAiAccessStatus();
  const [step, setStep] = useState(1);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [selectedMealCount, setSelectedMealCount] = useState(4);
  const [budgetAmount, setBudgetAmount] = useState("");
  const [selectedBudgetPeriod, setSelectedBudgetPeriod] = useState("weekly");
  const [selectedRegionKey, setSelectedRegionKey] = useState("");
  const [selectedSeason, setSelectedSeason] = useState("all");
  const planFeature = AI_USAGE_FEATURES.mealPlan7Day;
  const accessStatus = getAiAccessStatus({
    wallet,
    costs,
    feature: planFeature,
  });
  const accessDisabledProps = getAiAccessDisabledProps({
    wallet,
    costs,
    feature: planFeature,
  });

  const selectedGoalData = useMemo(
    () => find(MEAL_PLAN_GOALS, { id: selectedGoal }) ?? null,
    [selectedGoal],
  );
  const aiPlanPantryItems = useMemo(
    () => normalizePantryItemsForAiPlan(pantryItems),
    [pantryItems],
  );

  const handleAiGenerate = async () => {
    if (!selectedGoal || accessStatus.isDisabled) {
      return;
    }

    try {
      const normalizedBudgetAmount = Number(String(budgetAmount).trim());
      const nextState = await generateAiPlan({
        goal: selectedGoal,
        mealCount: selectedMealCount,
        ...(Number.isFinite(normalizedBudgetAmount) && normalizedBudgetAmount > 0
          ? {
              budgetAmount: normalizedBudgetAmount,
              budgetPeriod: selectedBudgetPeriod,
            }
          : {}),
        ...(selectedRegionKey ? { regionKey: selectedRegionKey } : {}),
        ...(selectedSeason !== "all" ? { season: selectedSeason } : {}),
        ...(aiPlanPantryItems.length ? { pantryItems: aiPlanPantryItems } : {}),
      });

      if (nextState?.draftPlan && onGenerated) {
        onGenerated(nextState.draftPlan);
      }

      onClose();
      toast.success("AI reja yaratildi!", {
        description: "Reja real ovqatlar bazasi asosida tuzildi.",
        icon: <SparklesIcon className="size-4 text-primary" />,
      });
    } catch (error) {
      toast.error(
        isAiAccessLimitError(error)
          ? "Bugungi AI limitingiz tugagan. Keyinroq qayta urinib ko'ring."
          : "AI rejani yaratib bo'lmadi",
      );
    }
  };

  return (
    <>
      <DrawerHeader className="relative">
        {step > 1 ? (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full"
            onClick={() => setStep(step - 1)}
          >
            <ChevronLeftIcon className="size-5" />
          </Button>
        ) : null}
        <div className="w-full px-10 text-center">
          <DrawerTitle>AI aqlli reja</DrawerTitle>
          <DrawerDescription>
            {step === 1
              ? "Maqsadingizni tanlang"
              : "Kuniga necha mahal ovqatlanasiz?"}
          </DrawerDescription>
        </div>
      </DrawerHeader>
      <DrawerBody className="space-y-3">
        {step === 1 ? (
          <div className="space-y-2">
            {map(MEAL_PLAN_GOALS, (goal) => {
              const isActive = selectedGoal === goal.id;

              return (
                <button type="button"
                  key={goal.id}
                  onClick={() => {
                    setSelectedGoal(goal.id);
                    setStep(2);
                  }}
                  className={cn(
                    "w-full rounded-lg border p-3 text-left transition-colors",
                    "flex items-center gap-3",
                    isActive
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-accent",
                  )}
                >
                  <div
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                      isActive
                        ? "border-primary"
                        : "border-muted-foreground/40",
                    )}
                  >
                    {isActive ? (
                      <div className="size-2 rounded-full bg-primary" />
                    ) : null}
                  </div>
                  <span className="shrink-0 text-2xl">{goal.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="mb-1 text-sm font-semibold leading-none">
                      {goal.label}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {goal.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="mb-4 flex items-center gap-3 rounded-lg border border-primary bg-primary/5 p-3">
              <span className="shrink-0 text-2xl">
                {selectedGoalData?.emoji}
              </span>
              <div>
                <p className="text-sm font-semibold text-primary">
                  {selectedGoalData?.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedGoalData?.intensity} • real ovqatlar bazasi asosida
                </p>
              </div>
            </div>
            <AiAccessStatusText
              feature={planFeature}
              wallet={wallet}
              costs={costs}
              className="mb-3 justify-center"
            />

            <div className="rounded-lg border border-border bg-background p-3 text-sm">
              <p className="font-semibold text-foreground">
                {isPantryLoading
                  ? "Ombor konteksti yuklanmoqda..."
                  : `Ombor konteksti: ${aiPlanPantryItems.length} ta mahsulot`}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                AI reja mos kelgan joylarda ombordagi mahsulotlarni birinchi
                navbatda ishlatadi.
              </p>
            </div>

            {map(MEAL_COUNTS, (count) => {
              const isActive = selectedMealCount === count.id;

              return (
                <button type="button"
                  key={count.id}
                  onClick={() => setSelectedMealCount(count.id)}
                  className={cn(
                    "w-full rounded-lg border p-3 text-left transition-colors",
                    "flex items-center gap-3",
                    isActive
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-accent",
                  )}
                >
                  <div
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                      isActive
                        ? "border-primary"
                        : "border-muted-foreground/40",
                    )}
                  >
                    {isActive ? (
                      <div className="size-2 rounded-full bg-primary" />
                    ) : null}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{count.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {count.description}
                    </p>
                  </div>
                </button>
              );
            })}

            <div className="rounded-lg border border-border bg-background p-3">
              <label
                className="mb-2 block text-xs font-bold text-muted-foreground"
                htmlFor="nutrition-ai-budget"
              >
                UZS byudjet
              </label>
              <Input
                id="nutrition-ai-budget"
                type="number"
                min="0"
                inputMode="numeric"
                value={budgetAmount}
                onChange={(event) => setBudgetAmount(event.target.value)}
                placeholder="Masalan, 350000"
              />
              <div className="mt-2 grid grid-cols-3 gap-1">
                {map(BUDGET_PERIODS, (period) => (
                  <Button
                    key={period.id}
                    type="button"
                    size="sm"
                    variant={
                      selectedBudgetPeriod === period.id ? "default" : "outline"
                    }
                    className="h-8 text-xs"
                    onClick={() => setSelectedBudgetPeriod(period.id)}
                  >
                    {period.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-background p-3">
              <p className="mb-2 text-xs font-bold text-muted-foreground">
                Narx konteksti
              </p>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[11px] font-bold text-muted-foreground">
                  Hudud
                  <select
                    aria-label="Narx hududi"
                    className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-2 text-xs font-semibold text-foreground"
                    value={selectedRegionKey}
                    onChange={(event) => setSelectedRegionKey(event.target.value)}
                  >
                    {map(NUTRITION_PRICE_REGIONS, (region) => (
                      <option key={region.value || "all"} value={region.value}>
                        {region.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-[11px] font-bold text-muted-foreground">
                  Mavsum
                  <select
                    aria-label="Narx mavsumi"
                    className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-2 text-xs font-semibold text-foreground"
                    value={selectedSeason}
                    onChange={(event) => setSelectedSeason(event.target.value)}
                  >
                    {map(NUTRITION_PRICE_SEASONS, (season) => (
                      <option key={season.value} value={season.value}>
                        {season.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </div>
        )}
      </DrawerBody>
      <DrawerFooter>
        {step === 2 ? (
          <Button
            onClick={handleAiGenerate}
            {...accessDisabledProps}
            disabled={isGeneratingAi || accessStatus.isDisabled}
          >
            {isGeneratingAi ? (
              <>
                <Loader2Icon className="mr-2 size-5 animate-spin" />
                Reja tuzilmoqda...
              </>
            ) : (
              <>
                <SparklesIcon className="mr-2 size-5" />
                Rejani yaratish
              </>
            )}
          </Button>
        ) : null}
        <Button variant="outline" onClick={onClose} disabled={isGeneratingAi}>
          Bekor qilish
        </Button>
      </DrawerFooter>
    </>
  );
};

export default AIGenerator;
