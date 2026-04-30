import React from "react";
import CalorieGaugeWidget from "@/components/calorie-gauge-widget";
import { Button } from "@/components/ui/button";
import {
  BookmarkIcon,
  DropletsIcon,
  PlusIcon,
  TargetIcon,
  UtensilsIcon,
} from "lucide-react";
import { NutritionDatePicker } from "../nutrition-header.jsx";
import NutritionPlansSection from "../nutrition-plans-section.jsx";

const clampPercent = (value, target) => {
  if (!target) return 0;
  return Math.max(0, Math.min(100, Math.round((value / target) * 100)));
};

const MacroProgress = ({ label, value, target, className }) => (
  <div className="rounded-2xl border bg-card p-4">
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="font-bold">{label}</span>
      <span className="text-muted-foreground">
        {value}/{target}g
      </span>
    </div>
    <div className="mt-3 h-2 rounded-full bg-muted">
      <div
        className={`h-full rounded-full ${className}`}
        style={{ width: `${clampPercent(value, target)}%` }}
      />
    </div>
  </div>
);

export default function NutritionHomeView(props) {
  const {
    date,
    setDate,
    plans,
    currentPlan,
    goals,
    roundedTotals,
    waterConsumedMl,
    waterGoalMl,
    calorieGoalMeta,
    isGoalLoadingState,
    activeMealType,
    setSelectedMealTypeForAdd,
    setIsActionDrawerOpen,
    setIsSavedMealsOpen,
    setIsPlansDrawerOpen,
    onOpenGoalWizard,
    isOnline,
    isPastDate,
  } = props;
  const caloriePercent = clampPercent(roundedTotals.calories, goals.calories);
  const proteinPercent = clampPercent(roundedTotals.protein, goals.protein);
  const waterPercent = clampPercent(waterConsumedMl, waterGoalMl);
  const healthScore = Math.round(
    (Math.min(caloriePercent, 100) +
      Math.min(proteinPercent, 100) +
      Math.min(waterPercent, 100)) /
      3,
  );

  return (
    <div className="flex flex-col gap-6">
      {!isOnline ? (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-800 dark:text-amber-200">
          Tarmoq yo&apos;q — o&apos;zgarishlar saqlanmaydi
        </div>
      ) : null}

      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <Button
          type="button"
          variant="outline"
          className="md:w-auto"
          onClick={onOpenGoalWizard}
        >
          <TargetIcon className="size-4" />
          Maqsadimni yangilash
        </Button>
        <NutritionDatePicker
          date={date}
          onChange={setDate}
        />
      </div>

      {isPastDate ? (
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm font-semibold text-blue-800 dark:text-blue-200">
          O'tgan kun readonly ko'rinishda ochildi. Kerakli ovqatdagi plus
          tugmasi orqali uni bugungi kunga qo'shishingiz mumkin.
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border bg-card p-5">
            <p className="text-sm font-bold text-muted-foreground">
              Kunlik health score
            </p>
            <div className="mt-4 flex items-end gap-3">
              <span className="text-5xl font-black tracking-tight">
                {healthScore}
              </span>
              <span className="pb-2 text-sm font-bold text-muted-foreground">
                /100
              </span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Kaloriya, oqsil va suv progressi asosida.
            </p>
          </div>

          <div className="rounded-3xl border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-muted-foreground">
                  Suv progress
                </p>
                <p className="mt-2 text-2xl font-black">
                  {waterConsumedMl} / {waterGoalMl} ml
                </p>
              </div>
              <div className="grid size-12 place-items-center rounded-2xl bg-blue-500/10 text-blue-600">
                <DropletsIcon className="size-6" />
              </div>
            </div>
            <div className="mt-5 h-2 rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-blue-500"
                style={{ width: `${waterPercent}%` }}
              />
            </div>
          </div>

          <MacroProgress
            label="Protein"
            value={roundedTotals.protein}
            target={goals.protein}
            className="bg-red-500"
          />
          <MacroProgress
            label="Carbs"
            value={roundedTotals.carbs}
            target={goals.carbs}
            className="bg-amber-500"
          />
          <MacroProgress
            label="Fat"
            value={roundedTotals.fat}
            target={goals.fat}
            className="bg-emerald-500"
          />

          <div className="rounded-2xl border bg-card p-4">
            <p className="text-sm font-bold">Tez harakatlar</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button
                disabled={!isOnline || isPastDate}
                onClick={() => {
                  setSelectedMealTypeForAdd(activeMealType);
                  setIsActionDrawerOpen(true);
                }}
              >
                <PlusIcon className="size-4" />
                Ovqat
              </Button>
              <Button variant="outline" onClick={() => setIsSavedMealsOpen(true)}>
                <BookmarkIcon className="size-4" />
                Saqlangan
              </Button>
              <Button variant="outline" onClick={() => setIsPlansDrawerOpen(true)}>
                <UtensilsIcon className="size-4" />
                Rejalar
              </Button>
              <Button variant="outline" onClick={onOpenGoalWizard}>
                <TargetIcon className="size-4" />
                Maqsad
              </Button>
            </div>
          </div>

          <div className="sm:col-span-2">
            <NutritionPlansSection
              plans={plans}
              currentPlan={currentPlan}
              onOpenPlans={() => setIsPlansDrawerOpen(true)}
            />
          </div>
        </div>

        <CalorieGaugeWidget
          consumed={roundedTotals.calories}
          goal={goals.calories}
          macros={{
            protein: {
              current: roundedTotals.protein,
              target: goals.protein,
            },
            carbs: { current: roundedTotals.carbs, target: goals.carbs },
            fat: { current: roundedTotals.fat, target: goals.fat },
          }}
          isGoalLoading={isGoalLoadingState}
          goalMeta={calorieGoalMeta}
          className="h-fit w-full py-6"
        />
      </div>
    </div>
  );
}
