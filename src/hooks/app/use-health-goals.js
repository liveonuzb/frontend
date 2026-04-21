import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetQuery, usePutQuery } from "@/hooks/api";
import { getApiResponseData } from "@/lib/api-response";
import useMe from "@/hooks/app/use-me";
import { calculateGoals, normalizeGoal } from "@/lib/goal-calculator";

export const HEALTH_GOALS_QUERY_KEY = ["health-goals"];

export const DEFAULT_HEALTH_GOALS = {
  calories: 2200,
  protein: 150,
  carbs: 250,
  fat: 70,
  fiber: 30,
  waterMl: 2500,
  waterUnit: "ml",
  cupSize: 250,
  customCupSize: null,
  waterNotification: true,
  waterNotifStart: "08:00",
  waterNotifEnd: "22:00",
  waterNotifInterval: "1 hour",
  steps: 10000,
  sleepHours: 8,
  workoutMinutes: 60,
  weightUnit: "kg",
  heightUnit: "cm",
};

const GOAL_PRESET_KEYS = [
  "calories",
  "protein",
  "carbs",
  "fat",
  "fiber",
  "waterMl",
  "steps",
  "sleepHours",
  "workoutMinutes",
];

export const normalizeHealthGoals = (goals = {}) => ({
  ...DEFAULT_HEALTH_GOALS,
  ...goals,
  waterNotification:
    goals.waterNotificationEnabled ??
    goals.waterNotification ??
    DEFAULT_HEALTH_GOALS.waterNotification,
});

export const hasDefaultHealthGoalPreset = (goals = {}) => {
  const normalized = normalizeHealthGoals(goals);
  return GOAL_PRESET_KEYS.every(
    (key) => normalized[key] === DEFAULT_HEALTH_GOALS[key],
  );
};

export const toHealthGoalsPayload = (goals = {}) => {
  const normalized = normalizeHealthGoals(goals);

  return {
    calories: normalized.calories,
    protein: normalized.protein,
    carbs: normalized.carbs,
    fat: normalized.fat,
    fiber: normalized.fiber,
    waterMl: normalized.waterMl,
    waterUnit: normalized.waterUnit,
    cupSize: normalized.cupSize,
    customCupSize: normalized.customCupSize,
    waterNotificationEnabled: normalized.waterNotification,
    waterNotifStart: normalized.waterNotifStart,
    waterNotifEnd: normalized.waterNotifEnd,
    waterNotifInterval: normalized.waterNotifInterval,
    steps: normalized.steps,
    sleepHours: normalized.sleepHours,
    workoutMinutes: normalized.workoutMinutes,
    weightUnit: normalized.weightUnit,
    heightUnit: normalized.heightUnit,
  };
};

const setHealthGoalsCache = (queryClient, goals) => {
  queryClient.setQueryData(HEALTH_GOALS_QUERY_KEY, {
    data: normalizeHealthGoals(goals),
  });
};

export const useHealthGoals = (options = {}) => {
  const enabled = options.enabled ?? true;
  const queryClient = useQueryClient();
  const { onboarding } = useMe();
  const { data, ...query } = useGetQuery({
    url: "/health-goals",
    queryProps: {
      queryKey: HEALTH_GOALS_QUERY_KEY,
      enabled,
    },
  });
  const { mutateAsync, isPending } = usePutQuery();
  const isHydratingGoals = query.isLoading && data === undefined;
  const serverGoals = React.useMemo(() => {
    const payload = getApiResponseData(data, null);
    return payload ? normalizeHealthGoals(payload) : null;
  }, [data]);

  const goals = React.useMemo(
    () => serverGoals ?? normalizeHealthGoals(),
    [serverGoals],
  );
  const goalSource = React.useMemo(() => {
    if (!serverGoals) {
      return "fallback";
    }

    return hasDefaultHealthGoalPreset(serverGoals) ? "default" : "personalized";
  }, [serverGoals]);
  const recommendedGoals = React.useMemo(() => {
    if (!onboarding) {
      return goals;
    }

    return normalizeHealthGoals({
      ...goals,
      ...calculateGoals({
        gender: onboarding.gender,
        age: onboarding.age,
        heightValue: onboarding.height?.value,
        currentWeightValue: onboarding.currentWeight?.value,
        goal: onboarding.goal,
        activityLevel: onboarding.activityLevel,
        weeklyPace: onboarding.weeklyPace,
      }),
    });
  }, [goals, onboarding]);
  const recommendedGoalIntent = React.useMemo(
    () => normalizeGoal(onboarding?.goal),
    [onboarding?.goal],
  );

  const saveGoals = React.useCallback(
    async (patch) => {
      const previousGoals = goals;
      const nextGoals = normalizeHealthGoals({
        ...previousGoals,
        ...patch,
      });

      setHealthGoalsCache(queryClient, nextGoals);

      try {
        const response = await mutateAsync({
          url: "/health-goals",
          attributes: toHealthGoalsPayload(nextGoals),
        });
        const serverGoals = normalizeHealthGoals(
          getApiResponseData(response, {}),
        );
        setHealthGoalsCache(queryClient, serverGoals);
        return serverGoals;
      } catch (error) {
        setHealthGoalsCache(queryClient, previousGoals);
        throw error;
      }
    },
    [goals, mutateAsync, queryClient],
  );

  const setGoal = React.useCallback(
    async (key, value) => saveGoals({ [key]: value }),
    [saveGoals],
  );

  return {
    ...query,
    goals,
    serverGoals,
    recommendedGoals,
    recommendedGoalIntent,
    hasOnboardingGoal: Boolean(onboarding?.goal),
    goalSource,
    hasServerGoals: Boolean(serverGoals),
    isFallbackGoals: goalSource === "fallback",
    isDefaultGoalPreset: goalSource === "default",
    isHydratingGoals,
    saveGoals,
    setGoal,
    isSaving: isPending,
  };
};

export default useHealthGoals;
