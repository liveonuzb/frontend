import React from "react";
import CalorieGaugeWidget from "@/components/calorie-gauge-widget";
import { Button } from "@/components/ui/button";
import {
  CalendarDaysIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  DropletsIcon,
  ShoppingCartIcon,
  TrophyIcon,
} from "lucide-react";
import NutritionPlansSection from "../nutrition-plans-section.jsx";
import NutritionLayout from "../ui/nutrition-layout.jsx";
import NutritionCard from "../ui/nutrition-card.jsx";
import StatCard from "../ui/stat-card.jsx";
import MealsWidget from "@/modules/user/containers/dashboard/meals-widget.jsx";
import { getProgressPercent } from "../ui/progress-bar-utils.js";
import { buildNutritionDashboardMetrics } from "../data/nutrition-data-mappers.js";

import {
  isArray,
  isFinite as isFiniteNumber,
  reduce,
  toNumber,
} from "lodash";

const getHealthScoreBadge = (score) => {
  const value = toNumber(score) || 0;

  if (value <= 0) {
    return "Boshlanmagan";
  }

  if (value < 40) {
    return "E'tibor kerak";
  }

  if (value < 70) {
    return "O'rtacha";
  }

  return "Yaxshi";
};

const toFiniteNumber = (value, fallback = 0) => {
  const numeric = toNumber(value);
  return isFiniteNumber(numeric) ? numeric : fallback;
};

const getProgressValue = (progress = {}, fallback = {}) => ({
  current: toFiniteNumber(progress.current, fallback.current || 0),
  target: toFiniteNumber(progress.target, fallback.target || 0),
});

const getProgressPercentValue = (progress = {}, fallback = {}) =>
  toFiniteNumber(
    progress.percent,
    getProgressPercent(
      toFiniteNumber(progress.current, fallback.current || 0),
      toFiniteNumber(progress.target, fallback.target || 0),
    ),
  );

const buildServerBackedMetrics = (dashboard, fallbackMetrics) => {
  if (!dashboard) {
    return fallbackMetrics;
  }

  const calories = getProgressValue(dashboard.calories, {
    current: fallbackMetrics.calories,
    target: fallbackMetrics.targetCalories,
  });
  const protein = getProgressValue(
    dashboard.macros?.protein,
    fallbackMetrics.macros.protein,
  );
  const carbs = getProgressValue(
    dashboard.macros?.carbs,
    fallbackMetrics.macros.carbs,
  );
  const fat = getProgressValue(
    dashboard.macros?.fat,
    fallbackMetrics.macros.fat,
  );
  const water = {
    current: toFiniteNumber(
      dashboard.water?.currentMl,
      fallbackMetrics.water.current,
    ),
    target: toFiniteNumber(
      dashboard.water?.targetMl,
      fallbackMetrics.water.target,
    ),
    percent: toFiniteNumber(
      dashboard.water?.percent,
      fallbackMetrics.water.percent,
    ),
  };
  const caloriePercent = getProgressPercentValue(dashboard.calories, calories);
  const proteinPercent = getProgressPercentValue(
    dashboard.macros?.protein,
    protein,
  );
  const waterPercent = getProgressPercentValue(dashboard.water, {
    current: water.current,
    target: water.target,
  });

  return {
    ...fallbackMetrics,
    calories: calories.current,
    targetCalories: calories.target,
    macros: {
      protein,
      carbs,
      fat,
    },
    water,
    healthScore: Math.round(
      (Math.min(caloriePercent, 100) +
        Math.min(proteinPercent, 100) +
        Math.min(waterPercent, 100)) /
        3,
    ),
    mealsCompleted: toFiniteNumber(
      dashboard.meals?.completed,
      fallbackMetrics.mealsCompleted,
    ),
    totalMeals: toFiniteNumber(
      dashboard.meals?.total,
      fallbackMetrics.totalMeals,
    ),
  };
};

const getSectionFoods = (section) =>
  isArray(section?.foods) ? section.foods : [];

const getSectionPlannedItems = (section) =>
  isArray(section?.plannedItems) ? section.plannedItems : [];

