import React from "react";
import CalorieGaugeWidget from "@/components/calorie-gauge-widget";
import { Button } from "@/components/ui/button";
import {
  BarChart3Icon,
  CheckCircle2Icon,
  DropletsIcon,
  FlameIcon,
  PlusIcon,
  ScaleIcon,
  TrophyIcon,
  UtensilsIcon,
} from "lucide-react";
import { useNavigate } from "react-router";
import { NutritionDatePicker } from "../nutrition-header.jsx";
import NutritionPlansSection from "../nutrition-plans-section.jsx";
import NutritionLayout from "../ui/nutrition-layout.jsx";
import NutritionPageHeader from "../ui/nutrition-page-header.jsx";
import NutritionCard from "../ui/nutrition-card.jsx";
import StatCard from "../ui/stat-card.jsx";
import MacroBalanceCard from "../ui/macro-balance-card.jsx";
import ProgressBar, { getProgressPercent } from "../ui/progress-bar.jsx";
import AIRecommendationCard from "../ui/ai-recommendation-card.jsx";
import QuickActionsBar from "../ui/quick-actions-bar.jsx";
import { buildNutritionDashboardMetrics } from "../data/nutrition-data-mappers.js";

import { map, sumBy, toNumber } from "lodash";

const mealStatusByType = {
  breakfast: "Yakunlandi",
  lunch: "Hozir",
  dinner: "Davom etmoqda",
  snack: "Kutilmoqda",
};

const getMealCalories = (items = []) =>
  Math.round(
    sumBy(items, (food) => toNumber(food.cal || 0) * toNumber(food.qty || 1)),
  );

const MicronutrientCard = () => {
  const nutrients = [
    ["Temir", 82],
    ["Kalsiy", 68],
    ["Vitamin D", 54],
    ["Vitamin B12", 88],
    ["Magniy", 74],
  ];

  return (
    <NutritionCard>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black">Mikronutrientlar</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Haftalik balans ko'rsatkichi
          </p>
        </div>
        <div
          className="grid size-16 place-items-center rounded-full text-sm font-black text-primary"
          style={{
            background:
              "conic-gradient(rgb(var(--accent-strong-rgb)) 78%, hsl(var(--muted)) 0)",
          }}
          aria-label="Mikronutrient progress 78 foiz"
        >
          <span className="grid size-11 place-items-center rounded-full bg-card">
            78%
          </span>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {map(nutrients, ([label, value]) => (
          <div key={label}>
            <div className="flex items-center justify-between text-xs font-semibold">
              <span>{label}</span>
              <span className="text-muted-foreground">{value}%</span>
            </div>
            <ProgressBar
              className="mt-1.5 h-1.5"
              value={value}
              target={100}
              tone="primary"
              aria-label={`${label} progress`}
            />
          </div>
        ))}
      </div>
    </NutritionCard>
  );
};

