import React from "react";
import compact from "lodash/compact";
import entries from "lodash/entries";
import find from "lodash/find";
import get from "lodash/get";
import keyBy from "lodash/keyBy";
import map from "lodash/map";
import reduce from "lodash/reduce";
import size from "lodash/size";
import some from "lodash/some";
import { useNavigate } from "react-router";
import { useGetQuery } from "@/hooks/api";
import {
  NUTRITION_TRACKING_API_ROOT,
  nutritionApiPath,
} from "@/hooks/app/nutrition-api-paths";
import { useDailyTrackingActions } from "@/hooks/app/use-daily-tracking";
import { useSavedMeals } from "@/hooks/app/use-saved-meals";
import {
  buildLoggedMealFromSavedMealTemplate,
  getWeekdayNameFromDate,
  useSavedMealTemplates,
} from "@/hooks/app/use-saved-meal-templates";
import { resolvePlanColumnsForDate } from "@/modules/user/containers/nutrition/nutrition-plan-days.js";
import { buildPlannedByType } from "@/modules/user/containers/nutrition/nutrition-meal-section-state.js";
import { useAddMealOverlayStore } from "@/store";
import { FlameIcon, PlusIcon } from "lucide-react";
import {
  DASHBOARD_HEALTH_GOALS_QUERY_KEY,
  getDashboardDayQueryKey,
  getDayDataFromResponse,
  getGoalsStateFromResponses,
  toNonNegativeNumber,
  toPositiveNumber,
} from "./query-helpers.js";
import { Button } from "@/components/ui/button.jsx";
import { cn } from "@/lib/utils.js";
import { toast } from "sonner";
import DashboardMealDetailsDrawer from "./meal-details-drawer.jsx";

const mealTypeConfig = {
  breakfast: { label: "Nonushta", icon: "breakfast" },
  lunch: { label: "Tushlik", icon: "lunch" },
  dinner: { label: "Kechki ovqat", icon: "dinner" },
  snack: { label: "Snack", icon: "snack" },
};

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
      className="relative flex size-14 md:size-[60px] shrink-0 items-center justify-center"
      data-testid={`dashboard-meal-progress-ring-${type}`}
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
      <span className="relative flex size-11 md:size-12 items-center justify-center overflow-hidden rounded-full bg-background/50 shadow-sm ring-1 ring-border/60">
        <span
          className={cn(
            icon,
            "size-8 md:size-9 bg-contain bg-center bg-no-repeat",
          )}
        />
      </span>
    </span>
  );
}

