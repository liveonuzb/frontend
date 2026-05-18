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
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import PageTransition from "@/components/page-transition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Drawer,
  DrawerClose,
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
  calculateLiveRunningDuration,
  calculateLiveRunningMetrics,
  formatRunningClockDuration,
  formatRunningPace,
} from "@/lib/running-metrics";
import { cn } from "@/lib/utils";
import RunMapPanel from "../components/run-map-panel.jsx";

import { filter, map, reduce, split, toNumber, takeRight } from "lodash";

const getMaxPointSequence = (points = []) =>
  reduce(points, (maxSequence, point) =>
    Math.max(maxSequence, toNumber(point?.sequence ?? 0) || 0), 0);

const GPS_STATUS = {
  waiting: "waiting",
  connected: "connected",
  queued: "queued",
  unavailable: "unavailable",
  permission: "permission",
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
  };

  return labels[status] ?? labels[GPS_STATUS.waiting];
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
    label: t("user.workout.running.live.pace", "PACE (MIN/KM)"),
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
  const currentStatus =
    optimisticStatus ?? effectiveActiveSession?.status ?? "ready";
  const effectiveStartedAt =
    optimisticStartedAt ?? effectiveActiveSession?.startedAt ?? null;
  workoutSessionIdRef.current = workoutSessionId;
  currentStatusRef.current = currentStatus;
  const isReady = currentStatus === "ready";
  const isTrackingActive = currentStatus === "active";
  const isPaused = currentStatus === "paused";
  const isActionPending = isBeginning || isPausing || isResuming || isFinishing;
  const gpsStatus = getGpsStatusLabel(gpsState, t);
  const canRetryGps =
    gpsState === GPS_STATUS.permission || gpsState === GPS_STATUS.unavailable;
  const metrics = React.useMemo(
    () =>
      calculateLiveRunningMetrics({
        baseMetrics: effectiveActiveSession?.metrics ?? {},
        elapsedSeconds,
        points: livePoints,
      }),
    [effectiveActiveSession?.metrics, elapsedSeconds, livePoints],
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
    sequenceRef.current = Math.max(
      sequenceRef.current,
      toNumber(effectiveActiveSession?.lastAcceptedSequence ?? 0) || 0,
      getMaxPointSequence(queuedPoints),
    );
    setQueuedCount(queuedPoints.length);
  }, [effectiveActiveSession?.lastAcceptedSequence, workoutSessionId]);

  React.useEffect(() => {
    if (isReady || !effectiveStartedAt) {
      setElapsedSeconds(0);
      return undefined;
    }

    setElapsedSeconds(calculateLiveRunningDuration(effectiveStartedAt));
    const timer = window.setInterval(() => {
      setElapsedSeconds(calculateLiveRunningDuration(effectiveStartedAt));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [effectiveStartedAt, isReady]);

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
        const point = {
          sequence: nextSequence,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: position.coords.altitude ?? undefined,
          accuracy: position.coords.accuracy ?? undefined,
          speed: position.coords.speed ?? undefined,
          heading: position.coords.heading ?? undefined,
          sourceTimestamp: new Date(position.timestamp).toISOString(),
        };

        setLivePoints((currentPoints) => takeRight([...currentPoints, point], 500));
        persistIncomingPoints([point]);
        void syncRunningPoints();
      },
      () => {
        if (trackingSuspendedRef.current) {
          return;
        }

        setGpsState(GPS_STATUS.permission);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      },
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
      const session = await beginRunningSession(workoutSessionId, {
        startedAt,
      });
      const nextStartedAt = session?.startedAt ?? startedAt;
      setLocalStatus({
        workoutSessionId,
        status: "active",
        startedAt: nextStartedAt,
      });
      saveLocalStatus("active", {
        startedAt: nextStartedAt,
        metrics: session?.metrics ?? effectiveActiveSession?.metrics,
        lastAcceptedSequence:
          session?.lastAcceptedSequence ??
          effectiveActiveSession?.lastAcceptedSequence,
      });
      allowGpsTracking();
      setElapsedSeconds(0);
    } catch {
      setCountdownValue(null);
      setLocalStatus({ workoutSessionId, status: "ready" });
      saveLocalStatus("ready");
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
      try {
        const session = await resumeRunningSession(workoutSessionId);
        allowGpsTracking();
        setLocalStatus({
          workoutSessionId,
          status: "active",
          startedAt: session?.startedAt ?? effectiveStartedAt,
        });
        saveLocalStatus("active", {
          startedAt: session?.startedAt ?? effectiveStartedAt,
        });
      } catch {
        setLocalStatus({
          workoutSessionId,
          status: "paused",
          startedAt: effectiveStartedAt,
        });
        saveLocalStatus("paused", { startedAt: effectiveStartedAt });
        toast.error(
          t(
            "user.workout.running.live.resumeError",
            "Yugurishni davom ettirib bo'lmadi.",
          ),
        );
      }
      return;
    }

    void syncRunningPoints({ force: true });
    setLocalStatus({
      workoutSessionId,
      status: "paused",
      startedAt: effectiveStartedAt,
    });
    saveLocalStatus("paused", { startedAt: effectiveStartedAt });
    try {
      await pauseRunningSession(workoutSessionId);
    } catch {
      setLocalStatus({
        workoutSessionId,
        status: "active",
        startedAt: effectiveStartedAt,
      });
      saveLocalStatus("active", { startedAt: effectiveStartedAt });
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
        `/user/workout/running/${session?.workoutSessionId ?? workoutSessionId}`,
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
        <Card>
          <CardHeader>
            <CardTitle>Faol yugurish yo'q</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/user/workout/running")}>
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
      <div className="flex min-h-[100dvh] w-full flex-col overflow-hidden bg-background text-foreground">
        <section className="relative z-20 bg-background px-4 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-6 sm:pb-3 md:px-8">
          <div className="mx-auto grid w-full max-w-[1120px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2 text-center sm:gap-5">
            {map(primaryMetricCards(metrics, elapsedSeconds, t), (item, index) => (
              <React.Fragment key={item.label}>
                <div className="min-w-0">
                  <p className="whitespace-nowrap text-[1.55rem] font-semibold leading-none tabular-nums tracking-normal text-foreground min-[390px]:text-[1.7rem] sm:text-[2.15rem] lg:text-[2.65rem]">
                    {item.value}
                  </p>
                  <p className="mt-2 whitespace-nowrap text-[0.6rem] font-medium uppercase tracking-normal text-muted-foreground sm:text-xs lg:text-sm">
                    {item.label}
                  </p>
                </div>
                {index < 2 ? (
                  <div
                    className="mb-3 h-10 w-px bg-border sm:h-12 lg:h-14"
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

        <section className="relative min-h-[520px] flex-1 overflow-hidden bg-muted">
          <RunMapPanel
            title={null}
            variant="live"
            points={livePoints}
            emptyLabel={gpsStatus}
            className="absolute inset-0"
            contentClassName="p-0"
            surfaceClassName="h-full min-h-0 rounded-none md:h-full"
          />

          <div className="absolute left-5 top-5 z-10 flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className="h-12 w-[13rem] max-w-[calc(100vw-2.5rem)] justify-start gap-2 rounded-full border bg-background/90 px-4 text-sm shadow-lg backdrop-blur sm:w-[14.5rem] sm:text-base"
              role="status"
              aria-live="polite"
            >
              {gpsState === GPS_STATUS.connected ? (
                <CheckCircle2Icon
                  className="size-5 text-primary"
                  aria-hidden="true"
                />
              ) : (
                <AlertTriangleIcon
                  className="size-5 text-primary"
                  aria-hidden="true"
                />
              )}
              <span className="min-w-0 truncate">{gpsStatus}</span>
            </Badge>
            {queuedCount > 0 ? (
              <Badge
                variant="outline"
                className="h-10 rounded-full bg-background/90 px-3 shadow-lg backdrop-blur"
              >
                {t("user.workout.running.live.queue", "Navbat")} {queuedCount}
              </Badge>
            ) : null}
            {canRetryGps ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="rounded-full bg-background/90 shadow-lg backdrop-blur"
                onClick={handleRetryGps}
              >
                {t("user.workout.running.live.retryGps", "GPS qayta urinish")}
              </Button>
            ) : null}
          </div>

          {isReady ? (
            <button
              type="button"
              className="absolute bottom-[max(3rem,env(safe-area-inset-bottom))] left-1/2 z-10 flex size-28 -translate-x-1/2 items-center justify-center rounded-full bg-destructive text-2xl font-semibold uppercase text-white shadow-[0_24px_70px_rgba(239,68,68,0.38)] disabled:opacity-60 sm:size-32 sm:text-3xl"
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
                "absolute inset-x-0 bottom-0 z-20 flex justify-center bg-gradient-to-t from-black/60 via-black/25 to-transparent px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-20 text-white",
                isPaused && "top-0 items-end bg-black/58",
              )}
            >
              <div className="grid w-full max-w-[340px] grid-cols-2 gap-5 sm:max-w-[400px] sm:gap-8">
                <button
                  type="button"
                  aria-label={t("user.workout.running.live.endAction", "END")}
                  className="flex flex-col items-center gap-3 text-sm font-semibold uppercase tracking-normal text-white disabled:opacity-50"
                  onClick={() => setFinishOpen(true)}
                  disabled={isActionPending}
                >
                  <span>{t("user.workout.running.live.endAction", "END")}</span>
                  <span
                    className="flex size-20 items-center justify-center rounded-full bg-destructive text-white shadow-[0_22px_54px_rgba(0,0,0,0.32)] sm:size-24"
                    aria-hidden="true"
                  >
                    <SquareIcon className="size-7 fill-current" />
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={t(
                    "user.workout.running.live.resumeAction",
                    "RESUME",
                  )}
                  className="flex flex-col items-center gap-3 text-sm font-semibold uppercase tracking-normal text-white disabled:opacity-50"
                  onClick={handlePauseResume}
                  disabled={isActionPending}
                >
                  <span>
                    {t("user.workout.running.live.resumeAction", "RESUME")}
                  </span>
                  <span
                    className="flex size-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_22px_54px_rgba(0,0,0,0.32)] sm:size-24"
                    aria-hidden="true"
                  >
                    <PlayIcon className="size-8 fill-current" />
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
            className="data-[vaul-drawer-direction=bottom]:mx-0 before:rounded-b-none before:rounded-t-[2rem]"
            style={{
              maxWidth: "none",
              width: "100%",
            }}
          >
            <DrawerClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-5 top-5 z-10 rounded-full"
                disabled={isFinishing}
                aria-label={t("user.workout.running.live.finishClose", "Close")}
              >
                <XIcon className="size-5" aria-hidden="true" />
              </Button>
            </DrawerClose>
            <DrawerHeader className="items-center p-7 pb-3 text-center">
              <div
                className="flex size-20 items-center justify-center rounded-full bg-primary/15 text-primary"
                aria-hidden="true"
              >
                <FlagIcon className="size-10" />
              </div>
              <DrawerTitle className="text-3xl font-semibold uppercase">
                {t("user.workout.running.live.finishTitle", "Finish training?")}
              </DrawerTitle>
              <DrawerDescription>
                {t(
                  "user.workout.running.live.finishDescription",
                  "Yugurish yakunlanadi va navbatdagi GPS nuqtalar shu request ichida saqlanadi.",
                )}
              </DrawerDescription>
            </DrawerHeader>
            <DrawerFooter className="grid gap-3 p-7 pt-3">
              <Button
                type="button"
                size="lg"
                onClick={handleFinish}
                disabled={isFinishing}
                className="h-14 text-base"
              >
                {t("user.workout.running.live.finishConfirm", "Finish")}
              </Button>
              <Button
                type="button"
                size="lg"
                variant="secondary"
                onClick={() => setFinishOpen(false)}
                disabled={isFinishing}
                className="h-14 text-base"
              >
                {t("user.workout.running.live.finishContinue", "Continue")}
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    </PageTransition>
  );
};

export default RunningLivePage;