const MealTimeline = ({
  filteredMealSections,
  mealConfig,
  activeMealType,
  disabled,
  onAdd,
}) => (
  <NutritionCard>
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-black">Bugungi ovqatlar</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Kun davomida meal log holati
        </p>
      </div>
    </div>
    <div className="mt-4 space-y-3">
      {map(filteredMealSections, ([type, section]) => {
        const config = mealConfig[type] || {};
        const foods = section.foods || [];
        const calories = getMealCalories(foods);
        const isActive = type === activeMealType;

        return (
          <div key={type} className="rounded-2xl border bg-background/55 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-lg">
                  {config.emoji || "o"}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold">{config.label}</p>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                      {isActive ? "Hozir" : mealStatusByType[type] || "Reja"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {section.time || config.time} • {foods.length} ta ovqat
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-black tabular-nums">{calories}</p>
                <p className="text-[10px] font-bold uppercase text-muted-foreground">
                  kcal
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="flex -space-x-2">
                {foods.length > 0 ? (
                  map(foods.slice(0, 3), (food, index) => (
                    <div
                      key={food.id || `${type}-${index}`}
                      className="grid size-7 place-items-center rounded-full border bg-card text-xs"
                      title={food.name}
                    >
                      {food.image ? (
                        <img
                          src={food.image}
                          alt=""
                          className="size-full rounded-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span>{config.emoji || "o"}</span>
                      )}
                    </div>
                  ))
                ) : (
                  <span className="text-xs font-semibold text-muted-foreground">
                    Hali ovqat qo'shilmagan
                  </span>
                )}
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={disabled}
                onClick={() => onAdd(type)}
              >
                <PlusIcon className="size-4" />
                Ovqat qo'shish
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  </NutritionCard>
);

export default function NutritionHomeView(props) {
  const {
    date,
    setDate,
    plans,
    currentPlan,
    currentPlanDayStatus,
    goals,
    roundedTotals,
    waterConsumedMl,
    waterGoalMl,
    calorieGoalMeta,
    isGoalLoadingState,
    activeMealType,
    setSelectedMealTypeForAdd,
    setIsActionDrawerOpen,
    setIsPlansDrawerOpen,
    onAddWaterCup,
    filteredMealSections = [],
    mealConfig = {},
    isOnline,
    isPastDate,
  } = props;
  const navigate = useNavigate();
  const metrics = buildNutritionDashboardMetrics({
    roundedTotals,
    goals,
    waterConsumedMl,
    waterGoalMl,
  });
  const waterPercent = getProgressPercent(
    metrics.water.current,
    metrics.water.target,
  );
  const addDisabled = !isOnline || isPastDate;
  const openAddMeal = (mealType = activeMealType) => {
    setSelectedMealTypeForAdd(mealType);
    setIsActionDrawerOpen(true);
  };
  const quickActions = [
    {
      label: "Ovqat qo'shish",
      icon: PlusIcon,
      disabled: addDisabled,
      onClick: () => openAddMeal(activeMealType),
      variant: "default",
    },
    {
      label: "Suv qo'shish",
      icon: DropletsIcon,
      disabled: addDisabled || !onAddWaterCup,
      onClick: onAddWaterCup,
    },
    {
      label: "Og'irlik yozish",
      icon: ScaleIcon,
      onClick: () => navigate("/user/measurements"),
    },
    {
      label: "Ovqat rejasini ko'rish",
      icon: UtensilsIcon,
      onClick: () => setIsPlansDrawerOpen(true),
    },
    {
      label: "Hisobotlar",
      icon: BarChart3Icon,
      onClick: () => navigate("/user/nutrition/report"),
    },
  ];
  const sidebar = (
    <>
      <StatCard
        icon={DropletsIcon}
        label="Suv progress"
        value={`${metrics.water.current} / ${metrics.water.target}`}
        unit="ml"
        description={`${waterPercent}% bajarildi`}
        progress={{
          value: metrics.water.current,
          target: metrics.water.target,
          tone: "water",
          ariaLabel: "Suv progress",
        }}
        tone="water"
      />
      <StatCard
        icon={TrophyIcon}
        label="Kunlik health score"
        value={metrics.healthScore}
        unit="/100"
        badge="Yaxshi"
        description="Kaloriya, oqsil va suv progressi asosida."
        tone="success"
      />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
        <StatCard
          icon={CheckCircle2Icon}
          label="Ovqatlar yakunlandi"
          value={`${metrics.mealsCompleted} / ${metrics.totalMeals}`}
          description="Bugungi meal bo'limlari"
          tone="primary"
        />
        <StatCard
          icon={FlameIcon}
          label="Seriya"
          value={metrics.streakDays}
          unit="kun"
          description="Davom etmoqda"
          tone="warning"
        />
      </div>
      <AIRecommendationCard
        title="AI tavsiya"
        description="Protein va suv nishonlari yaxshi ketmoqda. Kechki ovqatda yog' miqdorini yengilroq tuting."
        actionLabel="Rejani ko'rish"
        onAction={() => setIsPlansDrawerOpen(true)}
      />
      <MicronutrientCard />
    </>
  );

  return (
    <NutritionLayout
      header={
        <NutritionPageHeader
          eyebrow="Ovqatlanish"
          title="Home"
          description="Bugungi kaloriya, suv, makro balans va meal log holati."
          actions={<NutritionDatePicker date={date} onChange={setDate} />}
        />
      }
      sidebar={sidebar}
    >
      {!isOnline ? (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-800 dark:text-amber-200">
          Tarmoq yo&apos;q — o&apos;zgarishlar saqlanmaydi
        </div>
      ) : null}

      {isPastDate ? (
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm font-semibold text-blue-800 dark:text-blue-200">
          O'tgan kun readonly ko'rinishda ochildi. Kerakli ovqatdagi plus
          tugmasi orqali uni bugungi kunga qo'shishingiz mumkin.
        </div>
      ) : null}

      <NutritionCard tone="accent" className="p-0">
        <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_280px] sm:p-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black">Bugungi Kaloriya</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Target: {metrics.targetCalories.toLocaleString()} kcal
                </p>
              </div>
              <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">
                +{metrics.calories.toLocaleString()} kcal
              </div>
            </div>
            <CalorieGaugeWidget
              consumed={roundedTotals.calories}
              goal={goals.calories}
              macros={metrics.macros}
              isGoalLoading={isGoalLoadingState}
              goalMeta={calorieGoalMeta}
              className="mt-4 h-fit w-full border-0 bg-transparent py-2 shadow-none ring-0"
            />
          </div>
          <div className="flex flex-col justify-center gap-3">
            <MacroBalanceCard macros={metrics.macros} />
          </div>
        </div>
      </NutritionCard>

      <MealTimeline
        filteredMealSections={filteredMealSections}
        mealConfig={mealConfig}
        activeMealType={activeMealType}
        disabled={addDisabled}
        onAdd={openAddMeal}
      />

      <QuickActionsBar actions={quickActions} />

      <NutritionCard>
        <NutritionPlansSection
          plans={plans}
          currentPlan={currentPlan}
          currentPlanDayStatus={currentPlanDayStatus}
          onOpenPlans={() => setIsPlansDrawerOpen(true)}
        />
      </NutritionCard>
    </NutritionLayout>
  );
}
