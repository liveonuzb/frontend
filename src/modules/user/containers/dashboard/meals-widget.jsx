import React from "react";
import {
  compact,
  entries,
  find,
  get,
  keyBy,
  map,
  reduce,
  size,
  some,
} from "lodash";
import { useNavigate } from "react-router";
import { useGetQuery } from "@/hooks/api";
import { useDailyTrackingActions } from "@/hooks/app/use-daily-tracking";
import { useSavedMeals } from "@/hooks/app/use-saved-meals";
import {
  buildLoggedMealFromSavedMealTemplate,
  getWeekdayNameFromDate,
  useSavedMealTemplates,
} from "@/hooks/app/use-saved-meal-templates";
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
import { Card } from "@/components/ui/card.jsx";

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

export default function MealsWidget({
  dateKey,
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
  const { addMeal } = useDailyTrackingActions();
  const { items: savedMeals } = useSavedMeals({ enabled: showQuickAdd });
  const { templates, recurringPatterns } = useSavedMealTemplates();
  const { data: trackingData } = useGetQuery({
    url: `/daily-tracking/${dateKey}`,
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
          className="h-8 rounded-full px-2 text-xs font-bold text-primary hover:bg-primary/10"
          onClick={() => (onOpen ? onOpen() : navigate("/user/nutrition"))}
        >
          Barchasi
        </Button>
      </div>
      <div className="flex flex-1 flex-col justify-start gap-3 md:gap-4">
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
          const detailsId = `dashboard-meal-${type}-details`;
          const label = get(config, "label");

          return (
            <Card
              key={type}
              className="group/meal  transition-all hover:bg-muted/30 hover:ring-1 hover:ring-primary/20"
            >
              <div className="flex items-center gap-3 p-3.5">
                <button
                  type="button"
                  aria-controls={detailsId}
                  aria-label={`${label} ${Math.round(calories)} kcal`}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex size-12 md:size-[52px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-background/50 shadow-sm ring-1 ring-border/60">
                    <div
                      className={cn(
                        get(config, "icon"),
                        "size-9 md:size-10 bg-contain bg-center bg-no-repeat",
                      )}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">
                      {label} qo'shish
                    </p>
                    <p className="mt-1 flex min-w-0 items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
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
                    </p>
                  </div>
                </button>

                {showQuickAdd ? (
                  <Button
                    type="button"
                    size="icon-lg"
                    variant="outline"
                    aria-label={`${label} qo'shish`}
                    className="shrink-0 rounded-full bg-background/70 text-primary hover:bg-primary/10 "
                    onClick={(event) => {
                      event.stopPropagation();
                      if (onAddMeal) {
                        onAddMeal(type);
                        return;
                      }
                      openActionDrawer({ mealType: type, dateKey });
                    }}
                  >
                    <PlusIcon className="size-5" />
                  </Button>
                ) : null}
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
