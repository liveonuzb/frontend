import React from "react";
import CalorieGaugeWidget from "@/components/calorie-gauge-widget";
import { Button } from "@/components/ui/button";
import {
  CalendarDaysIcon,
  ChevronDownIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  DropletsIcon,
  FlameIcon,
  PlusIcon,
  TrophyIcon,
} from "lucide-react";
import NutritionPlansSection from "../nutrition-plans-section.jsx";
import NutritionLayout from "../ui/nutrition-layout.jsx";
import NutritionCard from "../ui/nutrition-card.jsx";
import StatCard from "../ui/stat-card.jsx";
import { getProgressPercent } from "../ui/progress-bar.jsx";
import { buildNutritionDashboardMetrics } from "../data/nutrition-data-mappers.js";
import { cn } from "@/lib/utils.js";

import { map, reduce, toNumber } from "lodash";

const mealPctGoal = {
  breakfast: 0.3,
  lunch: 0.35,
  dinner: 0.25,
  snack: 0.1,
};

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
  const mealGoal = Math.round(toNumber(caloriesGoal || 0) * (mealPctGoal[mealType] || 0.25));

  if (mealGoal <= 0) {
    return "Tavsiya etiladi";
  }

  const min = Math.max(0, Math.round(mealGoal * 0.85));
  const max = Math.max(min, Math.round(mealGoal * 1.15));
  return `Tavsiya etiladi | ${min} - ${max} kcal`;
};

