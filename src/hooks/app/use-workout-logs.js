import React from "react";
import { get } from "lodash";
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
  sets: Number(entry.sets ?? 1) || 1,
  reps: Number(entry.reps ?? 0) || 0,
  weight: Number(entry.weight ?? 0) || 0,
  durationSeconds: Number(entry.durationSeconds ?? 0) || 0,
  distanceMeters: Number(entry.distanceMeters ?? 0) || 0,
  durationMinutes: Number(entry.durationMinutes ?? 0) || 0,
  burnedCalories: Number(entry.burnedCalories ?? 0) || 0,
  addedAt: entry.addedAt ?? null,
});

const normalizeWorkoutSummary = (summary = {}) => ({
  totalSets: Number(summary.totalSets ?? 0) || 0,
  maxReps: Number(summary.maxReps ?? 0) || 0,
  maxWeight: Number(summary.maxWeight ?? 0) || 0,
  totalDurationSeconds: Number(summary.totalDurationSeconds ?? 0) || 0,
  totalDurationMinutes: Number(summary.totalDurationMinutes ?? 0) || 0,
  totalDistanceMeters: Number(summary.totalDistanceMeters ?? 0) || 0,
  totalBurnedCalories: Number(summary.totalBurnedCalories ?? 0) || 0,
});

export const normalizeWorkoutLog = (log = {}) => {
  const entries = Array.isArray(log.entries)
    ? log.entries.map(normalizeWorkoutEntry)
    : [];
  const summary = normalizeWorkoutSummary(log.summary);

  return {
    id: log.id,
    groupKey: log.id,
    date: log.date ?? "",
    source: log.source ?? "quick-log",
    sessionName: log.sessionName ?? null,
    planId: log.planId ?? null,
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
  Array.isArray(payload) ? payload.map(normalizeWorkoutLog) : [];

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
        await invalidateWorkoutLogQueries(queryClient, {
          date: created.date,
          logGroupId: created.id,
        });
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
