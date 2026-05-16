import React from "react";
import { get } from "lodash";
import { useQueryClient } from "@tanstack/react-query";
import { useDeleteQuery, useGetQuery, usePostQuery, usePutQuery } from "@/hooks/api";
import { WORKOUT_LOGS_QUERY_KEY } from "@/hooks/app/use-workout-logs";
import { WORKOUT_OVERVIEW_QUERY_KEY } from "@/hooks/app/use-workout-overview";
import { WORKOUT_PLANS_QUERY_KEY } from "@/hooks/app/use-workout-plans";

export const getWorkoutSessionDraftQueryKey = (planId, dayIndex) => [
  "user",
  "workout",
  "sessions",
  planId,
  dayIndex,
];
export const getWorkoutSessionProgressQueryKey = (sessionId) => [
  "user",
  "workout",
  "session-progress",
  sessionId,
];

export const WORKOUT_SESSION_HISTORY_QUERY_KEY = ["user", "workout", "session-history"];
export const getWorkoutSessionHistoryItemQueryKey = (sessionId) => [
  ...WORKOUT_SESSION_HISTORY_QUERY_KEY,
  sessionId,
];

const resolveResponseData = (response, fallback = null) =>
  get(response, "data.data", get(response, "data", fallback));

const normalizeWorkoutSessionDraft = (draft) => {
  if (!draft) {
    return null;
  }

  return {
    ...draft,
    planId: draft.planId ?? null,
    planDayIndex:
      draft.planDayIndex === undefined || draft.planDayIndex === null
        ? null
        : Number(draft.planDayIndex),
    planDayKey: draft.planDayKey ?? null,
    sessionStartTime: draft.sessionStartTime ?? null,
    elapsedSeconds: Number(draft.elapsedSeconds ?? 0) || 0,
    expandedExerciseId: draft.expandedExerciseId ?? null,
    restSecondsRemaining: Number(draft.restSecondsRemaining ?? 0) || 0,
    restEndsAt: draft.restEndsAt ?? null,
    exercises: Array.isArray(draft.exercises) ? draft.exercises : [],
    lastSyncedAt: draft.lastSyncedAt ?? draft.updatedAt ?? null,
    createdAt: draft.createdAt ?? null,
    updatedAt: draft.updatedAt ?? null,
  };
};

export const useWorkoutSessionDraft = (planId, dayIndex, options = {}) => {
  const enabled = options.enabled ?? true;
  const { data, ...query } = useGetQuery({
    url: `/user/workout/sessions/${planId}/days/${dayIndex}`,
    queryProps: {
      queryKey: getWorkoutSessionDraftQueryKey(planId, dayIndex),
      enabled: Boolean(planId) && Number.isInteger(dayIndex) && dayIndex >= 0 && enabled,
      staleTime: 15000,
    },
  });

  const draft = React.useMemo(
    () => normalizeWorkoutSessionDraft(resolveResponseData(data)),
    [data],
  );

  return {
    ...query,
    data,
    draft,
  };
};

export const useStartWorkoutSession = () => {
  const queryClient = useQueryClient();
  const mutation = usePostQuery();

  const startSession = React.useCallback(
    async (planId, dayIndex) => {
      const response = await mutation.mutateAsync({
        url: "/user/workout/sessions/start",
        attributes: {
          planId,
          dayIndex,
        },
      });
      await queryClient.setQueryData(
        getWorkoutSessionDraftQueryKey(planId, dayIndex),
        response,
      );
      return normalizeWorkoutSessionDraft(resolveResponseData(response));
    },
    [mutation, queryClient],
  );

  return {
    ...mutation,
    startSession,
  };
};

export const useSaveWorkoutSessionDraft = () => {
  const queryClient = useQueryClient();
  const mutation = usePutQuery();

  const saveDraft = React.useCallback(
    async (planId, dayIndex, payload) => {
      const response = await mutation.mutateAsync({
        url: `/user/workout/sessions/${planId}/days/${dayIndex}`,
        attributes: payload,
      });
      const normalized = normalizeWorkoutSessionDraft(resolveResponseData(response));
      await queryClient.setQueryData(
        getWorkoutSessionDraftQueryKey(planId, dayIndex),
        response,
      );
      return normalized;
    },
    [mutation, queryClient],
  );

  return {
    ...mutation,
    saveDraft,
  };
};

