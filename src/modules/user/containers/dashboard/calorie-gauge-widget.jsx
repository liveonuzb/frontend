import React from "react";
import get from "lodash/get";
import { useNavigate } from "react-router";
import { useGetQuery } from "@/hooks/api";
import {
  NUTRITION_TRACKING_API_ROOT,
  nutritionApiPath,
} from "@/hooks/app/nutrition-api-paths";
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
  dayData: dayDataOverride,
  goalsState: goalsStateOverride,
  user: userOverride,
  onOpen,
  showCalorieModeToggle = false,
  defaultCalorieMode,
}) {
  const navigate = useNavigate();
  const shouldFetchUser = userOverride === undefined;
  const shouldFetchGoals = goalsStateOverride === undefined;
  const shouldFetchDay = dayDataOverride === undefined;
  const { data: userData } = useGetQuery({
    url: "/users/me",
    queryProps: {
      queryKey: DASHBOARD_ME_QUERY_KEY,
      enabled: shouldFetchUser,
    },
  });
  const {
    data: goalsData,
    isLoading,
    isFetching,
  } = useGetQuery({
    url: "/health-goals",
    queryProps: {
      queryKey: DASHBOARD_HEALTH_GOALS_QUERY_KEY,
      enabled: shouldFetchGoals,
    },
  });
  const { data: trackingData } = useGetQuery({
    url: nutritionApiPath(NUTRITION_TRACKING_API_ROOT, dateKey),
    queryProps: {
      queryKey: getDashboardDayQueryKey(dateKey),
      enabled: shouldFetchDay && Boolean(dateKey),
    },
  });

  const user = React.useMemo(
    () => userOverride ?? getUserFromResponse(userData),
    [userData, userOverride],
  );
  const dayData = React.useMemo(
    () => dayDataOverride ?? getDayDataFromResponse(trackingData, dateKey),
    [dateKey, dayDataOverride, trackingData],
  );
  const { goals, goalSource, hasServerGoals } = React.useMemo(
    () =>
      goalsStateOverride ??
      getGoalsStateFromResponses({ goalsResponse: goalsData, user }),
    [goalsData, goalsStateOverride, user],
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
    user?.onboardingCompleted && !hasServerGoals && (isLoading || isFetching);
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
      burnedCalories={get(dayData, "burnedCalories", 0)}
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
      compact
      separateCards
      showGoalAlerts={false}
      onClick={onOpen ?? (() => navigate("/user/nutrition"))}
      className="h-full w-full"
    />
  );
}
