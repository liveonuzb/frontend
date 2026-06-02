import React from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  FlagIcon,
  PlayIcon,
  SquareIcon,
} from "lucide-react";
import { toast } from "sonner";
import PageTransition from "@/components/page-transition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  useAppendRunningPoints,
  useBeginRunningSession,
  useFinishRunningSession,
  usePauseRunningSession,
  useResumeRunningSession,
  useRunningActiveSession,
  useRunningSessionDetail,
} from "@/hooks/app/use-running-sessions";
import {
  clearActiveRunningSession,
  clearRunningPointQueue,
  enqueueRunningPoints,
  loadActiveRunningSession,
  loadRunningPointQueue,
  saveActiveRunningSession,
  saveRunningPointQueue,
} from "@/lib/running-offline-queue";
import {
  buildRunningPointBatch,
  computeRunningSyncBackoffMs,
  dedupeRunningPoints,
  RUNNING_POINT_SYNC_INTERVAL_MS,
} from "@/lib/running-point-sync";
import {
  calculateLiveRunningActiveDuration,
  calculateLiveRunningMetrics,
  formatRunningClockDuration,
  formatRunningPace,
} from "@/lib/running-metrics";
import {
  buildRunningPointFromPosition,
  getRunningLocationErrorStatus,
  isUsableRunningPosition,
  requestFirstRunningPosition,
  RUNNING_LOCATION_ERROR,
  RUNNING_WATCH_OPTIONS,
} from "@/lib/running-location";
import { cn } from "@/lib/utils";
import RunMapPanel from "../components/run-map-panel.jsx";

import filter from "lodash/filter";
import map from "lodash/map";
import reduce from "lodash/reduce";
import split from "lodash/split";
import toNumber from "lodash/toNumber";
import takeRight from "lodash/takeRight";

const getMaxPointSequence = (points = []) =>
  reduce(points, (maxSequence, point) =>
    Math.max(maxSequence, toNumber(point?.sequence ?? 0) || 0), 0);

const getMaxSegmentIndex = (points = []) =>
  reduce(points, (maxSegment, point) =>
    Math.max(maxSegment, toNumber(point?.segmentIndex ?? 0) || 0), 0);

const GPS_STATUS = {
  waiting: "waiting",
  connected: "connected",
  queued: "queued",
  unavailable: "unavailable",
  permission: "permission",
  timeout: "timeout",
  weak: "weak",
};

const COUNTDOWN_START = 3;
const COUNTDOWN_TICK_MS = 800;

const getGpsStatusLabel = (status, t) => {
  const labels = {
    [GPS_STATUS.waiting]: t(
      "user.workout.running.live.gpsWaiting",
      "GPS kutilmoqda",
    ),
    [GPS_STATUS.connected]: t(
      "user.workout.running.live.gpsConnected",
      "GPS ulandi",
    ),
    [GPS_STATUS.queued]: t(
      "user.workout.running.live.syncQueued",
      "Sync navbatda",
    ),
    [GPS_STATUS.unavailable]: t(
      "user.workout.running.live.gpsUnavailable",
      "GPS mavjud emas",
    ),
    [GPS_STATUS.permission]: t(
      "user.workout.running.live.gpsPermission",
      "GPS ruxsati kerak",
    ),
    [GPS_STATUS.timeout]: t(
      "user.workout.running.live.gpsTimeout",
      "GPS sekin javob berdi",
    ),
    [GPS_STATUS.weak]: t(
      "user.workout.running.live.gpsWeak",
      "GPS signali zaif",
    ),
  };

  return labels[status] ?? labels[GPS_STATUS.waiting];
};

const getGpsStateFromLocationError = (error) => {
  const status = getRunningLocationErrorStatus(error);

  if (status === RUNNING_LOCATION_ERROR.permission) {
    return GPS_STATUS.permission;
  }

  if (status === RUNNING_LOCATION_ERROR.timeout) {
    return GPS_STATUS.timeout;
  }

  if (status === RUNNING_LOCATION_ERROR.weak) {
    return GPS_STATUS.weak;
  }

  return GPS_STATUS.unavailable;
};

const formatPrimaryRunningPace = (secondsPerKm) =>
  toNumber(secondsPerKm) > 0
    ? formatRunningPace(secondsPerKm).replace(/\s*\/km$/, "")
    : "0:00";

const formatPrimaryRunningDistance = (meters = 0) =>
  (Math.max(0, toNumber(meters) || 0) / 1000).toFixed(2);

const formatPrimaryRunningDuration = (seconds = 0) => {
  const parts = split(formatRunningClockDuration(seconds), ":");
  return `${toNumber(parts[0]) || 0}:${parts[1]}:${parts[2]}`;
};

