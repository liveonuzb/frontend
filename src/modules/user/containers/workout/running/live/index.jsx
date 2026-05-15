import React from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  FlagIcon,
  PauseIcon,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useAppendRunningPoints,
  useCancelRunningSession,
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
  RUNNING_POINT_SYNC_INTERVAL_MS,
} from "@/lib/running-point-sync";
import {
  calculateLiveRunningDuration,
  calculateLiveRunningMetrics,
  formatRunningDistance,
  formatRunningDuration,
  formatRunningPace,
} from "@/lib/running-metrics";
import RunMapPanel from "../components/run-map-panel.jsx";

const getMaxPointSequence = (points = []) =>
  points.reduce(
    (maxSequence, point) =>
      Math.max(maxSequence, Number(point?.sequence ?? 0) || 0),
    0,
  );

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
  formatRunningPace(secondsPerKm).replace(/\s*\/km$/, "");

const primaryMetricCards = (metrics, elapsedSeconds, t) => [
  {
    label: t("user.workout.running.live.time", "Vaqt"),
    value: formatRunningDuration(
      Math.max(elapsedSeconds, metrics.durationSeconds ?? 0),
    ),
  },
  {
    label: t("user.workout.running.live.distance", "Masofa"),
    value: formatRunningDistance(metrics.distanceMeters),
  },
  {
    label: t("user.workout.running.live.pace", "Pace"),
    value: formatPrimaryRunningPace(metrics.averagePaceSecondsPerKm),
  },
];

const secondaryMetricCards = (metrics, queuedCount, t) => [
  {
    label: t("user.workout.running.live.queue", "Navbat"),
    value: String(queuedCount),
  },
  {
    label: t("user.workout.running.live.calories", "Kaloriya"),
    value: String(Number(metrics.caloriesBurned ?? 0) || 0),
  },
];

