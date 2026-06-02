import React from "react";
import get from "lodash/get";
import isArray from "lodash/isArray";
import toNumber from "lodash/toNumber";
import { useGetQuery } from "@/hooks/api";
import {
  normalizeWorkoutPlanSnapshot,
  normalizeWorkoutStateSnapshot,
} from "./workout-state-normalizer.js";

export const WORKOUT_OVERVIEW_QUERY_KEY = ["user", "workout", "overview"];

const defaultWorkoutOverview = {
  weeklyStats: {
    count: 0,
    calories: 0,
    duration: 0,
  },
  personalRecordCount: 0,
  personalRecords: [],
  recentWorkoutDays: [],
  streak: {
    currentDays: 0,
    bestDays: 0,
  },
  recovery: {
    status: "no_data",
    score: 0,
    recommendation: "",
  },
  activePlan: null,
};

const resolveResponseData = (response, fallback = defaultWorkoutOverview) =>
  get(response, "data.data", get(response, "data", fallback));

const normalizeWorkoutOverview = (payload = {}) => {
  const activePlan = normalizeWorkoutPlanSnapshot(payload.activePlan);

  return {
    weeklyStats: {
      count: toNumber(payload.weeklyStats?.count ?? 0) || 0,
      calories: toNumber(payload.weeklyStats?.calories ?? 0) || 0,
      duration: toNumber(payload.weeklyStats?.duration ?? 0) || 0,
    },
    personalRecordCount:
      toNumber(
        payload.personalRecordCount ?? payload.personalRecords?.length ?? 0,
      ) || 0,
    personalRecords: isArray(payload.personalRecords)
      ? payload.personalRecords
      : [],
    recentWorkoutDays: isArray(payload.recentWorkoutDays)
      ? payload.recentWorkoutDays
      : [],
    streak: {
      currentDays: toNumber(payload.streak?.currentDays ?? 0) || 0,
      bestDays: toNumber(payload.streak?.bestDays ?? 0) || 0,
    },
    recovery: {
      status: payload.recovery?.status || "no_data",
      score: toNumber(payload.recovery?.score ?? 0) || 0,
      recommendation: payload.recovery?.recommendation || "",
    },
    activePlan,
    workoutState: normalizeWorkoutStateSnapshot(
      payload.workoutState ?? {},
      activePlan,
    ),
  };
};

export const useWorkoutOverview = (options = {}) => {
  const enabled = options.enabled ?? true;
  const { data, ...query } = useGetQuery({
    url: "/user/workout/dashboard",
    queryProps: {
      queryKey: WORKOUT_OVERVIEW_QUERY_KEY,
      enabled,
    },
  });

  const overview = React.useMemo(
    () => normalizeWorkoutOverview(resolveResponseData(data)),
    [data],
  );

  return {
    ...query,
    data,
    overview,
  };
};

export default useWorkoutOverview;