const getNextPlannedMeal = (mealSections = [], mealConfig = {}) => {
  const findPlannedMeal = (includeLogged) =>
    reduce(
      mealSections,
      (selected, [type, section]) => {
        if (selected) return selected;

        const plannedItems = getSectionPlannedItems(section);
        if (!plannedItems.length) return null;
        if (!includeLogged && getSectionFoods(section).length > 0) return null;

        return {
          type,
          label: mealConfig[type]?.label || type,
          itemName: plannedItems[0]?.name || "Rejadagi ovqat",
        };
      },
      null,
    );

  return findPlannedMeal(false) || findPlannedMeal(true);
};

const getPlanAdherencePercent = (mealSections = []) => {
  const stats = reduce(
    mealSections,
    (acc, [, section]) => {
      const plannedCount = getSectionPlannedItems(section).length;
      if (!plannedCount) return acc;

      return {
        planned: acc.planned + plannedCount,
        logged:
          acc.logged + Math.min(getSectionFoods(section).length, plannedCount),
      };
    },
    { planned: 0, logged: 0 },
  );

  return stats.planned > 0
    ? Math.round((stats.logged / stats.planned) * 100)
    : null;
};

const getShoppingStateLabel = (plan) => {
  const savedLists = isArray(plan?.shoppingLists) ? plan.shoppingLists : [];
  const directItems = isArray(plan?.shoppingList) ? plan.shoppingList : [];
  const latestItems = isArray(savedLists[0]?.items) ? savedLists[0].items : [];
  const itemCount = latestItems.length || directItems.length;

  if (itemCount > 0) {
    return `Xaridlar: ${itemCount} ta mahsulot`;
  }

  if (savedLists.length > 0) {
    return `Xaridlar: ${savedLists.length} ta ro'yxat`;
  }

  return "Xaridlar: hali yaratilmagan";
};

const PlanStatusCard = ({
  plans = [],
  currentPlan,
  currentPlanDayStatus,
  mealSections = [],
  mealConfig = {},
  onOpen,
  onOpenTodayPlan,
  onOpenShopping,
}) => {
  const hasPlan = Boolean(currentPlan?.id);
  const durationText = currentPlanDayStatus?.isDurationPlan
    ? `${currentPlanDayStatus.dayNumber || 1} / ${currentPlanDayStatus.durationDays || 1} kun`
    : `${plans.length} ta reja`;
  const nextPlannedMeal = React.useMemo(
    () => getNextPlannedMeal(mealSections, mealConfig),
    [mealConfig, mealSections],
  );
  const adherencePercent = React.useMemo(
    () => getPlanAdherencePercent(mealSections),
    [mealSections],
  );
  const shoppingStateLabel = getShoppingStateLabel(currentPlan);

  return (
    <NutritionCard className="p-4">
      <div className="flex items-start gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <ClipboardListIcon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase text-muted-foreground">
            Reja holati
          </p>
          <p className="mt-1 truncate text-base font-black">
            {hasPlan
              ? currentPlan.name || "Ovqatlanish rejasi"
              : "Reja ulanmagan"}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {hasPlan
              ? `${currentPlan.status === "active" ? "Faol" : "Saqlangan"} • ${durationText}`
              : "Reja tanlansa, bugungi ovqatlar shu yerda ko'rinadi."}
          </p>
        </div>
      </div>
      {hasPlan ? (
        <div className="mt-4 grid gap-2 text-xs">
          <div className="rounded-2xl bg-muted/35 px-3 py-2">
            <p className="font-bold text-muted-foreground">Keyingi ovqat</p>
            <p className="mt-1 truncate font-black">
              {nextPlannedMeal
                ? `${nextPlannedMeal.label}: ${nextPlannedMeal.itemName}`
                : "Bugun uchun reja bo'sh"}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-muted/35 px-3 py-2">
              <p className="font-black">
                Adherence{" "}
                {adherencePercent == null ? "0%" : `${adherencePercent}%`}
              </p>
            </div>
            <div className="rounded-2xl bg-muted/35 px-3 py-2">
              <p className="truncate font-black">{shoppingStateLabel}</p>
            </div>
          </div>
        </div>
      ) : null}
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <Button
          type="button"
          size="sm"
          className="rounded-full"
          disabled={!hasPlan}
          onClick={() => onOpenTodayPlan?.(nextPlannedMeal?.type || null)}
        >
          <CalendarDaysIcon data-icon="inline-start" />
          Bugungi reja
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="rounded-full"
          onClick={onOpen}
        >
          <ClipboardListIcon data-icon="inline-start" />
          Rejani ko'rish
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="rounded-full"
          disabled={!hasPlan}
          onClick={() => onOpenShopping?.(currentPlan?.id)}
        >
          <ShoppingCartIcon data-icon="inline-start" />
          Xaridlar
        </Button>
      </div>
    </NutritionCard>
  );
};

