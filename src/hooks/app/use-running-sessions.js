import React from "react";
import { get } from "lodash";
import { useQueryClient } from "@tanstack/react-query";
import { config } from "@/config.js";
import { useGetQuery, usePostQuery } from "@/hooks/api";
import { WORKOUT_LOGS_QUERY_KEY } from "@/hooks/app/use-workout-logs";
import { WORKOUT_OVERVIEW_QUERY_KEY } from "@/hooks/app/use-workout-overview";
import { WORKOUT_SESSION_HISTORY_QUERY_KEY } from "@/hooks/app/use-workout-sessions";
import { useAuthStore } from "@/store";

export const RUNNING_SESSIONS_QUERY_KEY = ["user", "workout", "running"];
export const RUNNING_ACTIVE_QUERY_KEY = [
  ...RUNNING_SESSIONS_QUERY_KEY,
  "active",
];
export const RUNNING_STATS_QUERY_KEY = [...RUNNING_SESSIONS_QUERY_KEY, "stats"];

export const getRunningSessionDetailQueryKey = (workoutSessionId) => [
  ...RUNNING_SESSIONS_QUERY_KEY,
  workoutSessionId,
];

const resolveResponseData = (response, fallback = null) =>
  get(response, "data.data", get(response, "data", fallback));

const useRunningQueryEnabled = (enabled = true) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return Boolean(config.runningFeatureEnabled && isAuthenticated && enabled);
};

const normalizeRunningSession = (session) => {
  if (!session) {
    return null;
  }

  return {
    ...session,
    workoutSessionId: session.workoutSessionId ?? session.id ?? null,
    runningSessionId: session.runningSessionId ?? null,
    status: session.status ?? "active",
    startedAt: session.startedAt ?? null,
    endedAt: session.endedAt ?? null,
    metrics: {
      distanceMeters:
        Number(
          get(session, "metrics.distanceMeters", session.distanceMeters ?? 0),
        ) || 0,
      durationSeconds:
        Number(
          get(session, "metrics.durationSeconds", session.durationSeconds ?? 0),
        ) || 0,
      movingDurationSeconds:
        Number(
          get(
            session,
            "metrics.movingDurationSeconds",
            session.movingDurationSeconds ?? 0,
          ),
        ) || 0,
      caloriesBurned:
        Number(
          get(
            session,
            "metrics.caloriesBurned",
            session.caloriesBurned ?? session.estimatedCalories ?? 0,
          ),
        ) || 0,
      averagePaceSecondsPerKm: get(
        session,
        "metrics.averagePaceSecondsPerKm",
        session.averagePaceSecondsPerKm ?? null,
      ),
      gpsQualityScore: get(
        session,
        "metrics.gpsQualityScore",
        session.gpsQualityScore ?? null,
      ),
    },
    route: session.route ?? null,
    splits: Array.isArray(session.splits) ? session.splits : [],
    points: Array.isArray(session.points)
      ? session.points
          .map((point) => ({
            ...point,
            sequence: Number(point?.sequence ?? 0) || 0,
            latitude: Number(point?.latitude),
            longitude: Number(point?.longitude),
            accuracy:
              point?.accuracy === undefined || point?.accuracy === null
                ? null
                : Number(point.accuracy),
          }))
          .filter(
            (point) =>
              Number.isFinite(point.latitude) &&
              Number.isFinite(point.longitude),
          )
      : [],
  };
};

const invalidateRunningQueries = async (queryClient) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: RUNNING_ACTIVE_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: RUNNING_SESSIONS_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: RUNNING_STATS_QUERY_KEY }),
    queryClient.invalidateQueries({
      queryKey: WORKOUT_SESSION_HISTORY_QUERY_KEY,
    }),
    queryClient.invalidateQueries({ queryKey: WORKOUT_LOGS_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: WORKOUT_OVERVIEW_QUERY_KEY }),
  ]);
};

export const useRunningActiveSession = (options = {}) => {
  const enabled = useRunningQueryEnabled(options.enabled ?? true);
  const { data, ...query } = useGetQuery({
    url: "/user/workout/running/active",
    queryProps: {
      queryKey: RUNNING_ACTIVE_QUERY_KEY,
      enabled,
      staleTime: 10000,
    },
  });

  return {
    ...query,
    data,
    activeSession: normalizeRunningSession(resolveResponseData(data, null)),
  };
};

export const useRunningSessions = (params = {}, options = {}) => {
  const enabled = useRunningQueryEnabled(options.enabled ?? true);
  const queryString = new URLSearchParams(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  ).toString();
  const url = queryString
    ? `/user/workout/running?${queryString}`
    : "/user/workout/running";
  const { data, ...query } = useGetQuery({
    url,
    queryProps: {
      queryKey: [...RUNNING_SESSIONS_QUERY_KEY, params],
      enabled,
    },
  });
  const responseData = resolveResponseData(data, {});
  const items = Array.isArray(responseData)
    ? responseData
    : Array.isArray(responseData?.data)
      ? responseData.data
      : [];

  return {
    ...query,
    data,
    sessions: items.map(normalizeRunningSession),
    meta: responseData?.meta ?? null,
  };
};