const primaryMetricCards = (metrics, elapsedSeconds, t) => [
  {
    label: t("user.workout.running.live.time", "MIN"),
    value: formatPrimaryRunningDuration(
      Math.max(elapsedSeconds, metrics.durationSeconds ?? 0),
    ),
  },
  {
    label: t("user.workout.running.live.distance", "KM"),
    value: formatPrimaryRunningDistance(metrics.distanceMeters),
  },
  {
    label: t("user.workout.running.live.pace", "PACE"),
    value: formatPrimaryRunningPace(metrics.averagePaceSecondsPerKm),
  },
];

const RunningLivePage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { workoutSessionId: routeWorkoutSessionId } = useParams();
  const { activeSession } = useRunningActiveSession();
  const { beginRunningSession, isPending: isBeginning } =
    useBeginRunningSession();
  const { appendPoints } = useAppendRunningPoints();
  const { pauseRunningSession, isPending: isPausing } =
    usePauseRunningSession();
  const { resumeRunningSession, isPending: isResuming } =
    useResumeRunningSession();
  const { finishRunningSession, isPending: isFinishing } =
    useFinishRunningSession();
  const [gpsState, setGpsState] = React.useState(GPS_STATUS.waiting);
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);
  const [queuedCount, setQueuedCount] = React.useState(0);
  const [livePoints, setLivePoints] = React.useState([]);
  const [localStatus, setLocalStatus] = React.useState(null);
  const [finishOpen, setFinishOpen] = React.useState(false);
  const [countdownValue, setCountdownValue] = React.useState(null);
  const [gpsRetryKey, setGpsRetryKey] = React.useState(0);
  const [finishRetryMessage, setFinishRetryMessage] = React.useState("");
  const [trackingSuspended, setTrackingSuspended] = React.useState(false);
  const sequenceRef = React.useRef(0);
  const syncInFlightRef = React.useRef(false);
  const syncTimerRef = React.useRef(null);
  const syncFailureCountRef = React.useRef(0);
  const nextSyncAtRef = React.useRef(0);
  const watchIdRef = React.useRef(null);
  const geolocationRef = React.useRef(null);
  const trackingSuspendedRef = React.useRef(false);
  const workoutSessionIdRef = React.useRef(null);
  const currentStatusRef = React.useRef("ready");
  const localActiveSession = React.useMemo(
    () => loadActiveRunningSession(),
    [],
  );
  const workoutSessionId =
    routeWorkoutSessionId ??
    activeSession?.workoutSessionId ??
    localActiveSession?.workoutSessionId ??
    null;
  const effectiveActiveSession =
    activeSession ??
    (localActiveSession?.workoutSessionId === workoutSessionId
      ? localActiveSession
      : null);
  const optimisticStatus =
    localStatus?.workoutSessionId === workoutSessionId
      ? localStatus.status
      : null;
  const optimisticStartedAt =
    localStatus?.workoutSessionId === workoutSessionId
      ? localStatus.startedAt
      : null;
  const optimisticPausedAt =
    localStatus?.workoutSessionId === workoutSessionId
      ? localStatus.pausedAt
      : null;
  const optimisticPausedDurationSeconds =
    localStatus?.workoutSessionId === workoutSessionId
      ? localStatus.pausedDurationSeconds
      : null;
  const currentStatus =
    optimisticStatus ?? effectiveActiveSession?.status ?? "ready";
  React.useEffect(() => {
    workoutSessionIdRef.current = workoutSessionId;
    currentStatusRef.current = currentStatus;
  }, [currentStatus, workoutSessionId]);

  const { session: runningDetailSession } = useRunningSessionDetail(
    workoutSessionId,
    {
      enabled: Boolean(workoutSessionId) && currentStatus !== "ready",
    },
  );
  const effectiveStartedAt =
    optimisticStartedAt ?? effectiveActiveSession?.startedAt ?? null;
  const effectivePausedAt =
    currentStatus === "paused"
      ? optimisticPausedAt ?? effectiveActiveSession?.pausedAt ?? null
      : null;
  const effectivePausedDurationSeconds =
    toNumber(
      optimisticPausedDurationSeconds ??
        effectiveActiveSession?.metrics?.pausedDurationSeconds ??
        0,
    ) || 0;
  const isReady = currentStatus === "ready";
  const isTrackingActive = currentStatus === "active";
  const isPaused = currentStatus === "paused";
  const isActionPending = isBeginning || isPausing || isResuming || isFinishing;
  const gpsStatus = getGpsStatusLabel(gpsState, t);
  const canRetryGps =
    gpsState === GPS_STATUS.permission ||
    gpsState === GPS_STATUS.unavailable ||
    gpsState === GPS_STATUS.timeout ||
    gpsState === GPS_STATUS.weak;
  const segmentIndexRef = React.useRef(0);
  const routePoints = React.useMemo(
    () =>
      dedupeRunningPoints([
        ...(runningDetailSession?.points ?? effectiveActiveSession?.points ?? []),
        ...loadRunningPointQueue(workoutSessionId),
        ...livePoints,
      ]),
    [effectiveActiveSession?.points, livePoints, runningDetailSession?.points, workoutSessionId],
  );
  const metrics = React.useMemo(
    () =>
      calculateLiveRunningMetrics({
        baseMetrics: effectiveActiveSession?.metrics ?? {},
        elapsedSeconds,
        points: routePoints,
      }),
    [effectiveActiveSession?.metrics, elapsedSeconds, routePoints],
  );

  React.useEffect(() => {
    if (activeSession?.workoutSessionId) {
      saveActiveRunningSession(activeSession);
    }
  }, [activeSession]);

  const saveLocalStatus = React.useCallback(
    (status, extra = {}) => {
      if (!effectiveActiveSession?.workoutSessionId) {
        return;
      }

      saveActiveRunningSession({
        ...effectiveActiveSession,
        ...extra,
        status,
      });
    },
    [effectiveActiveSession],
  );

  const applyAcceptedSequence = React.useCallback((result) => {
    sequenceRef.current = Math.max(
      sequenceRef.current,
      toNumber(result?.lastAcceptedSequence ?? 0) || 0,
    );
  }, []);

  const updateQueuedCount = React.useCallback(() => {
    if (!workoutSessionId) {
      setQueuedCount(0);
      return [];
    }

    const queue = loadRunningPointQueue(workoutSessionId);
    setQueuedCount(queue.length);
    return queue;
  }, [workoutSessionId]);

  const persistIncomingPoints = React.useCallback(
    (incomingPoints = []) => {
      if (!workoutSessionId || incomingPoints.length === 0) {
        return loadRunningPointQueue(workoutSessionId);
      }

      const queue = enqueueRunningPoints(workoutSessionId, incomingPoints);
      setQueuedCount(queue.length);
      setGpsState(GPS_STATUS.queued);
      return queue;
    },
    [workoutSessionId],
  );

  const stopGpsTracking = React.useCallback(() => {
    trackingSuspendedRef.current = true;
    setTrackingSuspended(true);

    const geolocation = geolocationRef.current ?? navigator.geolocation;
    const watchId = watchIdRef.current;

    if (watchId !== null && typeof geolocation?.clearWatch === "function") {
      geolocation.clearWatch(watchId);
    }

    watchIdRef.current = null;
  }, []);

  const allowGpsTracking = React.useCallback(() => {
    trackingSuspendedRef.current = false;
    setTrackingSuspended(false);
  }, []);

  const canRestoreGpsTracking = React.useCallback(
    (targetWorkoutSessionId) =>
      workoutSessionIdRef.current === targetWorkoutSessionId &&
      currentStatusRef.current === "active",
    [],
  );

  const calculateCurrentActiveDuration = React.useCallback(
    () =>
      calculateLiveRunningActiveDuration(effectiveStartedAt, {
        pausedAt: isPaused ? effectivePausedAt : null,
        pausedDurationSeconds: effectivePausedDurationSeconds,
      }),
    [
      effectivePausedAt,
      effectivePausedDurationSeconds,
      effectiveStartedAt,
      isPaused,
    ],
  );

  const calculateCurrentPausedDuration = React.useCallback(() => {
    if (!effectivePausedAt) {
      return effectivePausedDurationSeconds;
    }

    const pausedAtTime = new Date(effectivePausedAt).getTime();
    if (!Number.isFinite(pausedAtTime)) {
      return effectivePausedDurationSeconds;
    }

    return Math.max(
      0,
      effectivePausedDurationSeconds +
        Math.round((Date.now() - pausedAtTime) / 1000),
    );
  }, [effectivePausedAt, effectivePausedDurationSeconds]);

  const syncRunningPoints = React.useCallback(
    async ({ force = false } = {}) => {
      if (
        !workoutSessionId ||
        syncInFlightRef.current ||
        currentStatusRef.current === "ready"
      ) {
        return { ok: false, reason: "busy" };
      }

      const now = Date.now();
      if (!force && now < nextSyncAtRef.current) {
        return { ok: false, reason: "backoff" };
      }

      const queue = loadRunningPointQueue(workoutSessionId);
      const points = buildRunningPointBatch(queue);

      if (points.length === 0) {
        setQueuedCount(0);
        return { ok: true, accepted: 0 };
      }

      syncInFlightRef.current = true;

      try {
        const result = await appendPoints(workoutSessionId, points);
        applyAcceptedSequence(result);
        const acceptedSequence = toNumber(result?.lastAcceptedSequence ?? 0) || 0;
        const remaining = filter(
          loadRunningPointQueue(workoutSessionId),
          (point) => toNumber(point.sequence) > acceptedSequence,
        );
        saveRunningPointQueue(workoutSessionId, remaining);
        setQueuedCount(remaining.length);
        setGpsState(
          remaining.length > 0 ? GPS_STATUS.queued : GPS_STATUS.connected,
        );
        syncFailureCountRef.current = 0;
        nextSyncAtRef.current = Date.now() + RUNNING_POINT_SYNC_INTERVAL_MS;
        return { ok: true, accepted: toNumber(result?.acceptedCount ?? 0) || 0 };
      } catch (error) {
        syncFailureCountRef.current += 1;
        const headers = error?.response?.headers ?? {};
        const backoffMs = computeRunningSyncBackoffMs({
          failureCount: syncFailureCountRef.current,
          headers,
        });
        nextSyncAtRef.current = Date.now() + backoffMs;
        updateQueuedCount();
        setGpsState(GPS_STATUS.queued);
        return { ok: false, reason: "failed", error };
      } finally {
        syncInFlightRef.current = false;
      }
    },
    [appendPoints, applyAcceptedSequence, updateQueuedCount, workoutSessionId],
  );

  const flushRunningPointsBeforeFinish = React.useCallback(async () => {
    if (!workoutSessionId) {
      return { ok: true };
    }

    let remaining = loadRunningPointQueue(workoutSessionId).length;
    let attempts = Math.ceil(remaining / 24) + 2;

    while (remaining > 0 && attempts > 0) {
      const result = await syncRunningPoints({ force: true });
      if (!result.ok) {
        return result;
      }

      const nextRemaining = loadRunningPointQueue(workoutSessionId).length;
      if (nextRemaining >= remaining && result.accepted === 0) {
        break;
      }

      remaining = nextRemaining;
      attempts -= 1;
    }

    updateQueuedCount();
    return { ok: true };
  }, [syncRunningPoints, updateQueuedCount, workoutSessionId]);

  /*
   * Live running view hydrates queue/timer/GPS status from active session and
   * browser geolocation watcher lifecycle.
   */
  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (!workoutSessionId) {
      return;
    }

    const queuedPoints = loadRunningPointQueue(workoutSessionId);
    const persistedPoints =
      runningDetailSession?.points ?? effectiveActiveSession?.points ?? [];
    sequenceRef.current = Math.max(
      sequenceRef.current,
      toNumber(effectiveActiveSession?.lastAcceptedSequence ?? 0) || 0,
      getMaxPointSequence(queuedPoints),
      getMaxPointSequence(persistedPoints),
    );
    segmentIndexRef.current = Math.max(
      segmentIndexRef.current,
      getMaxSegmentIndex(queuedPoints),
      getMaxSegmentIndex(persistedPoints),
    );
    setQueuedCount(queuedPoints.length);
  }, [
    effectiveActiveSession?.lastAcceptedSequence,
    effectiveActiveSession?.points,
    runningDetailSession?.points,
    workoutSessionId,
  ]);

  React.useEffect(() => {
    if (isReady || !effectiveStartedAt) {
      setElapsedSeconds(0);
      return undefined;
    }

    setElapsedSeconds(calculateCurrentActiveDuration());
    const timer = window.setInterval(() => {
      setElapsedSeconds(calculateCurrentActiveDuration());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [calculateCurrentActiveDuration, effectiveStartedAt, isReady]);

  React.useEffect(() => {
    if (!workoutSessionId || !isTrackingActive || trackingSuspended) {
      return undefined;
    }

    const geolocation = navigator.geolocation;

    if (typeof geolocation?.watchPosition !== "function") {
      setGpsState(GPS_STATUS.unavailable);
      return undefined;
    }

    const watchId = geolocation.watchPosition(
      (position) => {
        if (trackingSuspendedRef.current) {
          return;
        }

        const nextSequence = sequenceRef.current + 1;
        sequenceRef.current = nextSequence;
        const point = buildRunningPointFromPosition(position, {
          sequence: nextSequence,
          segmentIndex: segmentIndexRef.current,
        });

        setLivePoints((currentPoints) =>
          takeRight([...currentPoints, point], 3000),
        );
        persistIncomingPoints([point]);
        if (!isUsableRunningPosition(position)) {
          setGpsState(GPS_STATUS.weak);
        }
        void syncRunningPoints();
      },
      (error) => {
        if (trackingSuspendedRef.current) {
          return;
        }

        setGpsState(getGpsStateFromLocationError(error));
      },
      RUNNING_WATCH_OPTIONS,
    );
    geolocationRef.current = geolocation;
    watchIdRef.current = watchId;

    return () => {
      if (
        watchIdRef.current === watchId &&
        typeof geolocation.clearWatch === "function"
      ) {
        geolocation.clearWatch(watchId);
        watchIdRef.current = null;
      }
    };
  }, [
    gpsRetryKey,
    isTrackingActive,
    persistIncomingPoints,
    syncRunningPoints,
    trackingSuspended,
    workoutSessionId,
  ]);

  React.useEffect(() => {
    if (!workoutSessionId || isReady) {
      return undefined;
    }

    syncTimerRef.current = window.setInterval(() => {
      void syncRunningPoints();
    }, RUNNING_POINT_SYNC_INTERVAL_MS);

    return () => {
      if (syncTimerRef.current) {
        window.clearInterval(syncTimerRef.current);
        syncTimerRef.current = null;
      }
    };
  }, [isReady, syncRunningPoints, workoutSessionId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleRetryGps = () => {
    setGpsState(GPS_STATUS.waiting);
    setGpsRetryKey((currentKey) => currentKey + 1);
  };

  const runStartCountdown = React.useCallback(async () => {
    for (let value = COUNTDOWN_START; value >= 1; value -= 1) {
      setCountdownValue(value);
      await new Promise((resolve) =>
        window.setTimeout(resolve, COUNTDOWN_TICK_MS),
      );
    }
    setCountdownValue(null);
  }, []);

  const handleStartRun = async () => {
    if (!workoutSessionId || isActionPending || !isReady) {
      return;
    }

    setFinishRetryMessage("");
    setGpsState(GPS_STATUS.waiting);

    try {
      await runStartCountdown();
      const startedAt = new Date().toISOString();
      let firstPoint = null;
      let firstPointError = null;

      try {
        const position = await requestFirstRunningPosition({
          requireUsable: false,
        });
        const nextSequence = sequenceRef.current + 1;
        sequenceRef.current = nextSequence;
        firstPoint = buildRunningPointFromPosition(position, {
          sequence: nextSequence,
          segmentIndex: segmentIndexRef.current,
        });
        setLivePoints((currentPoints) =>
          takeRight([...currentPoints, firstPoint], 3000),
        );
        persistIncomingPoints([firstPoint]);
        if (!isUsableRunningPosition(position)) {
          firstPointError = {
            code: RUNNING_LOCATION_ERROR.weak,
            accuracy: position.coords.accuracy,
          };
        }
      } catch (error) {
        firstPointError = error;
      }

      const session = await beginRunningSession(workoutSessionId, {
        startedAt,
        ...(firstPoint ? { firstPoint } : {}),
      });
      applyAcceptedSequence(session);
      const nextStartedAt = session?.startedAt ?? startedAt;
      setLocalStatus({
        workoutSessionId,
        status: "active",
        startedAt: nextStartedAt,
        pausedAt: null,
        pausedDurationSeconds: session?.metrics?.pausedDurationSeconds ?? 0,
      });
      saveLocalStatus("active", {
        startedAt: nextStartedAt,
        pausedAt: null,
        metrics: {
          ...(effectiveActiveSession?.metrics ?? {}),
          ...(session?.metrics ?? {}),
          pausedDurationSeconds: session?.metrics?.pausedDurationSeconds ?? 0,
        },
        lastAcceptedSequence:
          session?.lastAcceptedSequence ??
          effectiveActiveSession?.lastAcceptedSequence,
      });
      allowGpsTracking();
      setElapsedSeconds(0);
      if (firstPointError) {
        setGpsState(getGpsStateFromLocationError(firstPointError));
      }
    } catch (error) {
      setCountdownValue(null);
      setLocalStatus({ workoutSessionId, status: "ready" });
      saveLocalStatus("ready");
      setGpsState(getGpsStateFromLocationError(error));
      toast.error(
        t(
          "user.workout.running.live.beginError",
          "Yugurishni boshlash imkoni bo'lmadi.",
        ),
      );
    }
  };

  const handlePauseResume = async () => {
    if (!workoutSessionId) {
      return;
    }

    if (isReady) {
      await handleStartRun();
      return;
    }

    if (isPaused) {
      const nextPausedDurationSeconds = calculateCurrentPausedDuration();

      try {
        const session = await resumeRunningSession(workoutSessionId);
        const sessionPausedDurationSeconds = toNumber(
          session?.metrics?.pausedDurationSeconds,
        );
        const resumedPausedDurationSeconds = Number.isFinite(
          sessionPausedDurationSeconds,
        )
          ? sessionPausedDurationSeconds
          : nextPausedDurationSeconds;
        segmentIndexRef.current += 1;
        allowGpsTracking();
        setLocalStatus({
          workoutSessionId,
          status: "active",
          startedAt: session?.startedAt ?? effectiveStartedAt,
          pausedAt: null,
          pausedDurationSeconds: resumedPausedDurationSeconds,
        });
        saveLocalStatus("active", {
          startedAt: session?.startedAt ?? effectiveStartedAt,
          pausedAt: null,
          metrics: {
            ...(effectiveActiveSession?.metrics ?? {}),
            ...(session?.metrics ?? {}),
            pausedDurationSeconds: resumedPausedDurationSeconds,
          },
        });
      } catch {
        setLocalStatus({
          workoutSessionId,
          status: "paused",
          startedAt: effectiveStartedAt,
          pausedAt: effectivePausedAt,
          pausedDurationSeconds: effectivePausedDurationSeconds,
        });
        saveLocalStatus("paused", {
          startedAt: effectiveStartedAt,
          pausedAt: effectivePausedAt,
          metrics: {
            ...(effectiveActiveSession?.metrics ?? {}),
            pausedDurationSeconds: effectivePausedDurationSeconds,
          },
        });
        toast.error(
          t(
            "user.workout.running.live.resumeError",
            "Yugurishni davom ettirib bo'lmadi.",
          ),
        );
      }
      return;
    }

    const pausedAt = new Date().toISOString();
    const nextPausedDurationSeconds = effectivePausedDurationSeconds;
    stopGpsTracking();
    void syncRunningPoints({ force: true });
    setLocalStatus({
      workoutSessionId,
      status: "paused",
      startedAt: effectiveStartedAt,
      pausedAt,
      pausedDurationSeconds: nextPausedDurationSeconds,
    });
    saveLocalStatus("paused", {
      startedAt: effectiveStartedAt,
      pausedAt,
      metrics: {
        ...(effectiveActiveSession?.metrics ?? {}),
        pausedDurationSeconds: nextPausedDurationSeconds,
      },
    });
    try {
      const session = await pauseRunningSession(workoutSessionId);
      const confirmedPausedAt = session?.pausedAt ?? pausedAt;
      const sessionPausedDurationSeconds = toNumber(
        session?.metrics?.pausedDurationSeconds,
      );
      const confirmedPausedDurationSeconds = Number.isFinite(
        sessionPausedDurationSeconds,
      )
        ? sessionPausedDurationSeconds
        : nextPausedDurationSeconds;
      setLocalStatus({
        workoutSessionId,
        status: "paused",
        startedAt: session?.startedAt ?? effectiveStartedAt,
        pausedAt: confirmedPausedAt,
        pausedDurationSeconds: confirmedPausedDurationSeconds,
      });
      saveLocalStatus("paused", {
        startedAt: session?.startedAt ?? effectiveStartedAt,
        pausedAt: confirmedPausedAt,
        metrics: {
          ...(effectiveActiveSession?.metrics ?? {}),
          ...(session?.metrics ?? {}),
          pausedDurationSeconds: confirmedPausedDurationSeconds,
        },
      });
    } catch {
      allowGpsTracking();
      setLocalStatus({
        workoutSessionId,
        status: "active",
        startedAt: effectiveStartedAt,
        pausedAt: null,
        pausedDurationSeconds: effectivePausedDurationSeconds,
      });
      saveLocalStatus("active", {
        startedAt: effectiveStartedAt,
        pausedAt: null,
        metrics: {
          ...(effectiveActiveSession?.metrics ?? {}),
          pausedDurationSeconds: effectivePausedDurationSeconds,
        },
      });
      toast.error(
        t(
          "user.workout.running.live.pauseError",
          "Yugurishni pauzaga qo'yib bo'lmadi.",
        ),
      );
    }
  };

  const handleFinish = async () => {
    if (!workoutSessionId) {
      return;
    }

    setFinishOpen(false);
    setFinishRetryMessage("");
    stopGpsTracking();
    const flushResult = await flushRunningPointsBeforeFinish();
    if (!flushResult.ok && loadRunningPointQueue(workoutSessionId).length > 0) {
      const message = t(
        "user.workout.running.live.syncBeforeFinishError",
        "GPS nuqtalar hali saqlanmadi. Internet tiklangach qayta urinib ko'ring.",
      );
      if (canRestoreGpsTracking(workoutSessionId)) {
        allowGpsTracking();
      }
      setFinishRetryMessage(message);
      toast.error(message);
      return;
    }

    const finalPoints = takeRight(dedupeRunningPoints([
      ...loadRunningPointQueue(workoutSessionId),
      ...livePoints,
    ]), 600);
    const finalPointSequence =
      Math.max(sequenceRef.current, getMaxPointSequence(finalPoints)) ||
      undefined;

    const finishedAt = new Date().toISOString();
    const finishPayload = {
      finishedAt,
      finalPointSequence,
      finalPoints,
    };

    const completeFinish = (session) => {
      clearActiveRunningSession();
      clearRunningPointQueue(workoutSessionId);
      navigate(
        `/user/workout/history/${session?.workoutSessionId ?? workoutSessionId}`,
      );
    };

    try {
      const session = await finishRunningSession(
        workoutSessionId,
        finishPayload,
      );
      completeFinish(session);
    } catch {
      const message = t(
        "user.workout.running.live.finishError",
        "Yugurishni yakunlab bo'lmadi. Qayta urinib ko'ring.",
      );
      if (canRestoreGpsTracking(workoutSessionId)) {
        allowGpsTracking();
      }
      setFinishRetryMessage(message);
      toast.error(message);
    }
  };

  if (!workoutSessionId) {
    return (
      <PageTransition mode="slide-up">
        <Card className="py-6">
          <CardHeader>
            <CardTitle>Faol yugurish yo'q</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/user/workout/overview")}>
              {t(
                "user.workout.running.live.backToStart",
                "Yugurishni boshlashga qaytish",
              )}
            </Button>
          </CardContent>
        </Card>
      </PageTransition>
    );
  }

  return (
    <PageTransition mode="slide-up">
      <div
        data-testid="running-live-page"
        className="flex min-h-[calc(100dvh-12rem)] w-full flex-col overflow-hidden bg-background text-foreground md:min-h-[calc(100dvh-8rem)]"
      >
        <section className="relative z-20 bg-background px-3 pb-1.5 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-5 sm:pb-2 md:px-6">
          <div className="mx-auto grid w-full max-w-[920px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-1.5 text-center sm:gap-4">
            {map(primaryMetricCards(metrics, elapsedSeconds, t), (item, index) => (
              <React.Fragment key={item.label}>
                <div className="min-w-0">
                  <p className="whitespace-nowrap text-xl font-semibold leading-none tabular-nums tracking-normal text-foreground min-[390px]:text-2xl sm:text-[1.7rem] lg:text-3xl">
                    {item.value}
                  </p>
                  <p className="mt-1 whitespace-nowrap text-[0.58rem] font-medium uppercase tracking-normal text-muted-foreground sm:text-[0.68rem] lg:text-xs">
                    {item.label}
                  </p>
                </div>
                {index < 2 ? (
                  <div
                    className="mb-2 h-7 w-px bg-border sm:h-8 lg:h-10"
                    aria-hidden="true"
                  />
                ) : null}
              </React.Fragment>
            ))}
          </div>
          <div className="mt-1 flex justify-center text-muted-foreground">
            <ChevronDownIcon className="size-4" aria-hidden="true" />
          </div>
        </section>

        <section className="relative min-h-[320px] flex-1 overflow-hidden bg-muted sm:min-h-[380px] md:min-h-[460px]">
          <RunMapPanel
            title={null}
            variant="live"
            points={routePoints}
            emptyLabel={gpsStatus}
            className="absolute inset-0"
            contentClassName="p-0"
            surfaceClassName="h-full min-h-0 rounded-none md:h-full"
          />

          <div className="absolute left-3 top-3 z-10 flex flex-wrap items-center gap-1.5 sm:left-4 sm:top-4">
            <Badge
              variant="secondary"
              className="h-9 w-auto max-w-[calc(100vw-2rem)] justify-start gap-1.5 rounded-full border bg-background/90 px-3 text-xs shadow-lg backdrop-blur sm:max-w-[18rem]"
              role="status"
              aria-live="polite"
            >
              {gpsState === GPS_STATUS.connected ? (
                <CheckCircle2Icon
                  className="size-4 text-primary"
                  aria-hidden="true"
                />
              ) : (
                <AlertTriangleIcon
                  className="size-4 text-primary"
                  aria-hidden="true"
                />
              )}
              <span className="min-w-0 truncate">{gpsStatus}</span>
            </Badge>
            {queuedCount > 0 ? (
              <Badge
                variant="outline"
                className="h-8 rounded-full bg-background/90 px-2.5 text-xs shadow-lg backdrop-blur"
              >
                {t("user.workout.running.live.queue", "Navbat")} {queuedCount}
              </Badge>
            ) : null}
            {canRetryGps ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-8 rounded-full bg-background/90 px-3 text-xs shadow-lg backdrop-blur"
                onClick={handleRetryGps}
              >
                {t("user.workout.running.live.retryGps", "GPS qayta urinish")}
              </Button>
            ) : null}
          </div>

          {isReady ? (
            <button
              type="button"
              className="absolute bottom-[calc(env(safe-area-inset-bottom)+5rem)] left-1/2 z-10 flex size-24 -translate-x-1/2 items-center justify-center rounded-full bg-destructive text-xl font-semibold uppercase text-white shadow-[0_20px_52px_rgba(239,68,68,0.34)] disabled:opacity-60 sm:size-28 sm:text-2xl md:bottom-[max(2rem,env(safe-area-inset-bottom))]"
              onClick={handleStartRun}
              disabled={isActionPending || Boolean(countdownValue)}
            >
              {isBeginning
                ? t("user.workout.running.live.starting", "START")
                : t("user.workout.running.live.start", "START")}
            </button>
          ) : null}

          {countdownValue ? (
            <div
              className="absolute inset-0 z-30 flex items-center justify-center bg-black/80"
              aria-live="polite"
            >
              <span className="text-9xl font-semibold leading-none text-primary drop-shadow-2xl">
                {countdownValue}
              </span>
            </div>
          ) : null}

          {!isReady ? (
            <div
              className={cn(
                "absolute inset-x-0 bottom-0 z-20 flex justify-center bg-gradient-to-t from-black/52 via-black/18 to-transparent px-4 pb-[calc(env(safe-area-inset-bottom)+5rem)] pt-16 text-white md:pb-[max(1.5rem,env(safe-area-inset-bottom))]",
                isPaused && "top-0 items-end bg-black/35",
              )}
            >
              <div className="grid w-full max-w-[288px] grid-cols-2 gap-4 sm:max-w-[340px] sm:gap-6">
                <button
                  type="button"
                  aria-label={t("user.workout.running.live.endAction", "END")}
                  className="flex flex-col items-center gap-2 text-xs font-semibold uppercase tracking-normal text-white disabled:opacity-50 sm:text-sm"
                  onClick={() => setFinishOpen(true)}
                  disabled={isActionPending}
                >
                  <span>{t("user.workout.running.live.endAction", "END")}</span>
                  <span
                    className="flex size-16 items-center justify-center rounded-full bg-destructive text-white shadow-[0_18px_42px_rgba(0,0,0,0.3)] sm:size-20"
                    aria-hidden="true"
                  >
                    <SquareIcon className="size-5 fill-current sm:size-6" />
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={t(
                    "user.workout.running.live.resumeAction",
                    "RESUME",
                  )}
                  className="flex flex-col items-center gap-2 text-xs font-semibold uppercase tracking-normal text-white disabled:opacity-50 sm:text-sm"
                  onClick={handlePauseResume}
                  disabled={isActionPending}
                >
                  <span>
                    {t("user.workout.running.live.resumeAction", "RESUME")}
                  </span>
                  <span
                    className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_18px_42px_rgba(0,0,0,0.3)] sm:size-20"
                    aria-hidden="true"
                  >
                    <PlayIcon className="size-6 fill-current sm:size-7" />
                  </span>
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <div className="sr-only">
          {isPaused
            ? t("user.workout.running.live.paused", "Pauzada")
            : isReady
              ? t("user.workout.running.live.ready", "Startga tayyor")
              : t("user.workout.running.live.tracking", "GPS tracking")}
        </div>

        {finishRetryMessage ? (
          <div className="m-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800">
            {finishRetryMessage}
          </div>
        ) : null}

        <Drawer
          direction="bottom"
          open={finishOpen}
          onOpenChange={setFinishOpen}
          shouldScaleBackground={false}
        >
          <DrawerContent
            className="data-[vaul-drawer-direction=bottom]:md:max-w-sm"
          >
            <DrawerHeader className="items-center p-5 pb-2 text-center">
              <div
                className="flex size-14 items-center justify-center rounded-full bg-primary/15 text-primary"
                aria-hidden="true"
              >
                <FlagIcon className="size-7" />
              </div>
              <DrawerTitle className="text-2xl font-semibold">
                {t(
                  "user.workout.running.live.finishTitle",
                  "Yugurishni yakunlaysizmi?",
                )}
              </DrawerTitle>
              <DrawerDescription>
                {t(
                  "user.workout.running.live.finishDescription",
                  "GPS nuqtalar saqlanadi va natija hisoblanadi.",
                )}
              </DrawerDescription>
            </DrawerHeader>
            <DrawerFooter className="grid gap-3 p-5 pt-2">
              <Button
                type="button"
                size="lg"
                onClick={handleFinish}
                disabled={isFinishing}
                className="h-12 text-base"
              >
                {t("user.workout.running.live.finishConfirm", "Yakunlash")}
              </Button>
              <Button
                type="button"
                size="lg"
                variant="secondary"
                onClick={() => setFinishOpen(false)}
                disabled={isFinishing}
                className="h-12 text-base"
              >
                {t("user.workout.running.live.finishContinue", "Davom etish")}
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    </PageTransition>
  );
};

export default RunningLivePage;