const RunningLivePage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { workoutSessionId: routeWorkoutSessionId } = useParams();
  const { activeSession } = useRunningActiveSession();
  const { appendPoints } = useAppendRunningPoints();
  const { pauseRunningSession, isPending: isPausing } =
    usePauseRunningSession();
  const { resumeRunningSession, isPending: isResuming } =
    useResumeRunningSession();
  const { finishRunningSession, isPending: isFinishing } =
    useFinishRunningSession();
  const { cancelRunningSession, isPending: isCancelling } =
    useCancelRunningSession();
  const [gpsState, setGpsState] = React.useState(GPS_STATUS.waiting);
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);
  const [queuedCount, setQueuedCount] = React.useState(0);
  const [livePoints, setLivePoints] = React.useState([]);
  const [localStatus, setLocalStatus] = React.useState(null);
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [finishOpen, setFinishOpen] = React.useState(false);
  const [countdownValue, setCountdownValue] = React.useState(null);
  const [gpsRetryKey, setGpsRetryKey] = React.useState(0);
  const [finishRetryMessage, setFinishRetryMessage] = React.useState("");
  const sequenceRef = React.useRef(0);
  const syncInFlightRef = React.useRef(false);
  const syncTimerRef = React.useRef(null);
  const syncFailureCountRef = React.useRef(0);
  const nextSyncAtRef = React.useRef(0);
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
  const currentStatus =
    optimisticStatus ?? effectiveActiveSession?.status ?? "active";
  const isPaused = currentStatus === "paused";
  const isActionPending =
    isPausing || isResuming || isFinishing || isCancelling;
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
    (status) => {
      if (!effectiveActiveSession?.workoutSessionId) {
        return;
      }

      saveActiveRunningSession({
        ...effectiveActiveSession,
        status,
      });
    },
    [effectiveActiveSession],
  );

  const applyAcceptedSequence = React.useCallback((result) => {
    sequenceRef.current = Math.max(
      sequenceRef.current,
      Number(result?.lastAcceptedSequence ?? 0) || 0,
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

  const syncRunningPoints = React.useCallback(
    async ({ force = false } = {}) => {
      if (!workoutSessionId || syncInFlightRef.current) {
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
        const acceptedSequence = Number(result?.lastAcceptedSequence ?? 0) || 0;
        const remaining = loadRunningPointQueue(workoutSessionId).filter(
          (point) => Number(point.sequence) > acceptedSequence,
        );
        saveRunningPointQueue(workoutSessionId, remaining);
        setQueuedCount(remaining.length);
        setGpsState(
          remaining.length > 0 ? GPS_STATUS.queued : GPS_STATUS.connected,
        );
        syncFailureCountRef.current = 0;
        nextSyncAtRef.current = Date.now() + RUNNING_POINT_SYNC_INTERVAL_MS;
        return { ok: true, accepted: Number(result?.acceptedCount ?? 0) || 0 };
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
      Number(effectiveActiveSession?.lastAcceptedSequence ?? 0) || 0,
      getMaxPointSequence(queuedPoints),
    );
    setQueuedCount(queuedPoints.length);
  }, [effectiveActiveSession?.lastAcceptedSequence, workoutSessionId]);

  React.useEffect(() => {
    if (!workoutSessionId) {
      setCountdownValue(null);
      return undefined;
    }

    setCountdownValue(COUNTDOWN_START);
    const timer = window.setInterval(() => {
      setCountdownValue((currentValue) => {
        if (currentValue === null) {
          window.clearInterval(timer);
          return null;
        }

        if (currentValue <= 1) {
          window.clearInterval(timer);
          return null;
        }

        return currentValue - 1;
      });
    }, COUNTDOWN_TICK_MS);

    return () => window.clearInterval(timer);
  }, [workoutSessionId]);

  React.useEffect(() => {
    if (!effectiveActiveSession?.startedAt) {
      return undefined;
    }

    setElapsedSeconds(
      calculateLiveRunningDuration(effectiveActiveSession.startedAt),
    );
    const timer = window.setInterval(() => {
      setElapsedSeconds(
        calculateLiveRunningDuration(effectiveActiveSession.startedAt),
      );
    }, 1000);

    return () => window.clearInterval(timer);
  }, [effectiveActiveSession?.startedAt]);

  React.useEffect(() => {
    if (!workoutSessionId || isPaused) {
      return undefined;
    }

    const geolocation = navigator.geolocation;

    if (typeof geolocation?.watchPosition !== "function") {
      setGpsState(GPS_STATUS.unavailable);
      return undefined;
    }

    const watchId = geolocation.watchPosition(
      (position) => {
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

        setLivePoints((currentPoints) => [...currentPoints, point].slice(-500));
        persistIncomingPoints([point]);
        void syncRunningPoints();
      },
      () => {
        setGpsState(GPS_STATUS.permission);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      },
    );

    return () => {
      if (typeof geolocation.clearWatch === "function") {
        geolocation.clearWatch(watchId);
      }
    };
  }, [
    gpsRetryKey,
    isPaused,
    persistIncomingPoints,
    syncRunningPoints,
    workoutSessionId,
  ]);

  React.useEffect(() => {
    if (!workoutSessionId) {
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
  }, [syncRunningPoints, workoutSessionId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleRetryGps = () => {
    setGpsState(GPS_STATUS.waiting);
    setGpsRetryKey((currentKey) => currentKey + 1);
  };

  const handlePauseResume = async () => {
    if (!workoutSessionId) {
      return;
    }

    if (isPaused) {
      setLocalStatus({ workoutSessionId, status: "active" });
      saveLocalStatus("active");
      try {
        await resumeRunningSession(workoutSessionId);
      } catch {
        setLocalStatus({ workoutSessionId, status: "paused" });
        saveLocalStatus("paused");
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
    setLocalStatus({ workoutSessionId, status: "paused" });
    saveLocalStatus("paused");
    try {
      await pauseRunningSession(workoutSessionId);
    } catch {
      setLocalStatus({ workoutSessionId, status: "active" });
      saveLocalStatus("active");
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
    const syncResult = await syncRunningPoints({ force: true });
    const remainingQueue = loadRunningPointQueue(workoutSessionId);
    const hasUnsyncedPoints = !syncResult.ok || remainingQueue.length > 0;

    if (hasUnsyncedPoints) {
      const message = t(
        "user.workout.running.live.finishQueuedSync",
        "Sync navbatda. GPS nuqtalar sync bo'lgandan keyin yakunlang.",
      );
      setFinishOpen(true);
      setFinishRetryMessage(message);
      toast.error(message);
      return;
    }

    const endedAt = new Date().toISOString();
    const finishPayload = {
      endedAt,
      finalPointSequence: sequenceRef.current || undefined,
      clientSummary: {
        durationSeconds: Math.max(
          elapsedSeconds,
          metrics.durationSeconds ?? 0,
        ),
        distanceMeters: Math.round(Number(metrics.distanceMeters ?? 0) || 0),
        caloriesBurned: Number(metrics.caloriesBurned ?? 0) || 0,
      },
    };

    const completeFinish = (session, usedLightweightFallback = false) => {
      clearActiveRunningSession();
      clearRunningPointQueue(workoutSessionId);
      toast.success(
        usedLightweightFallback
          ? t(
              "user.workout.running.live.finishSuccessWithLightweightPayload",
              "Yugurish yakunlandi. Yakuniy hisob server tomonidan qayta hisoblanadi.",
            )
          : t(
              "user.workout.running.live.finishSuccess",
              "Yugurish yakunlandi.",
            ),
      );
      navigate(
        `/user/workout/running/${session?.workoutSessionId ?? workoutSessionId}`,
      );
    };

    try {
      const session = await finishRunningSession(workoutSessionId, finishPayload);
      completeFinish(session);
    } catch {
      try {
        const session = await finishRunningSession(workoutSessionId, {
          endedAt,
        });
        completeFinish(session, true);
        return;
      } catch {
        // Fall through to the visible finish error below.
      }

      const message = t(
        "user.workout.running.live.finishError",
        "Yugurishni yakunlab bo'lmadi. Qayta urinib ko'ring.",
      );
      setFinishRetryMessage(message);
      toast.error(message);
    }
  };

  const handleCancel = async () => {
    if (!workoutSessionId) {
      return;
    }

    await cancelRunningSession(workoutSessionId, { reason: "user_cancelled" });
    clearActiveRunningSession();
    clearRunningPointQueue(workoutSessionId);
    setCancelOpen(false);
    navigate("/user/workout/running");
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
      <div className="mx-auto max-w-[980px] space-y-4 pb-24">
        <section className="relative overflow-hidden rounded-[1.75rem] border bg-background shadow-[0_24px_70px_rgba(0,0,0,0.16)]">
          <div className="border-b bg-background px-3 py-4 sm:px-5">
            <div className="grid grid-cols-3 gap-2 text-center">
              {primaryMetricCards(metrics, elapsedSeconds, t).map((item) => (
                <div key={item.label} className="min-w-0 px-1">
                  <p className="truncate text-3xl font-semibold leading-none tabular-nums text-foreground sm:text-5xl">
                    {item.value}
                  </p>
                  <p className="mt-2 truncate text-xs font-medium uppercase tracking-normal text-muted-foreground sm:text-sm">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-center text-muted-foreground">
              <ChevronDownIcon className="size-5" aria-hidden="true" />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <Badge
                variant="secondary"
                className="gap-1"
                role="status"
                aria-live="polite"
              >
                {gpsState === GPS_STATUS.connected ? (
                  <CheckCircle2Icon className="size-3.5" aria-hidden="true" />
                ) : (
                  <AlertTriangleIcon className="size-3.5" aria-hidden="true" />
                )}
                {gpsStatus}
              </Badge>
              {canRetryGps ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleRetryGps}
                >
                  {t("user.workout.running.live.retryGps", "GPS qayta urinish")}
                </Button>
              ) : null}
              {secondaryMetricCards(metrics, queuedCount, t).map((item) => (
                <Badge key={item.label} variant="outline" className="gap-1">
                  <span>{item.label}</span>
                  <span className="font-semibold tabular-nums">
                    {item.value}
                  </span>
                </Badge>
              ))}
            </div>
          </div>

          <div className="relative">
            <RunMapPanel
              title={null}
              points={livePoints}
              emptyLabel={gpsStatus}
              className="border-0 bg-transparent shadow-none"
              contentClassName="p-0"
              surfaceClassName="h-[58vh] min-h-[360px] rounded-none md:h-[620px]"
            />

            {countdownValue ? (
              <div
                className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-[1px]"
                aria-live="polite"
              >
                <span className="text-8xl font-semibold leading-none text-primary drop-shadow-2xl sm:text-9xl">
                  {countdownValue}
                </span>
              </div>
            ) : null}

          </div>

          {isPaused ? (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-end bg-black/65 px-6 pb-10 pt-28 text-white">
              <div className="grid w-full max-w-[360px] grid-cols-2 gap-7">
                <button
                  type="button"
                  aria-label={t("user.workout.running.live.finish", "Yakunlash")}
                  className="flex flex-col items-center gap-4 text-sm font-semibold uppercase tracking-normal text-white disabled:opacity-50"
                  onClick={() => setFinishOpen(true)}
                  disabled={isActionPending}
                >
                  <span>
                    {t("user.workout.running.live.endAction", "END")}
                  </span>
                  <span
                    className="flex size-28 items-center justify-center rounded-full bg-destructive text-white shadow-[0_18px_45px_rgba(0,0,0,0.25)]"
                    aria-hidden="true"
                  >
                    <SquareIcon className="size-10 fill-current" />
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={t(
                    "user.workout.running.live.resume",
                    "Davom ettirish",
                  )}
                  className="flex flex-col items-center gap-4 text-sm font-semibold uppercase tracking-normal text-white disabled:opacity-50"
                  onClick={handlePauseResume}
                  disabled={isActionPending}
                >
                  <span>
                    {t("user.workout.running.live.resumeAction", "RESUME")}
                  </span>
                  <span
                    className="flex size-28 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_18px_45px_rgba(0,0,0,0.25)]"
                    aria-hidden="true"
                  >
                    <PlayIcon className="size-11 fill-current" />
                  </span>
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-background p-4">
          <div>
            <h1 className="text-lg font-semibold">
              {t("user.workout.running.live.title", "Live yugurish")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isPaused
                ? t("user.workout.running.live.paused", "Pauzada")
                : t("user.workout.running.live.tracking", "GPS tracking")}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCancelOpen(true)}
            disabled={isActionPending}
          >
            <XIcon className="size-4" aria-hidden="true" />
            {t("user.workout.running.live.cancel", "Bekor qilish")}
          </Button>
        </div>

        {!isPaused ? (
          <div className="sticky bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-30 grid gap-3 rounded-[1.5rem] border bg-background/95 p-3 shadow-lg backdrop-blur sm:grid-cols-2">
            <Button
              size="lg"
              variant="outline"
              onClick={handlePauseResume}
              disabled={isActionPending}
              className="h-14"
            >
              <PauseIcon className="size-4" aria-hidden="true" />
              {t("user.workout.running.live.pause", "Pauza")}
            </Button>
            <Button
              size="lg"
              onClick={() => setFinishOpen(true)}
              disabled={isActionPending}
              className="h-14"
            >
              <SquareIcon className="size-4" aria-hidden="true" />
              {t("user.workout.running.live.finish", "Yakunlash")}
            </Button>
          </div>
        ) : null}

        {finishRetryMessage ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800">
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
                aria-label={t(
                  "user.workout.running.live.finishClose",
                  "Close",
                )}
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
                {t(
                  "user.workout.running.live.finishTitle",
                  "Finish training?",
                )}
              </DrawerTitle>
              <DrawerDescription>
                {t(
                  "user.workout.running.live.finishDescription",
                  "Yugurishni yakunlashdan oldin GPS nuqtalar bir marta sync qilinadi. Navbat bo'shamasa ham sessiya saqlanadi.",
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

        <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {t(
                  "user.workout.running.live.cancelTitle",
                  "Yugurishni bekor qilish",
                )}
              </DialogTitle>
              <DialogDescription>
                {t(
                  "user.workout.running.live.cancelDescription",
                  "Bu sessiya bekor qilinsa, navbatdagi GPS nuqtalar ham tozalanadi. Yakunlangan yugurish sifatida saqlanmaydi.",
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCancelOpen(false)}
              >
                {t("user.workout.running.live.back", "Ortga")}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleCancel}
                disabled={isCancelling}
              >
                {t(
                  "user.workout.running.live.confirmCancel",
                  "Ha, bekor qilish",
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
};

export default RunningLivePage;