export const useRunningSessionDetail = (workoutSessionId, options = {}) => {
  const enabled = useRunningQueryEnabled(options.enabled ?? true);
  const { data, ...query } = useGetQuery({
    url: `/user/workout/running/${workoutSessionId}`,
    queryProps: {
      queryKey: getRunningSessionDetailQueryKey(workoutSessionId),
      enabled: Boolean(workoutSessionId) && enabled,
    },
  });

  return {
    ...query,
    data,
    session: normalizeRunningSession(resolveResponseData(data, null)),
  };
};

export const useRunningStatsSummary = (options = {}) => {
  const enabled = useRunningQueryEnabled(options.enabled ?? true);
  const { data, ...query } = useGetQuery({
    url: "/user/workout/running/stats/summary",
    queryProps: {
      queryKey: [...RUNNING_STATS_QUERY_KEY, "summary"],
      enabled,
      staleTime: 30000,
    },
  });

  return {
    ...query,
    data,
    stats: resolveResponseData(data, {
      totalRuns: 0,
      totalDistanceMeters: 0,
      totalDurationSeconds: 0,
      totalCaloriesBurned: 0,
    }),
  };
};

export const useStartRunningSession = () => {
  const queryClient = useQueryClient();
  const mutation = usePostQuery();

  const startRunningSession = React.useCallback(
    async (payload = {}) => {
      const response = await mutation.mutateAsync({
        url: "/user/workout/running/start",
        attributes: payload,
      });
      await invalidateRunningQueries(queryClient);
      return normalizeRunningSession(resolveResponseData(response, null));
    },
    [mutation, queryClient],
  );

  return {
    ...mutation,
    startRunningSession,
  };
};

export const useAppendRunningPoints = () => {
  const mutation = usePostQuery();

  const appendPoints = React.useCallback(
    async (workoutSessionId, points, extra = {}) => {
      const response = await mutation.mutateAsync({
        url: `/user/workout/running/${workoutSessionId}/points/batch`,
        attributes: {
          ...extra,
          points,
        },
      });

      return resolveResponseData(response, null);
    },
    [mutation],
  );

  return {
    ...mutation,
    appendPoints,
  };
};

export const usePauseRunningSession = () => {
  const queryClient = useQueryClient();
  const mutation = usePostQuery();

  const pauseRunningSession = React.useCallback(
    async (workoutSessionId) => {
      const response = await mutation.mutateAsync({
        url: `/user/workout/running/${workoutSessionId}/pause`,
      });
      await invalidateRunningQueries(queryClient);
      return normalizeRunningSession(resolveResponseData(response, null));
    },
    [mutation, queryClient],
  );

  return {
    ...mutation,
    pauseRunningSession,
  };
};

export const useResumeRunningSession = () => {
  const queryClient = useQueryClient();
  const mutation = usePostQuery();

  const resumeRunningSession = React.useCallback(
    async (workoutSessionId) => {
      const response = await mutation.mutateAsync({
        url: `/user/workout/running/${workoutSessionId}/resume`,
      });
      await invalidateRunningQueries(queryClient);
      return normalizeRunningSession(resolveResponseData(response, null));
    },
    [mutation, queryClient],
  );

  return {
    ...mutation,
    resumeRunningSession,
  };
};

export const useFinishRunningSession = () => {
  const queryClient = useQueryClient();
  const mutation = usePostQuery();

  const finishRunningSession = React.useCallback(
    async (workoutSessionId, payload = {}) => {
      const response = await mutation.mutateAsync({
        url: `/user/workout/running/${workoutSessionId}/finish`,
        attributes: payload,
      });
      await invalidateRunningQueries(queryClient);
      await queryClient.invalidateQueries({
        queryKey: getRunningSessionDetailQueryKey(workoutSessionId),
      });
      return normalizeRunningSession(resolveResponseData(response, null));
    },
    [mutation, queryClient],
  );

  return {
    ...mutation,
    finishRunningSession,
  };
};

export const useCancelRunningSession = () => {
  const queryClient = useQueryClient();
  const mutation = usePostQuery();

  const cancelRunningSession = React.useCallback(
    async (workoutSessionId, payload = {}) => {
      const response = await mutation.mutateAsync({
        url: `/user/workout/running/${workoutSessionId}/cancel`,
        attributes: payload,
      });
      await invalidateRunningQueries(queryClient);
      return resolveResponseData(response, null);
    },
    [mutation, queryClient],
  );

  return {
    ...mutation,
    cancelRunningSession,
  };
};