const getMealStatusMeta = ({ isActive, foodCount, readOnly }) => {
  if (readOnly) {
    return {
      label: foodCount > 0 ? "Yozilgan" : "Bo'sh",
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

  return {
    label: "Kutilmoqda",
    className: "bg-muted text-muted-foreground",
  };
};

const PlanStatusCard = ({
  plans = [],
  currentPlan,
  currentPlanDayStatus,
  onOpen,
}) => {
  const hasPlan = Boolean(currentPlan?.id);
  const durationText = currentPlanDayStatus?.isDurationPlan
    ? `${currentPlanDayStatus.dayNumber || 1} / ${currentPlanDayStatus.durationDays || 1} kun`
    : `${plans.length} ta reja`;

  return (
    <NutritionCard className="px-4 py-4">
      <div className="flex items-start gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <ClipboardListIcon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase text-muted-foreground">
            Reja holati
          </p>
          <p className="mt-1 truncate text-base font-black">
            {hasPlan ? currentPlan.name || "Ovqatlanish rejasi" : "Reja ulanmagan"}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {hasPlan
              ? `${currentPlan.status === "active" ? "Faol" : "Saqlangan"} • ${durationText}`
              : "Meal plan tanlansa, bugungi ovqatlar shu yerda ko'rinadi."}
          </p>
        </div>
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="mt-4 w-full rounded-full"
        onClick={onOpen}
      >
        Rejalarni ko'rish
      </Button>
    </NutritionCard>
  );
};

const OverviewHeader = ({
  selectedDateLabel = "Bugun",
  isPastDate,
  onOpenCalendar = () => {},
}) => (
  <div className="flex items-center justify-between gap-3">
    <div className="min-w-0">
      <h1 className="text-2xl font-black tracking-normal">Overview</h1>
      <p className="mt-1 truncate text-sm font-medium text-muted-foreground">
        {isPastDate ? "Tanlangan kun" : "Bugungi tracking"} • {selectedDateLabel}
      </p>
    </div>
    <Button
      type="button"
      variant="outline"
      size="icon-lg"
      className="size-11 shrink-0 rounded-full bg-card/80 shadow-none hover:shadow-none"
      onClick={onOpenCalendar}
      aria-label={`Sana tanlash: ${selectedDateLabel}`}
    >
      <CalendarDaysIcon className="size-5" />
    </Button>
  </div>
);

const CollapsibleMealList = ({
  filteredMealSections,
  mealConfig,
  activeMealType,
  goals,
  disabled,
  onAdd,
}) => {
  const firstMealType = filteredMealSections[0]?.[0] || activeMealType;
  const [requestedExpandedMealType, setRequestedExpandedMealType] =
    React.useState(null);
  const availableMealTypes = React.useMemo(
    () => map(filteredMealSections, ([type]) => type),
    [filteredMealSections],
  );
  const expandedMealType = availableMealTypes.includes(requestedExpandedMealType)
    ? requestedExpandedMealType
    : availableMealTypes.includes(activeMealType)
      ? activeMealType
      : firstMealType;

  return (
    <NutritionCard className="overflow-hidden p-0">
      <div className="flex items-center justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
        <div className="min-w-0">
          <p className="text-sm font-black">Bugungi ovqatlar</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Vaqt bo'yicha yozilgan ovqatlar
          </p>
        </div>
      </div>
      <div className="mt-3 divide-y divide-border/55">
        {map(filteredMealSections, ([type, section]) => {
          const config = mealConfig[type] || {};
          const foods = section.foods || [];
          const totals = getMealNutritionTotals(foods);
          const calories = Math.round(totals.calories);
          const isActive = type === activeMealType;
          const isExpanded = type === expandedMealType;
          const detailsId = `nutrition-meal-${type}-details`;
          const statusMeta = getMealStatusMeta({
            isActive,
            foodCount: foods.length,
            readOnly: disabled,
          });

          return (
            <div
              key={type}
              data-testid={`nutrition-meal-timeline-row-${type}`}
              className="transition-colors hover:bg-muted/25"
            >
              <div className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
                <button
                  type="button"
                  aria-label={`${config.label || type} tafsilotlari`}
                  aria-expanded={isExpanded}
                  aria-controls={detailsId}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => setRequestedExpandedMealType(type)}
                >
                  <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-full bg-background/50 text-lg shadow-sm ring-1 ring-border/60">
                    <span aria-hidden="true">{config.emoji || "o"}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-bold">
                        {config.label}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${statusMeta.className}`}
                      >
                        {statusMeta.label}
                      </span>
                    </div>
                    <p className="mt-1 flex min-w-0 items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
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
                    </p>
                  </div>
                  <ChevronDownIcon
                    className={cn(
                      "size-4 shrink-0 text-muted-foreground transition-transform",
                      isExpanded && "rotate-180",
                    )}
                    aria-hidden="true"
                  />
                </button>
                <Button
                  type="button"
                  size="icon-lg"
                  variant="outline"
                  className="size-11 shrink-0 rounded-full bg-background/70 text-primary hover:bg-primary/10"
                  disabled={disabled}
                  aria-label={`${config.label || type} uchun ovqat qo'shish`}
                  onClick={() => onAdd(type)}
                >
                  <PlusIcon className="size-5" />
                </Button>
              </div>

              {isExpanded ? (
                <div
                  id={detailsId}
                  className="px-4 pb-4 pl-[5.25rem] pr-4 sm:px-5 sm:pl-[5.75rem]"
                >
                  {foods.length > 0 ? (
                    <div className="space-y-2">
                      {map(foods, (food, index) => (
                        <div
                          key={food.id || `${type}-${index}`}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/55 px-3 py-2"
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            <div className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-muted text-xs">
                              {food.image ? (
                                <img
                                  src={food.image}
                                  alt=""
                                  className="size-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <span>{config.emoji || "o"}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold">
                                {food.name || "Ovqat"}
                              </p>
                              <p className="truncate text-[11px] font-medium text-muted-foreground">
                                {section.time || config.time}
                              </p>
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-sm font-black tabular-nums">
                              {Math.round(
                                toNumber(food.cal || 0) *
                                  (toNumber(food.qty || 1) || 1),
                              )}
                            </p>
                            <p className="text-[10px] font-bold uppercase text-muted-foreground">
                              kcal
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border/70 bg-muted/25 px-3 py-3 text-sm font-semibold text-muted-foreground">
                      Hali ovqat qo'shilmagan
                    </div>
                  )}

                  <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] font-bold text-muted-foreground">
                    <span className="rounded-full bg-muted/40 px-2.5 py-1">
                      Oqsil {Math.round(totals.protein)}g
                    </span>
                    <span className="rounded-full bg-muted/40 px-2.5 py-1">
                      Uglevod {Math.round(totals.carbs)}g
                    </span>
                    <span className="rounded-full bg-muted/40 px-2.5 py-1">
                      Yog' {Math.round(totals.fat)}g
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </NutritionCard>
  );
};

export default function NutritionHomeView(props) {
  const {
    plans = [],
    currentPlan,
    currentPlanDayStatus,
    selectedDateLabel,
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
    onOpenCalendar,
    filteredMealSections = [],
    mealConfig = {},
    isOnline,
    isPastDate,
  } = props;
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
      </div>
      <PlanStatusCard
        plans={plans}
        currentPlan={currentPlan}
        currentPlanDayStatus={currentPlanDayStatus}
        onOpen={() => setIsPlansDrawerOpen(true)}
      />
    </>
  );

  return (
    <NutritionLayout sidebar={sidebar}>
      <OverviewHeader
        selectedDateLabel={selectedDateLabel}
        isPastDate={isPastDate}
        onOpenCalendar={onOpenCalendar}
      />

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
        consumed={roundedTotals.calories}
        goal={goals.calories}
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
        activeMealType={activeMealType}
        goals={goals}
        disabled={addDisabled}
        onAdd={openAddMeal}
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