export const useUpdateWorkoutSessionProgress = () => {
  const queryClient = useQueryClient();
  const mutation = usePutQuery();

  const updateProgress = React.useCallback(
    async (sessionId, payload) => {
      const response = await mutation.mutateAsync({
        url: `/user/workout/sessions/${sessionId}/progress`,
        attributes: payload,
      });

      const normalized = normalizeWorkoutSessionDraft(resolveResponseData(response));
      if (normalized?.planId && Number.isInteger(normalized?.planDayIndex)) {
        await queryClient.setQueryData(
          getWorkoutSessionDraftQueryKey(normalized.planId, normalized.planDayIndex),
          response,
        );
      }
      await queryClient.setQueryData(
        getWorkoutSessionProgressQueryKey(sessionId),
        response,
      );

      return normalized;
    },
    [mutation, queryClient],
  );

  return {
    ...mutation,
    updateProgress,
  };
};

export const useDeleteWorkoutSessionDraft = () => {
  const queryClient = useQueryClient();
  const mutation = useDeleteQuery();

  const deleteDraft = React.useCallback(
    async (planId, dayIndex) => {
      await mutation.mutateAsync({
        url: `/user/workout/sessions/${planId}/days/${dayIndex}`,
      });
      queryClient.removeQueries({
        queryKey: getWorkoutSessionDraftQueryKey(planId, dayIndex),
      });
    },
    [mutation, queryClient],
  );

  return {
    ...mutation,
    deleteDraft,
  };
};

export const useFinishWorkoutSession = () => {
  const queryClient = useQueryClient();
  const mutation = usePostQuery();

  const finishSession = React.useCallback(
    async (planId, dayIndex, payload) => {
      const response = await mutation.mutateAsync({
        url: `/user/workout/sessions/${planId}/days/${dayIndex}/finish`,
        attributes: payload,
      });

      queryClient.removeQueries({
        queryKey: getWorkoutSessionDraftQueryKey(planId, dayIndex),
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: WORKOUT_LOGS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: WORKOUT_OVERVIEW_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: WORKOUT_PLANS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: WORKOUT_SESSION_HISTORY_QUERY_KEY }),
      ]);

      return resolveResponseData(response, null);
    },
    [mutation, queryClient],
  );

  return {
    ...mutation,
    finishSession,
  };
};

const hasHistoryQueryParams = (value = {}) =>
  Object.prototype.hasOwnProperty.call(value, "limit") ||
  Object.prototype.hasOwnProperty.call(value, "cursor");

export const useWorkoutSessionHistory = (paramsOrOptions = {}, maybeOptions = {}) => {
  const params = hasHistoryQueryParams(paramsOrOptions) ? paramsOrOptions : {};
  const options = hasHistoryQueryParams(paramsOrOptions)
    ? maybeOptions
    : paramsOrOptions;
  const enabled = options.enabled ?? true;
  const queryString = new URLSearchParams(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  ).toString();
  const url = queryString
    ? `/user/workout/sessions/history?${queryString}`
    : "/user/workout/sessions/history";
  const { data, ...query } = useGetQuery({
    url,
    queryProps: {
      queryKey: [...WORKOUT_SESSION_HISTORY_QUERY_KEY, params],
      enabled,
    },
  });
  const responseData = resolveResponseData(data, []);
  const sessions = Array.isArray(responseData)
    ? responseData
    : Array.isArray(responseData?.data)
      ? responseData.data
      : [];

  return {
    ...query,
    data,
    sessions,
    meta: responseData?.meta ?? null,
  };
};

export const useWorkoutSessionHistoryItem = (sessionId, options = {}) => {
  const enabled = options.enabled ?? true;
  const { data, ...query } = useGetQuery({
    url: `/user/workout/sessions/history/${sessionId}`,
    queryProps: {
      queryKey: getWorkoutSessionHistoryItemQueryKey(sessionId),
      enabled: Boolean(sessionId) && enabled,
    },
  });

  return {
    ...query,
    data,
    session: resolveResponseData(data, null),
  };
};