export default function MealsWidget({
  dateKey,
  selectedDate,
  activeMealPlan,
  dayData: dayDataOverride,
  goalsState: goalsStateOverride,
  onOpen,
  onAddMeal,
  showQuickAdd = true,
}) {
  const navigate = useNavigate();
  const openActionDrawer = useAddMealOverlayStore(
    (state) => state.openActionDrawer,
  );
  const [selectedMealType, setSelectedMealType] = React.useState(null);
  const { addMeal } = useDailyTrackingActions();
  const { items: savedMeals } = useSavedMeals({ enabled: showQuickAdd });
  const { templates, recurringPatterns } = useSavedMealTemplates();
  const { data: trackingData } = useGetQuery({
    url: nutritionApiPath(NUTRITION_TRACKING_API_ROOT, dateKey),
    queryProps: {
      queryKey: getDashboardDayQueryKey(dateKey),
      enabled: dayDataOverride === undefined && Boolean(dateKey),
    },
  });
  const { data: goalsData } = useGetQuery({
    url: "/health-goals",
    queryProps: {
      queryKey: DASHBOARD_HEALTH_GOALS_QUERY_KEY,
      enabled: goalsStateOverride === undefined,
    },
  });
  const dayData = React.useMemo(
    () => dayDataOverride ?? getDayDataFromResponse(trackingData, dateKey),
    [dateKey, dayDataOverride, trackingData],
  );
  const { goals } = React.useMemo(
    () =>
      goalsStateOverride ??
      getGoalsStateFromResponses({ goalsResponse: goalsData, user: null }),
    [goalsData, goalsStateOverride],
  );
  const savedMealsById = React.useMemo(
    () => keyBy(savedMeals, "id"),
    [savedMeals],
  );
  const templatesById = React.useMemo(
    () => keyBy(templates, "id"),
    [templates],
  );
  const suggestedPattern = React.useMemo(() => {
    const weekday = getWeekdayNameFromDate(dateKey);
    return (
      find(recurringPatterns, (pattern) => {
        if (pattern.weekday !== weekday) return false;
        const template = templatesById[pattern.templateId];
        if (!template) return false;
        const foods = get(dayData, ["meals", pattern.mealKey], []);
        if (size(foods) > 0) return false;
        return some(
          get(template, "mealIds", []),
          (mealId) => savedMealsById[mealId],
        );
      }) || null
    );
  }, [dateKey, dayData, recurringPatterns, savedMealsById, templatesById]);
  const suggestedTemplate = suggestedPattern
    ? templatesById[suggestedPattern.templateId]
    : null;
  const planDate = React.useMemo(
    () => selectedDate || new Date(`${dateKey}T12:00:00`),
    [dateKey, selectedDate],
  );
  const selectedDay = React.useMemo(
    () => getWeekdayNameFromDate(dateKey),
    [dateKey],
  );
  const currentDayPlan = React.useMemo(
    () =>
      activeMealPlan
        ? resolvePlanColumnsForDate(activeMealPlan, planDate, selectedDay)
        : [],
    [activeMealPlan, planDate, selectedDay],
  );
  const plannedByType = React.useMemo(
    () => buildPlannedByType(currentDayPlan),
    [currentDayPlan],
  );
  const selectedMealConfig = selectedMealType
    ? mealTypeConfig[selectedMealType]
    : null;

  const handleAddMeal = React.useCallback(
    (type) => {
      if (onAddMeal) {
        onAddMeal(type);
        return;
      }
      openActionDrawer({ mealType: type, dateKey });
    },
    [dateKey, onAddMeal, openActionDrawer],
  );

  const handleApplySuggestedPattern = React.useCallback(async () => {
    if (!suggestedPattern || !suggestedTemplate) return;

    const mealsToLog = compact(
      map(
        get(suggestedTemplate, "mealIds", []),
        (mealId) => savedMealsById[mealId],
      ),
    );

    if (size(mealsToLog) === 0) {
      toast.error("Shablondagi taomlar topilmadi");
      return;
    }

    try {
      for (const savedMeal of mealsToLog) {
        await addMeal(
          dateKey,
          suggestedPattern.mealKey,
          buildLoggedMealFromSavedMealTemplate(savedMeal),
        );
      }
      toast.success(`${suggestedTemplate.name} qo'shildi`);
    } catch {
      toast.error("Odatiy shablonni qo'shib bo'lmadi");
    }
  }, [addMeal, dateKey, savedMealsById, suggestedPattern, suggestedTemplate]);

  return (
    <>
      <section
        className="min-h-0 w-full flex-1 space-y-2 md:space-y-3 meals-widget"
        aria-labelledby="dashboard-meals-title"
        data-testid="dashboard-meals-widget"
      >
        <div className="flex items-center justify-between px-1">
          <h2 id="dashboard-meals-title" className="text-base font-bold">
            Ovqatlar
          </h2>
          <Button
            variant="ghost"
            type="button"
            aria-label="Ovqatlanish sahifasini ochish"
            className="h-8 rounded-full px-2 text-xs font-bold text-primary hover:bg-transparent hover:text-primary dark:hover:bg-transparent"
            onClick={() => (onOpen ? onOpen() : navigate("/user/nutrition"))}
          >
            Barchasi
          </Button>
        </div>
        <div className="flex flex-1 flex-col justify-start gap-2.5 md:gap-3">
          {suggestedPattern && suggestedTemplate ? (
            <div className="rounded-2xl border bg-primary/5 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold">
                    Bugun {suggestedPattern.weekday} — siz odatda{" "}
                    {suggestedTemplate.name} yeysiz
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {suggestedPattern.mealType} uchun{" "}
                    {size(get(suggestedTemplate, "mealIds", []))} ta taom
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="shrink-0"
                  onClick={handleApplySuggestedPattern}
                >
                  Qo'shish
                </Button>
              </div>
            </div>
          ) : null}
          {map(entries(mealTypeConfig), ([type = "", config = {}]) => {
            const foods = get(dayData, ["meals", type], []);

            const calories = reduce(
              foods,
              (sum, food) =>
                sum +
                toNonNegativeNumber(get(food, "cal"), 0) *
                  toPositiveNumber(get(food, "qty"), 1),
              0,
            );

            const mealGoal = Math.round(
              get(goals, "calories", 0) * get(mealPctGoal, type, 0.25),
            );

            const recommendedMin = Math.max(0, Math.round(mealGoal * 0.85));
            const recommendedMax = Math.max(
              recommendedMin,
              Math.round(mealGoal * 1.15),
            );
            const mealProgress =
              mealGoal > 0
                ? Math.min(100, Math.round((calories / mealGoal) * 100))
                : 0;
            const detailsId = `dashboard-meal-${type}-details`;
            const label = get(config, "label");

            return (
              <div
                key={type}
                className="overflow-hidden rounded-2xl bg-card text-card-foreground text-sm"
              >
                <div
                  data-testid={`dashboard-meal-card-content-${type}`}
                  className="flex items-center gap-2.5 px-3 py-2.5"
                >
                  <button
                    type="button"
                    aria-controls={detailsId}
                    aria-label={`${label} ${Math.round(calories)} kcal`}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => setSelectedMealType(type)}
                  >
                    <MealProgressIcon
                      type={type}
                      icon={get(config, "icon")}
                      label={label}
                      progress={mealProgress}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">
                        {label} qo'shish
                      </span>
                      <span className="mt-1 flex min-w-0 items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                        {calories > 0 ? (
                          <>
                            <FlameIcon className="size-3 text-primary" />
                            <span className="shrink-0">
                              {Math.round(calories)} kcal
                            </span>
                            <span aria-hidden="true">|</span>
                          </>
                        ) : null}
                        <span className="truncate">
                          Tavsiya etiladi
                          {mealGoal > 0
                            ? ` | ${recommendedMin} - ${recommendedMax} kcal`
                            : ""}
                        </span>
                      </span>
                    </span>
                  </button>

                  {showQuickAdd ? (
                    <button
                      type="button"
                      aria-label={`${label} qo'shish`}
                      className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-background/70 text-primary outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleAddMeal(type);
                      }}
                    >
                      <PlusIcon className="size-5" />
                    </button>
                  ) : null}
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
          mealLabel={get(selectedMealConfig, "label", "Ovqat")}
          loggedItems={get(dayData, ["meals", selectedMealType], [])}
          plannedItems={get(plannedByType, selectedMealType, [])}
          onAddMeal={(type) => {
            handleAddMeal(type);
            setSelectedMealType(null);
          }}
        />
      ) : null}
    </>
  );
}
