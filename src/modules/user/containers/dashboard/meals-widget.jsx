import React from "react";
import { entries, get, map, reduce } from "lodash";
import { useNavigate } from "react-router";
import useGetQuery from "@/hooks/api/use-get-query";
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

const mealTypeConfig = {
  breakfast: { label: "Nonushta", icon: "🍳" },
  lunch: { label: "Tushlik", icon: "🥗" },
  dinner: { label: "Kechki ovqat", icon: "🍲" },
  snack: { label: "Snack", icon: "🥜" },
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

  return (
    <Card className="h-full py-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <UtensilsIcon className="size-4 text-[rgb(var(--accent-rgb))]" />
            Ovqatlar
          </CardTitle>
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-md bg-muted transition-colors hover:bg-muted/80"
            onClick={() => (onOpen ? onOpen() : navigate("/user/nutrition"))}
          >
            <ArrowRightIcon className="size-3.5" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-y-5">
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
          const ringSize = 48;
          const ringRadius = 19;
          const ringStroke = 3;
          const circumference = 2 * Math.PI * ringRadius;
          const dashOffset = circumference * (1 - progress);

          return (
            <div
              key={type}
              className="group/meal flex cursor-pointer items-center gap-3 py-1"
              onClick={() => (onOpen ? onOpen() : navigate("/user/nutrition"))}
            >
              <div className="relative shrink-0" style={{ width: ringSize, height: ringSize }}>
                <svg width={ringSize} height={ringSize} className="rotate-[-90deg]">
                  <circle
                    cx={ringSize / 2}
                    cy={ringSize / 2}
                    r={ringRadius}
                    fill="none"
                    stroke="currentColor"
                    className="text-muted/30"
                    strokeWidth={ringStroke}
                  />
                  <circle
                    cx={ringSize / 2}
                    cy={ringSize / 2}
                    r={ringRadius}
                    fill="none"
                    stroke="url(#dashboardMealRingGrad)"
                    strokeWidth={ringStroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    className="transition-all duration-700"
                  />
                  <defs>
                    <linearGradient
                      id="dashboardMealRingGrad"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="#a3e635" />
                      <stop offset="100%" stopColor="#65a30d" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-xl">
                  {get(config, "icon")}
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{get(config, "label")}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <FlameIcon className="size-3 text-[rgb(var(--accent-rgb))]" />
                  {calories > 0 ? `${calories} kcal` : "0 kcal"}
                </p>
              </div>

              {showQuickAdd ? (
                <button
                  type="button"
                  className="group-hover/meal:bg-primary/10 flex size-11 shrink-0 items-center justify-center rounded-full bg-muted/50 transition-colors hover:bg-muted"
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
