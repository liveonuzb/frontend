import React from "react";
import { get } from "lodash";
import { useNavigate } from "react-router";
import useGetQuery from "@/hooks/api/use-get-query";
import CalorieGaugeComponent from "@/components/calorie-gauge-widget";
import {
  calculateMealCalories,
  calculateMealMacros,
  DASHBOARD_HEALTH_GOALS_QUERY_KEY,
  DASHBOARD_ME_QUERY_KEY,
  getCalorieGoalMeta,
  getDashboardDayQueryKey,
  getDayDataFromResponse,
  getGoalsStateFromResponses,
  getUserFromResponse,
} from "./query-helpers.js";

export default function CalorieGaugeWidget({
  dateKey,
  onOpen,
  showCalorieModeToggle = false,
  defaultCalorieMode,
}) {
  const navigate = useNavigate();
  const { data: userData } = useGetQuery({
    url: "/users/me",
    queryProps: {
      queryKey: DASHBOARD_ME_QUERY_KEY,
    },
  });
  const { data: goalsData, isLoading, isFetching } = useGetQuery({
    url: "/health-goals",
    queryProps: {
      queryKey: DASHBOARD_HEALTH_GOALS_QUERY_KEY,
    },
  });
  const { data: trackingData } = useGetQuery({
    url: `/daily-tracking/${dateKey}`,
    queryProps: {
      queryKey: getDashboardDayQueryKey(dateKey),
      enabled: Boolean(dateKey),
    },
  });

  const user = React.useMemo(() => getUserFromResponse(userData), [userData]);
  const dayData = React.useMemo(
    () => getDayDataFromResponse(trackingData, dateKey),
    [dateKey, trackingData],
  );
  const { goals, goalSource, hasServerGoals } = React.useMemo(
    () => getGoalsStateFromResponses({ goalsResponse: goalsData, user }),
    [goalsData, user],
  );
  const totalCalories = React.useMemo(
    () => calculateMealCalories(dayData.meals),
    [dayData.meals],
  );
  const macros = React.useMemo(
    () => calculateMealMacros(dayData.meals),
    [dayData.meals],
  );
  const isGoalLoading =
    user?.onboardingCompleted &&
    !hasServerGoals &&
    (isLoading || isFetching);
  const goalMeta = React.useMemo(
    () =>
      getCalorieGoalMeta({
        user,
        goalSource,
        hasServerGoals,
        isGoalLoading,
      }),
    [goalSource, hasServerGoals, isGoalLoading, user],
  );

  return (
    <CalorieGaugeComponent
      consumed={totalCalories}
      goal={get(goals, "calories", 0)}
      macros={{
        protein: {
          current: get(macros, "protein", 0),
          target: get(goals, "protein", 0),
        },
        carbs: {
          current: get(macros, "carbs", 0),
          target: get(goals, "carbs", 0),
        },
        fat: {
          current: get(macros, "fat", 0),
          target: get(goals, "fat", 0),
        },
      }}
      isGoalLoading={isGoalLoading}
      goalMeta={goalMeta}
      showCalorieModeToggle={showCalorieModeToggle}
      defaultCalorieMode={defaultCalorieMode}
      onClick={onOpen ?? (() => navigate("/user/nutrition"))}
      className="h-full"
    />
  );
}
