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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowRightIcon,
  ChevronDownIcon,
  FlameIcon,
  PlusIcon,
  UtensilsIcon,
} from "lucide-react";
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
  const [expandedMealTypes, setExpandedMealTypes] = React.useState({});
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
  const toggleMealType = React.useCallback((mealType) => {
    setExpandedMealTypes((current) => ({
      ...current,
      [mealType]: !current[mealType],
    }));
  }, []);

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
    <Card className="min-h-0 w-full flex-1 gap-4 py-4 meals-widget">
      <CardHeader className="px-5">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <UtensilsIcon className="size-4 text-orange-500" />
            Ovqatlar
          </CardTitle>
          <Button
            variant="outline"
            type="button"
            aria-label="Ovqatlanish sahifasini ochish"
            className="flex size-8 w-10 items-center justify-center rounded-md bg-muted transition-colors hover:bg-muted/80"
            onClick={() => (onOpen ? onOpen() : navigate("/user/nutrition"))}
          >
            <ArrowRightIcon className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-start gap-5 px-5">
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

          const progress = mealGoal > 0 ? Math.min(calories / mealGoal, 1) : 0;
          const ringSize = 52;
          const ringRadius = 23;
          const ringStroke = 4;
          const circumference = 2 * Math.PI * ringRadius;
          const dashOffset = circumference * (1 - progress);
          const gradientId = `dashboardMealRingGrad-${type}`;
          const isExpanded = Boolean(expandedMealTypes[type]);
          const detailsId = `dashboard-meal-${type}-details`;

          return (
            <div
              key={type}
              className="group/meal rounded-2xl transition-colors"
            >
              <div className="flex items-center gap-3 py-0.5">
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  aria-controls={detailsId}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => toggleMealType(type)}
                >
                  <div
                    className="relative shrink-0"
                    style={{ width: ringSize, height: ringSize }}
                  >
                    <svg
                      width={ringSize}
                      height={ringSize}
                      className="rotate-[-90deg]"
                    >
                      <circle
                        cx={ringSize / 2}
                        cy={ringSize / 2}
                        r={ringRadius}
                        fill="none"
                        stroke="#efd8b7"
                        strokeWidth={ringStroke}
                      />
                      <circle
                        cx={ringSize / 2}
                        cy={ringSize / 2}
                        r={ringRadius}
                        fill="none"
                        stroke={`url(#${gradientId})`}
                        strokeWidth={ringStroke}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashOffset}
                        className="transition-all duration-700"
                      />
                      <defs>
                        <linearGradient
                          id={gradientId}
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="0%"
                        >
                          <stop offset="0%" stopColor="#d7e8b8" />
                          <stop offset="100%" stopColor="#5fb34e" />
                        </linearGradient>
                      </defs>
                    </svg>

                    <div className="absolute left-1/2 top-1/2 flex size-[42px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-secondary shadow-inner">
                      <div
                        className={cn(
                          get(config, "icon"),
                          "size-7 bg-contain bg-center bg-no-repeat",
                        )}
                      />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">{get(config, "label")}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <FlameIcon className="size-3 text-orange-400" />
                      {calories > 0 ? `${calories} kcal` : "0 kcal"}
                    </p>
                  </div>
                  <ChevronDownIcon
                    className={cn(
                      "size-4 shrink-0 text-muted-foreground transition-transform",
                      isExpanded && "rotate-180",
                    )}
                  />
                </button>

                {showQuickAdd ? (
                  <button
                    type="button"
                    aria-label={`${get(config, "label")} qo'shish`}
                    className="group-hover/meal:bg-primary/10 flex size-9 shrink-0 items-center justify-center rounded-full bg-muted/50 transition-colors hover:bg-muted cursor-pointer shadow"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (onAddMeal) {
                        onAddMeal(type);
                        return;
                      }
                      openActionDrawer({ mealType: type, dateKey });
                    }}
                  >
                    <PlusIcon className="size-4 text-muted-foreground transition-colors group-hover/meal:text-primary" />
                  </button>
                ) : null}
              </div>

              {isExpanded ? (
                <div
                  id={detailsId}
                  className="ml-[68px] mt-2 grid gap-2 rounded-2xl bg-muted/20 p-2"
                >
                  {size(foods) > 0 ? (
                    map(foods, (food, index) => {
                      const qty = toPositiveNumber(get(food, "qty"), 1);
                      const itemCalories = Math.round(
                        toNonNegativeNumber(get(food, "cal"), 0) * qty,
                      );

                      return (
                        <div
                          key={get(food, "id", `${type}-${index}`)}
                          className="flex items-center justify-between gap-3 rounded-xl bg-background/60 px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                              {get(food, "name") || "Taom"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {qty}x
                            </p>
                          </div>
                          <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                            {itemCalories} kcal
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="px-3 py-2 text-sm text-muted-foreground">
                      Hali taom kiritilmagan
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
