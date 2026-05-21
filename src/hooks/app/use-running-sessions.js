import React from "react";
import { get, filter, isArray, toNumber, map, toPairs } from "lodash";
import { useQueryClient } from "@tanstack/react-query";
import { config } from "@/config.js";
import {
  useDeleteQuery,
  useGetQuery,
  usePatchQuery,
  usePostQuery,
} from "@/hooks/api";
import { trackCampaignConversion } from "@/lib/analytics.js";
import { WORKOUT_LOGS_QUERY_KEY } from "@/hooks/app/use-workout-logs";
import { WORKOUT_OVERVIEW_QUERY_KEY } from "@/hooks/app/use-workout-overview";
import {
  WORKOUT_SESSION_HISTORY_QUERY_KEY,
  WORKOUT_SESSION_HISTORY_SUMMARY_QUERY_KEY,
} from "@/hooks/app/use-workout-sessions";
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
    pausedAt: session.pausedAt ?? null,
    endedAt: session.endedAt ?? null,
    metrics: {
      distanceMeters:
        toNumber(
          get(session, "metrics.distanceMeters", session.distanceMeters ?? 0),
        ) || 0,
      durationSeconds:
        toNumber(
          get(session, "metrics.durationSeconds", session.durationSeconds ?? 0),
        ) || 0,
      movingDurationSeconds:
        toNumber(
          get(
            session,
            "metrics.movingDurationSeconds",
            session.movingDurationSeconds ?? 0,
          ),
        ) || 0,
      pausedDurationSeconds:
        toNumber(
          get(
            session,
            "metrics.pausedDurationSeconds",
            session.pausedDurationSeconds ?? 0,
          ),
        ) || 0,
      caloriesBurned:
        toNumber(
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
      bestPaceSecondsPerKm: get(
        session,
        "metrics.bestPaceSecondsPerKm",
        session.bestPaceSecondsPerKm ?? null,
      ),
      averageSpeedKmh: get(
        session,
        "metrics.averageSpeedKmh",
        session.averageSpeedKmh ?? null,
      ),
      maxSpeedKmh: get(
        session,
        "metrics.maxSpeedKmh",
        session.maxSpeedKmh ?? null,
      ),
      elevationGainMeters: get(
        session,
        "metrics.elevationGainMeters",
        session.elevationGainMeters ?? null,
      ),
      elevationLossMeters: get(
        session,
        "metrics.elevationLossMeters",
        session.elevationLossMeters ?? null,
      ),
      gpsQualityScore: get(
        session,
        "metrics.gpsQualityScore",
        session.gpsQualityScore ?? null,
      ),
    },
    route: session.route ?? null,
    moments: {
      title: get(session, "moments.title", session.momentTitle ?? ""),
      text: get(session, "moments.text", session.momentText ?? ""),
      imageUploadId: get(
        session,
        "moments.imageUploadId",
        session.momentImageUploadId ?? null,
      ),
      imageUrl: get(
        session,
        "moments.imageUrl",
        session.momentImageUrl ?? null,
      ),
    },
    feeling: {
      level: get(session, "feeling.level", session.feelingLevel ?? null),
    },
    bodyMetrics: {
      heightCm: get(session, "bodyMetrics.heightCm", session.heightCm ?? null),
      weightKg: get(session, "bodyMetrics.weightKg", session.weightKg ?? null),
    },
    splits: isArray(session.splits) ? session.splits : [],
    points: isArray(session.points)
      ? filter(
          map(session.points, (point) => ({
            ...point,
            sequence: toNumber(point?.sequence ?? 0) || 0,
            segmentIndex: toNumber(point?.segmentIndex ?? 0) || 0,
            latitude: toNumber(point?.latitude),
            longitude: toNumber(point?.longitude),
            altitude:
              point?.altitude === undefined || point?.altitude === null
                ? null
                : toNumber(point.altitude),
            accuracy:
              point?.accuracy === undefined || point?.accuracy === null
                ? null
                : toNumber(point.accuracy),
            speed:
              point?.speed === undefined || point?.speed === null
                ? null
                : toNumber(point.speed),
            heading:
              point?.heading === undefined || point?.heading === null
                ? null
                : toNumber(point.heading),
            isFilteredOut: Boolean(point?.isFilteredOut),
            rejectionReason: point?.rejectionReason ?? null,
          })),
          (point) =>
            Number.isFinite(point.latitude) && Number.isFinite(point.longitude),
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
    queryClient.invalidateQueries({
      queryKey: WORKOUT_SESSION_HISTORY_SUMMARY_QUERY_KEY,
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
  const activeSession = React.useMemo(
    () => normalizeRunningSession(resolveResponseData(data, null)),
    [data],
  );

  return {
    ...query,
    data,
    activeSession,
  };
};

export const useRunningSessions = (params = {}, options = {}) => {
  const enabled = useRunningQueryEnabled(options.enabled ?? true);
  const queryString = new URLSearchParams(
    filter(
      toPairs(params),
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
  const responseData = React.useMemo(
    () => resolveResponseData(data, {}),
    [data],
  );
  const items = React.useMemo(
    () =>
      isArray(responseData)
        ? responseData
        : isArray(responseData?.data)
          ? responseData.data
          : [],
    [responseData],
  );
  const sessions = React.useMemo(() => {
    const seenSessionIds = new Set();

    return filter(map(items, normalizeRunningSession), (session) => {
      if (!session) {
        return false;
      }

      const sessionId = session.workoutSessionId || session.runningSessionId;
      if (!sessionId) {
        return true;
      }

      if (seenSessionIds.has(sessionId)) {
        return false;
      }

      seenSessionIds.add(sessionId);
      return true;
    });
  }, [items]);

  return {
    ...query,
    data,
    sessions,
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
  const session = React.useMemo(
    () => normalizeRunningSession(resolveResponseData(data, null)),
    [data],
  );

  return {
    ...query,
    data,
    session,
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
  const stats = React.useMemo(
    () =>
      resolveResponseData(data, {
        totalRuns: 0,
        totalDistanceMeters: 0,
        totalDurationSeconds: 0,
        totalCaloriesBurned: 0,
      }),
    [data],
  );

  return {
    ...query,
    data,
    stats,
  };
};

export const useStartRunningSession = () => {
  const queryClient = useQueryClient();
  const mutation = usePostQuery();
  const { mutateAsync } = mutation;

  const startRunningSession = React.useCallback(
    async (payload = {}) => {
      const response = await mutateAsync({
        url: "/user/workout/start-run",
        attributes: payload,
      });
      await invalidateRunningQueries(queryClient);
      return normalizeRunningSession(resolveResponseData(response, null));
    },
    [mutateAsync, queryClient],
  );

  return {
    ...mutation,
    startRunningSession,
  };
};

export const useBeginRunningSession = () => {
  const queryClient = useQueryClient();
  const mutation = usePostQuery();
  const { mutateAsync } = mutation;

  const beginRunningSession = React.useCallback(
    async (workoutSessionId, payload = {}) => {
      const response = await mutateAsync({
        url: `/user/workout/running/${workoutSessionId}/begin`,
        attributes: payload,
      });
      await invalidateRunningQueries(queryClient);
      await queryClient.invalidateQueries({
        queryKey: getRunningSessionDetailQueryKey(workoutSessionId),
      });
      void trackCampaignConversion("workout_done", {
        workoutSessionId,
        workoutType: "running",
      });
      return normalizeRunningSession(resolveResponseData(response, null));
    },
    [mutateAsync, queryClient],
  );

  return {
    ...mutation,
    beginRunningSession,
  };
};

export const useAppendRunningPoints = () => {
  const mutation = usePostQuery();
  const { mutateAsync } = mutation;

  const appendPoints = React.useCallback(
    async (workoutSessionId, points, extra = {}) => {
      const response = await mutateAsync({
        url: `/user/workout/running/${workoutSessionId}/points/batch`,
        attributes: {
          ...extra,
          points,
        },
      });

      return resolveResponseData(response, null);
    },
    [mutateAsync],
  );

  return {
    ...mutation,
    appendPoints,
  };
};

export const usePauseRunningSession = () => {
  const queryClient = useQueryClient();
  const mutation = usePostQuery();
  const { mutateAsync } = mutation;

  const pauseRunningSession = React.useCallback(
    async (workoutSessionId) => {
      const response = await mutateAsync({
        url: `/user/workout/running/${workoutSessionId}/pause`,
      });
      await invalidateRunningQueries(queryClient);
      return normalizeRunningSession(resolveResponseData(response, null));
    },
    [mutateAsync, queryClient],
  );

  return {
    ...mutation,
    pauseRunningSession,
  };
};

export const useResumeRunningSession = () => {
  const queryClient = useQueryClient();
  const mutation = usePostQuery();
  const { mutateAsync } = mutation;

  const resumeRunningSession = React.useCallback(
    async (workoutSessionId) => {
      const response = await mutateAsync({
        url: `/user/workout/running/${workoutSessionId}/resume`,
      });
      await invalidateRunningQueries(queryClient);
      return normalizeRunningSession(resolveResponseData(response, null));
    },
    [mutateAsync, queryClient],
  );

  return {
    ...mutation,
    resumeRunningSession,
  };
};

export const useFinishRunningSession = () => {
  const queryClient = useQueryClient();
  const mutation = usePostQuery();
  const { mutateAsync } = mutation;

  const finishRunningSession = React.useCallback(
    async (workoutSessionId, payload = {}) => {
      const response = await mutateAsync({
        url: `/user/workout/running/${workoutSessionId}/finish`,
        attributes: payload,
      });
      await invalidateRunningQueries(queryClient);
      await queryClient.invalidateQueries({
        queryKey: getRunningSessionDetailQueryKey(workoutSessionId),
      });
      return normalizeRunningSession(resolveResponseData(response, null));
    },
    [mutateAsync, queryClient],
  );

  return {
    ...mutation,
    finishRunningSession,
  };
};

export const useUpdateRunningSessionDetails = () => {
  const queryClient = useQueryClient();
  const mutation = usePatchQuery();
  const { mutateAsync } = mutation;

  const updateRunningSessionDetails = React.useCallback(
    async (workoutSessionId, payload = {}) => {
      const response = await mutateAsync({
        url: `/user/workout/running/${workoutSessionId}/details`,
        attributes: payload,
      });
      await invalidateRunningQueries(queryClient);
      await queryClient.invalidateQueries({
        queryKey: getRunningSessionDetailQueryKey(workoutSessionId),
      });
      return normalizeRunningSession(resolveResponseData(response, null));
    },
    [mutateAsync, queryClient],
  );

  return {
    ...mutation,
    updateRunningSessionDetails,
  };
};

export const useUploadRunningMomentImage = () => {
  const mutation = usePostQuery();
  const { mutateAsync } = mutation;

  const uploadRunningMomentImage = React.useCallback(
    async (file) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "running-moments");

      const response = await mutateAsync({
        url: "/user/media/images",
        attributes: formData,
      });

      return resolveResponseData(response, null);
    },
    [mutateAsync],
  );

  return {
    ...mutation,
    uploadRunningMomentImage,
  };
};

export const useDeleteRunningSession = () => {
  const queryClient = useQueryClient();
  const mutation = useDeleteQuery();
  const { mutateAsync } = mutation;

  const deleteRunningSession = React.useCallback(
    async (workoutSessionId) => {
      const response = await mutateAsync({
        url: `/user/workout/running/${workoutSessionId}`,
      });
      await invalidateRunningQueries(queryClient);
      await queryClient.invalidateQueries({
        queryKey: getRunningSessionDetailQueryKey(workoutSessionId),
      });
      return resolveResponseData(response, null);
    },
    [mutateAsync, queryClient],
  );

  return {
    ...mutation,
    deleteRunningSession,
  };
};

export const useCancelRunningSession = () => {
  const queryClient = useQueryClient();
  const mutation = usePostQuery();
  const { mutateAsync } = mutation;

  const cancelRunningSession = React.useCallback(
    async (workoutSessionId, payload = {}) => {
      const response = await mutateAsync({
        url: `/user/workout/running/${workoutSessionId}/cancel`,
        attributes: payload,
      });
      await invalidateRunningQueries(queryClient);
      return resolveResponseData(response, null);
    },
    [mutateAsync, queryClient],
  );

  return {
    ...mutation,
    cancelRunningSession,
  };
};
