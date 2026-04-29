import React from "react";
import { entries, get, map, reduce } from "lodash";
import { useNavigate } from "react-router";
import useGetQuery from "@/hooks/api/use-get-query";
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
  FlameIcon,
  PlusIcon,
  UtensilsIcon,
} from "lucide-react";
import {
  DASHBOARD_HEALTH_GOALS_QUERY_KEY,
  getDashboardDayQueryKey,
  getDayDataFromResponse,
  getGoalsStateFromResponses,
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
      enabled: Boolean(dateKey),
    },
  });
  const { data: goalsData } = useGetQuery({
    url: "/health-goals",
    queryProps: {
      queryKey: DASHBOARD_HEALTH_GOALS_QUERY_KEY,
    },
  });
  const dayData = React.useMemo(
    () => getDayDataFromResponse(trackingData, dateKey),
    [dateKey, trackingData],
  );
  const { goals } = React.useMemo(
    () => getGoalsStateFromResponses({ goalsResponse: goalsData, user: null }),
    [goalsData],
  );
  const savedMealsById = React.useMemo(() => {
    return savedMeals.reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {});
  }, [savedMeals]);
  const templatesById = React.useMemo(() => {
    return templates.reduce((acc, template) => {
      acc[template.id] = template;
      return acc;
    }, {});
  }, [templates]);
  const suggestedPattern = React.useMemo(() => {
    const weekday = getWeekdayNameFromDate(dateKey);
    return (
      recurringPatterns.find((pattern) => {
        if (pattern.weekday !== weekday) return false;
        const template = templatesById[pattern.templateId];
        if (!template) return false;
        const foods = get(dayData, ["meals", pattern.mealKey], []);
        if (foods.length > 0) return false;
        return template.mealIds.some((mealId) => savedMealsById[mealId]);
      }) || null
    );
  }, [dateKey, dayData, recurringPatterns, savedMealsById, templatesById]);
  const suggestedTemplate = suggestedPattern
    ? templatesById[suggestedPattern.templateId]
    : null;

  const handleApplySuggestedPattern = React.useCallback(async () => {
    if (!suggestedPattern || !suggestedTemplate) return;

    const mealsToLog = suggestedTemplate.mealIds
      .map((mealId) => savedMealsById[mealId])
      .filter(Boolean);

    if (mealsToLog.length === 0) {
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
    <Card className="h-full py-6 meals-widget">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <UtensilsIcon className="size-4 text-orange-500" />
            Ovqatlar
          </CardTitle>
          <Button
            variant={"outlined"}
            type="button"
            className="flex size-9 w-11 items-center justify-center rounded-md bg-muted transition-colors hover:bg-muted/80"
            onClick={() => (onOpen ? onOpen() : navigate("/user/nutrition"))}
          >
            <ArrowRightIcon className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-3">
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
                  {suggestedTemplate.mealIds.length} ta taom
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
            (sum, food) => sum + get(food, "cal", 0) * get(food, "qty", 1),
            0,
          );

          const mealGoal = Math.round(
            get(goals, "calories", 0) * get(mealPctGoal, type, 0.25),
          );

          const progress = mealGoal > 0 ? Math.min(calories / mealGoal, 1) : 0;
          const ringSize = 56;
          const ringRadius = 25;
          const ringStroke = 4;
          const circumference = 2 * Math.PI * ringRadius;
          const dashOffset = circumference * (1 - progress);
          const gradientId = `dashboardMealRingGrad-${type}`;

          return (
            <div
              key={type}
              className="group/meal flex cursor-pointer items-center gap-3 py-1"
              onClick={() => (onOpen ? onOpen() : navigate("/user/nutrition"))}
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

                <div className="absolute left-1/2 top-1/2 flex size-[46px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-secondary shadow-inner">
                  <div
                    className={cn(
                      get(config, "icon"),
                      "size-8 bg-contain bg-center bg-no-repeat",
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

              {showQuickAdd ? (
                <button
                  type="button"
                  className="group-hover/meal:bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-full bg-muted/50 transition-colors hover:bg-muted cursor-pointer shadow"
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
          );
        })}
      </CardContent>
    </Card>
  );
}
