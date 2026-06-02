import React from "react";
import get from "lodash/get";
import filter from "lodash/filter";
import isArray from "lodash/isArray";
import map from "lodash/map";
import toNumber from "lodash/toNumber";
import { useQueryClient } from "@tanstack/react-query";
import {
  useDeleteQuery,
  useGetQuery,
  usePatchQuery,
  usePostQuery,
} from "@/hooks/api";
import { WORKOUT_OVERVIEW_QUERY_KEY } from "@/hooks/app/use-workout-overview";
import { WORKOUT_PLANS_QUERY_KEY } from "@/hooks/app/use-workout-plans";
import { getDailyTrackingQueryKey } from "@/hooks/app/use-daily-tracking";
import { invalidateGamificationQueries } from "@/modules/user/lib/gamification-query-keys";

export const WORKOUT_LOGS_QUERY_KEY = ["user", "workout", "logs"];

export const getWorkoutLogQueryKey = (logGroupId) => [
  "user",
  "workout",
  "logs",
  logGroupId,
];

const resolveResponseData = (response, fallback = null) =>
  get(response, "data.data", get(response, "data", fallback));

const normalizeWorkoutEntry = (entry = {}) => ({
  id: entry.id,
  sets: toNumber(entry.sets ?? 1) || 1,
  reps: toNumber(entry.reps ?? 0) || 0,
  weight: toNumber(entry.weight ?? 0) || 0,
  durationSeconds: toNumber(entry.durationSeconds ?? 0) || 0,
  distanceMeters: toNumber(entry.distanceMeters ?? 0) || 0,
  durationMinutes: toNumber(entry.durationMinutes ?? 0) || 0,
  burnedCalories: toNumber(entry.burnedCalories ?? 0) || 0,
  addedAt: entry.addedAt ?? null,
});

const normalizeWorkoutSummary = (summary = {}) => ({
  totalSets: toNumber(summary.totalSets ?? 0) || 0,
  maxReps: toNumber(summary.maxReps ?? 0) || 0,
  maxWeight: toNumber(summary.maxWeight ?? 0) || 0,
  totalDurationSeconds: toNumber(summary.totalDurationSeconds ?? 0) || 0,
  totalDurationMinutes: toNumber(summary.totalDurationMinutes ?? 0) || 0,
  totalDistanceMeters: toNumber(summary.totalDistanceMeters ?? 0) || 0,
  totalBurnedCalories: toNumber(summary.totalBurnedCalories ?? 0) || 0,
});

export const normalizeWorkoutLog = (log = {}) => {
  if (!log || typeof log !== "object") {
    return null;
  }

  const entries = isArray(log.entries)
    ? map(log.entries, normalizeWorkoutEntry)
    : [];
  const summary = normalizeWorkoutSummary(log.summary);

  return {
    id: log.id,
    groupKey: log.id,
    date: log.date ?? "",
    source: log.source ?? "quick-log",
    sessionName: log.sessionName ?? null,
    planId: log.planId ?? null,
    planDayIndex:
      log.planDayIndex === undefined || log.planDayIndex === null
        ? null
        : toNumber(log.planDayIndex),
    planDayKey: log.planDayKey ?? null,
    exercise: {
      id: get(log, "exercise.id", null),
      name: get(log, "exercise.name", ""),
      imageUrl: get(log, "exercise.imageUrl", null),
      trackingType: get(log, "exercise.trackingType", "REPS_WEIGHT"),
    },
    name: get(log, "exercise.name", ""),
    exerciseId: get(log, "exercise.id", null),
    imageUrl: get(log, "exercise.imageUrl", null),
    trackingType: get(log, "exercise.trackingType", "REPS_WEIGHT"),
    items: entries,
    entries,
    summary,
    reps: summary.maxReps,
    weight: summary.maxWeight,
    durationSeconds: summary.totalDurationSeconds,
    distanceMeters: summary.totalDistanceMeters,
    totalSets: summary.totalSets,
    totalDuration: summary.totalDurationMinutes,
    totalCalories: summary.totalBurnedCalories,
    addedAt: log.addedAt ?? entries.at(-1)?.addedAt ?? null,
    updatedAt: log.updatedAt ?? entries.at(-1)?.addedAt ?? null,
  };
};