export default function NutritionHomeView(props) {
  const {
    date,
    plans = [],
    currentPlan,
    currentPlanDayStatus,
    dateKey,
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
    onOpenPlanShopping,
    filteredMealSections = [],
    mealConfig = {},
    isOnline,
    isPastDate,
    burnedCalories = 0,
    nutritionDashboard,
  } = props;
  const dayMeals = React.useMemo(
    () =>
      reduce(
        filteredMealSections,
        (meals, [type, section]) => {
          meals[type] = section?.foods || [];
          return meals;
        },
        {},
      ),
    [filteredMealSections],
  );
  const localMetrics = buildNutritionDashboardMetrics({
    roundedTotals,
    goals,
    waterConsumedMl,
    waterGoalMl,
    dayMeals,
  });
  const metrics = buildServerBackedMetrics(nutritionDashboard, localMetrics);
  const waterPercent = getProgressPercent(
    metrics.water.current,
    metrics.water.target,
  );
  const addDisabled = !isOnline || isPastDate;
  const openAddMeal = React.useCallback(
    (mealType = activeMealType) => {
      if (addDisabled) return;

      setSelectedMealTypeForAdd(mealType);
      setIsActionDrawerOpen(true);
    },
    [
      activeMealType,
      addDisabled,
      setIsActionDrawerOpen,
      setSelectedMealTypeForAdd,
    ],
  );
  const handleOpenTodayPlan = React.useCallback(
    (mealType) => {
      if (mealType) {
        openAddMeal(mealType);
      }
    },
    [openAddMeal],
  );
  const dashboardDayData = React.useMemo(
    () => ({
      date: dateKey,
      meals: dayMeals,
    }),
    [dateKey, dayMeals],
  );
  const dashboardGoalsState = React.useMemo(
    () => ({
      goals,
    }),
    [goals],
  );
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
        badge={getHealthScoreBadge(metrics.healthScore)}
        description="Kaloriya, oqsil va suv progressi asosida."
        tone="success"
      />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
        <StatCard
          icon={CheckCircle2Icon}
          label="Ovqatlar yakunlandi"
          value={`${metrics.mealsCompleted} / ${metrics.totalMeals}`}
          description="Bugungi ovqat bo'limlari"
          tone="primary"
        />
      </div>
      <PlanStatusCard
        plans={plans}
        currentPlan={currentPlan}
        currentPlanDayStatus={currentPlanDayStatus}
        mealSections={filteredMealSections}
        mealConfig={mealConfig}
        onOpen={() => setIsPlansDrawerOpen(true)}
        onOpenTodayPlan={handleOpenTodayPlan}
        onOpenShopping={onOpenPlanShopping}
      />
    </>
  );

  return (
    <NutritionLayout sidebar={sidebar}>
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

      <CalorieGaugeWidget
        burnedCalories={burnedCalories}
        consumed={metrics.calories}
        goal={metrics.targetCalories}
        macros={metrics.macros}
        isGoalLoading={isGoalLoadingState}
        goalMeta={calorieGoalMeta}
        showCalorieModeToggle
        defaultCalorieMode="remaining"
        className="h-fit w-full"
      />

      <MealsWidget
        dateKey={dateKey}
        selectedDate={date}
        activeMealPlan={currentPlan}
        dayData={dashboardDayData}
        goalsState={dashboardGoalsState}
        onAddMeal={openAddMeal}
      />

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
