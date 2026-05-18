import React from "react";
import { get, isArray, toNumber } from "lodash";
import { useGetQuery } from "@/hooks/api";

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
};

const resolveResponseData = (response, fallback = defaultWorkoutOverview) =>
  get(response, "data.data", get(response, "data", fallback));

const normalizeWorkoutOverview = (payload = {}) => ({
  weeklyStats: {
    count: toNumber(payload.weeklyStats?.count ?? 0) || 0,
    calories: toNumber(payload.weeklyStats?.calories ?? 0) || 0,
    duration: toNumber(payload.weeklyStats?.duration ?? 0) || 0,
  },
  personalRecordCount:
    toNumber(payload.personalRecordCount ?? payload.personalRecords?.length ?? 0) || 0,
  personalRecords: isArray(payload.personalRecords)
    ? payload.personalRecords
    : [],
  recentWorkoutDays: isArray(payload.recentWorkoutDays)
    ? payload.recentWorkoutDays
    : [],
});

export const useWorkoutOverview = (options = {}) => {
  const enabled = options.enabled ?? true;
  const { data, ...query } = useGetQuery({
    url: "/user/workout/overview",
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