const normalizeWorkoutLogList = (payload) =>
  isArray(payload) ? filter(map(payload, normalizeWorkoutLog), Boolean) : [];

const invalidateWorkoutLogQueries = async (
  queryClient,
  { date, logGroupId } = {},
) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: WORKOUT_LOGS_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: WORKOUT_OVERVIEW_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: WORKOUT_PLANS_QUERY_KEY }),
    ...(logGroupId
      ? [
          queryClient.invalidateQueries({
            queryKey: getWorkoutLogQueryKey(logGroupId),
          }),
        ]
      : []),
    ...(date
      ? [
          queryClient.invalidateQueries({
            queryKey: getDailyTrackingQueryKey(date),
          }),
        ]
      : []),
  ]);
};

export const useWorkoutLogs = (params = {}, options = {}) => {
  const enabled = options.enabled ?? true;
  const queryParams = React.useMemo(
    () => ({
      ...(params.from ? { from: params.from } : {}),
      ...(params.to ? { to: params.to } : {}),
    }),
    [params.from, params.to],
  );

  const { data, ...query } = useGetQuery({
    url: "/user/workout/logs",
    params: queryParams,
    queryProps: {
      queryKey: [...WORKOUT_LOGS_QUERY_KEY, queryParams],
      enabled,
    },
  });

  const items = React.useMemo(
    () => normalizeWorkoutLogList(resolveResponseData(data, [])),
    [data],
  );

  return {
    ...query,
    data,
    items,
  };
};

export const useWorkoutLog = (logGroupId, options = {}) => {
  const enabled = options.enabled ?? true;
  const { data, ...query } = useGetQuery({
    url: `/user/workout/logs/${logGroupId}`,
    queryProps: {
      queryKey: getWorkoutLogQueryKey(logGroupId),
      enabled: Boolean(logGroupId) && enabled,
    },
  });

  const log = React.useMemo(
    () => normalizeWorkoutLog(resolveResponseData(data)),
    [data],
  );

  return {
    ...query,
    data,
    log,
  };
};

export const useCreateWorkoutLog = () => {
  const queryClient = useQueryClient();
  const mutation = usePostQuery({
    mutationProps: {
      onSuccess: async (response) => {
        const created = normalizeWorkoutLog(resolveResponseData(response));
        await Promise.all([
          invalidateWorkoutLogQueries(queryClient, {
            date: created.date,
            logGroupId: created.id,
          }),
          invalidateGamificationQueries(queryClient),
        ]);
      },
    },
  });

  const createLog = React.useCallback(
    async (payload) => {
      const response = await mutation.mutateAsync({
        url: "/user/workout/logs",
        attributes: payload,
      });

      return normalizeWorkoutLog(resolveResponseData(response));
    },
    [mutation],
  );

  return {
    ...mutation,
    createLog,
  };
};

export const useUpdateWorkoutLog = () => {
  const queryClient = useQueryClient();
  const mutation = usePatchQuery({
    mutationProps: {
      onSuccess: async (response, variables) => {
        const updated = normalizeWorkoutLog(resolveResponseData(response));
        await invalidateWorkoutLogQueries(queryClient, {
          date: updated.date || variables?.date,
          logGroupId: variables?.logGroupId ?? updated.id,
        });
      },
    },
  });

  const updateLog = React.useCallback(
    async (logGroupId, payload) => {
      const response = await mutation.mutateAsync({
        url: `/user/workout/logs/${logGroupId}`,
        attributes: payload,
        logGroupId,
        date: payload?.date,
      });

      return normalizeWorkoutLog(resolveResponseData(response));
    },
    [mutation],
  );

  return {
    ...mutation,
    updateLog,
  };
};

export const useDeleteWorkoutLog = () => {
  const queryClient = useQueryClient();
  const mutation = useDeleteQuery({
    mutationProps: {
      onSuccess: async (_, variables) => {
        await invalidateWorkoutLogQueries(queryClient, {
          date: variables?.date,
          logGroupId: variables?.logGroupId,
        });
      },
    },
  });

  const deleteLog = React.useCallback(
    async (logGroupId, options = {}) =>
      mutation.mutateAsync({
        url: `/user/workout/logs/${logGroupId}`,
        logGroupId,
        date: options.date,
      }),
    [mutation],
  );

  return {
    ...mutation,
    deleteLog,
  };
};
