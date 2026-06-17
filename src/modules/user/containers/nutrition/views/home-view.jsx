import React from "react";
import CalorieGaugeWidget from "@/components/calorie-gauge-widget";
import { Button } from "@/components/ui/button";
import {
  CalendarDaysIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  Clock3Icon,
  DropletsIcon,
  FlameIcon,
  PlusIcon,
  ShoppingCartIcon,
  TrophyIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import NutritionPlansSection from "../nutrition-plans-section.jsx";
import NutritionLayout from "../ui/nutrition-layout.jsx";
import NutritionCard from "../ui/nutrition-card.jsx";
import StatCard from "../ui/stat-card.jsx";
import DashboardMealDetailsDrawer from "@/modules/user/containers/dashboard/meal-details-drawer.jsx";
import { getProgressPercent } from "../ui/progress-bar-utils.js";
import { buildNutritionDashboardMetrics } from "../data/nutrition-data-mappers.js";

import {
  isArray,
  isFinite as isFiniteNumber,
  map,
  reduce,
  toNumber,
} from "lodash";

const mealPctGoal = {
  breakfast: 0.3,
  lunch: 0.35,
  dinner: 0.25,
  snack: 0.1,
};

const mealProgressRingRadius = 21;
const mealProgressRingCircumference = 2 * Math.PI * mealProgressRingRadius;

function MealProgressIcon({ type, icon, label, progress }) {
  const safeProgress = Math.max(0, Math.min(100, progress || 0));
  const strokeDashoffset =
    mealProgressRingCircumference -
    (safeProgress / 100) * mealProgressRingCircumference;

  return (
    <span
      className="relative flex size-14 shrink-0 items-center justify-center"
      data-testid={`nutrition-meal-progress-ring-${type}`}
    >
      <svg
        role="progressbar"
        aria-label={`${label} kaloriya progress`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={safeProgress}
        className="absolute inset-0 size-full -rotate-90"
        viewBox="0 0 48 48"
        focusable="false"
      >
        <circle
          cx="24"
          cy="24"
          r={mealProgressRingRadius}
          className="stroke-current text-primary/10"
          fill="none"
          strokeWidth="4"
        />
        <circle
          cx="24"
          cy="24"
          r={mealProgressRingRadius}
          className="stroke-current text-primary transition-all duration-300"
          fill="none"
          strokeLinecap="round"
          strokeWidth="4"
          strokeDasharray={mealProgressRingCircumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      <span className="relative flex size-11 items-center justify-center overflow-hidden rounded-full bg-background/50 shadow-sm ring-1 ring-border/60">
        <span
          data-testid={`nutrition-meal-icon-image-${type}`}
          className={cn(
            icon,
            "size-8 bg-contain bg-center bg-no-repeat",
          )}
        />
      </span>
    </span>
  );
}

const getMealNutritionTotals = (items = []) =>
  reduce(
    items,
    (totals, food) => {
      const qty = toNumber(food.qty || 1) || 1;
      return {
        calories: totals.calories + toNumber(food.cal || 0) * qty,
        protein: totals.protein + toNumber(food.protein || 0) * qty,
        carbs: totals.carbs + toNumber(food.carbs || 0) * qty,
        fat: totals.fat + toNumber(food.fat || 0) * qty,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

const getRecommendedRange = (mealType, caloriesGoal) => {
  const mealGoal = Math.round(
    toNumber(caloriesGoal || 0) * (mealPctGoal[mealType] || 0.25),
  );

  if (mealGoal <= 0) {
    return "Tavsiya etiladi";
  }

  const min = Math.max(0, Math.round(mealGoal * 0.85));
  const max = Math.max(min, Math.round(mealGoal * 1.15));
  return `Tavsiya etiladi | ${min} - ${max} kcal`;
};

const getMealStatusMeta = ({
  isActive,
  foodCount,
  plannedCount = 0,
  readOnly,
}) => {
  if (readOnly) {
    return {
      label:
        foodCount > 0 ? "Yozilgan" : plannedCount > 0 ? "Rejada" : "Bo'sh",
      className: "bg-muted text-muted-foreground",
    };
  }

  if (isActive) {
    return {
      label: "Hozir",
      className: "bg-primary/10 text-primary",
    };
  }

  if (foodCount > 0) {
    return {
      label: "Yozildi",
      className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    };
  }

  if (plannedCount > 0) {
    return {
      label: "Rejada",
      className: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
    };
  }

  return {
    label: "Kutilmoqda",
    className: "bg-muted text-muted-foreground",
  };
};

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

const getMealAddedAtValue = (food) =>
  food?.addedAt || food?.loggedAt || food?.createdAt || food?.updatedAt || null;

const getMealTimeLabel = (value) => {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
};

const getLastAddedTimeLabel = (foods = []) => {
  const latestTimestamp = reduce(
    foods,
    (latest, food) => {
      const value = getMealAddedAtValue(food);
      const date = value instanceof Date ? value : new Date(value);

      if (Number.isNaN(date.getTime())) return latest;
      return Math.max(latest, date.getTime());
    },
    0,
  );

  return latestTimestamp > 0 ? getMealTimeLabel(new Date(latestTimestamp)) : null;
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
    <NutritionCard className="p-4" data-testid="nutrition-active-plan-card">
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

const CollapsibleMealList = ({
  filteredMealSections,
  mealConfig,
  activeMealType,
  goals,
  dateKey,
  disabled,
  onAdd,
  selectedDateLabel = "Bugun",
  isPastDate = false,
}) => {
  const [selectedMealType, setSelectedMealType] = React.useState(null);
  const completedMeals = React.useMemo(
    () =>
      reduce(
        filteredMealSections,
        (count, [, section]) =>
          count + ((section?.foods || []).length > 0 ? 1 : 0),
        0,
      ),
    [filteredMealSections],
  );
  const selectedMealSection = React.useMemo(
    () =>
      reduce(
        filteredMealSections,
        (match, [type, section]) =>
          match || (type === selectedMealType ? section : null),
        null,
      ) || {},
    [filteredMealSections, selectedMealType],
  );
  const selectedMealConfig = selectedMealType
    ? mealConfig[selectedMealType] || {}
    : {};

  React.useEffect(() => {
    if (!selectedMealType) return;

    const isSelectedMealVisible = reduce(
      filteredMealSections,
      (isVisible, [type]) => isVisible || type === selectedMealType,
      false,
    );

    if (!isSelectedMealVisible) {
      setSelectedMealType(null);
    }
  }, [filteredMealSections, selectedMealType]);

  return (
    <>
      <section className="space-y-2.5" aria-labelledby="nutrition-meals-title">
        <div className="flex items-center justify-between gap-3 px-1">
          <div className="min-w-0">
            <h2 id="nutrition-meals-title" className="text-base font-bold">
              {isPastDate ? "Tanlangan kun ovqatlari" : "Bugungi ovqatlar"}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {selectedDateLabel} uchun vaqt bo'yicha yozuvlar
            </p>
          </div>
          <span
            data-testid="nutrition-meal-timeline-summary"
            className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[11px] font-black text-muted-foreground"
          >
            {completedMeals}/{filteredMealSections.length || 4}
          </span>
        </div>
        <div
          data-testid="nutrition-meal-dashboard-list"
          className="flex flex-col gap-2.5 md:gap-3"
        >
          {map(filteredMealSections, ([type, section]) => {
            const config = mealConfig[type] || {};
            const foods = section.foods || [];
            const plannedItems = section.plannedItems || [];
            const visibleItems = foods.length > 0 ? foods : plannedItems;
            const totals = getMealNutritionTotals(visibleItems);
            const calories = Math.round(totals.calories);
            const mealGoal = Math.round(
              toNumber(goals?.calories || 0) * (mealPctGoal[type] || 0.25),
            );
            const mealProgress =
              mealGoal > 0
                ? Math.min(100, Math.round((calories / mealGoal) * 100))
                : 0;
            const detailsId = `nutrition-meal-${type}-details`;
            const lastAddedTimeLabel = getLastAddedTimeLabel(foods);
            const statusMeta = getMealStatusMeta({
              isActive: type === activeMealType,
              foodCount: foods.length,
              plannedCount: plannedItems.length,
              readOnly: disabled,
            });

            return (
              <div
                key={type}
                data-testid={`nutrition-meal-timeline-row-${type}`}
                className="overflow-hidden rounded-2xl bg-card text-card-foreground text-sm"
              >
                <div
                  data-testid={`nutrition-meal-dashboard-row-content-${type}`}
                  className="flex items-center gap-2.5 px-3 py-2.5"
                >
                  <button
                    type="button"
                    aria-label={`${config.label || type} tafsilotlari`}
                    aria-controls={detailsId}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => setSelectedMealType(type)}
                  >
                    <MealProgressIcon
                      type={type}
                      icon={config.icon || type}
                      label={config.label || type}
                      progress={mealProgress}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="block min-w-0 flex-1 truncate text-sm font-bold">
                          {config.label} qo'shish
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${statusMeta.className}`}
                        >
                          {statusMeta.label}
                        </span>
                      </span>
                      <span className="mt-1 flex min-w-0 items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                        {calories > 0 ? (
                          <>
                            <FlameIcon className="size-3 text-primary" />
                            <span className="shrink-0">{calories} kcal</span>
                            <span aria-hidden="true">|</span>
                          </>
                        ) : null}
                        <span className="truncate">
                          {getRecommendedRange(type, goals?.calories)}
                        </span>
                        {lastAddedTimeLabel ? (
                          <>
                            <span aria-hidden="true">|</span>
                            <Clock3Icon className="size-3" />
                            <span className="shrink-0">
                              Oxirgi {lastAddedTimeLabel}
                            </span>
                          </>
                        ) : null}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-background/70 text-primary outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                    disabled={disabled}
                    aria-label={`${config.label || type} uchun ovqat qo'shish`}
                    onClick={() => onAdd(type)}
                  >
                    <PlusIcon className="size-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      {selectedMealType ? (
        <DashboardMealDetailsDrawer
          open={Boolean(selectedMealType)}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              setSelectedMealType(null);
            }
          }}
          dateKey={dateKey}
          mealType={selectedMealType}
          mealLabel={selectedMealConfig.label || "Ovqat"}
          loggedItems={selectedMealSection.foods || []}
          plannedItems={selectedMealSection.plannedItems || []}
          addDisabled={disabled}
          onAddMeal={(type) => {
            onAdd(type);
            setSelectedMealType(null);
          }}
        />
      ) : null}
    </>
  );
};

export default function NutritionHomeView(props) {
  const {
    plans = [],
    currentPlan,
    currentPlanDayStatus,
    selectedDateLabel,
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
  const [focusedPlanMealType, setFocusedPlanMealType] = React.useState(null);
  const timelineActiveMealType = focusedPlanMealType || activeMealType;
  const openAddMeal = (mealType = activeMealType) => {
    setSelectedMealTypeForAdd(mealType);
    setIsActionDrawerOpen(true);
  };
  const handleOpenTodayPlan = React.useCallback((mealType) => {
    if (mealType) {
      setFocusedPlanMealType(mealType);
    }
  }, []);
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

      <CollapsibleMealList
        filteredMealSections={filteredMealSections}
        mealConfig={mealConfig}
        activeMealType={timelineActiveMealType}
        goals={goals}
        dateKey={dateKey}
        disabled={addDisabled}
        onAdd={openAddMeal}
        selectedDateLabel={selectedDateLabel}
        isPastDate={isPastDate}
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
