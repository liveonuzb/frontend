import React from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ClockIcon,
  DropletsIcon,
  FlagIcon,
  FlameIcon,
  GaugeIcon,
  HeartPulseIcon,
  PauseIcon,
  PlayIcon,
  RouteIcon,
  ThermometerIcon,
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
import { useWorkoutWeatherToday } from "@/hooks/app/use-workout-weather";
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
  return `${String(toNumber(parts[0]) || 0).padStart(2, "0")}:${parts[1]}:${parts[2]}`;
};

const formatRunningCalories = (metrics = {}) =>
  Math.round(Math.max(0, toNumber(metrics.caloriesBurned ?? 0) || 0));

const formatRunningHeartRate = (value) => {
  const numericValue = toNumber(value);

  return Number.isFinite(numericValue) && numericValue > 0
    ? Math.round(numericValue)
    : "--";
};

const isMissingWeatherValue = (value) =>
  value === undefined || value === null || value === "";

const formatRunningWeatherTemperature = (value) => {
  if (isMissingWeatherValue(value)) {
    return "--°";
  }

  const numericValue = toNumber(value);

  return Number.isFinite(numericValue) ? `${Math.round(numericValue)}°` : "--°";
};

const formatRunningWeatherHumidity = (value) => {
  if (isMissingWeatherValue(value)) {
    return "--%";
  }

  const numericValue = toNumber(value);

  return Number.isFinite(numericValue) ? `${Math.round(numericValue)}%` : "--%";
};

const liveMetricCards = (metrics, elapsedSeconds, t) => [
  {
    label: t("user.workout.running.live.duration", "Duration"),
    value: formatPrimaryRunningDuration(
      Math.max(elapsedSeconds, metrics.durationSeconds ?? 0),
    ),
    icon: ClockIcon,
    iconClassName: "text-violet-500",
  },
  {
    label: t("user.workout.running.live.distance", "Distance"),
    value: formatPrimaryRunningDistance(metrics.distanceMeters),
    suffix: "km",
    icon: RouteIcon,
    iconClassName: "text-emerald-700",
  },
  {
    label: t("user.workout.running.live.energy", "Active Energy"),
    value: formatRunningCalories(metrics),
    suffix: "kcal",
    icon: FlameIcon,
    iconClassName: "text-orange-500",
  },
  {
    label: t("user.workout.running.live.pace", "Pace"),
    value: formatPrimaryRunningPace(metrics.averagePaceSecondsPerKm),
    suffix: "/km",
    icon: GaugeIcon,
    iconClassName: "text-blue-500",
  },
];

const LiveMetricCard = ({ item }) => {
  const Icon = item.icon;

  return (
    <div className="min-w-0 px-3 py-2.5 sm:px-4 sm:py-3">
      <div className="mb-1.5 flex items-center gap-1.5 text-[0.7rem] font-medium text-[#727a78] sm:text-sm">
        <Icon className={cn("size-4", item.iconClassName)} aria-hidden="true" />
        <span>{item.label}</span>
      </div>
      <div className="flex min-w-0 items-end gap-1">
        <span className="text-[1.18rem] font-semibold leading-none tracking-normal text-[#11121f] tabular-nums sm:text-[1.55rem]">
          {item.value}
        </span>
        {item.suffix ? (
          <span className="pb-0.5 text-sm font-medium leading-none text-[#727a78] sm:text-base">
            {item.suffix}
          </span>
        ) : null}
      </div>
    </div>
  );
};

const PausedRunBottomDrawer = ({
  open,
  metrics,
  elapsedSeconds,
  t,
  onResume,
  onFinish,
  disabled,
}) => {
  const summaryItems = [
    ...liveMetricCards(metrics, elapsedSeconds, t),
    {
      label: t(
        "user.workout.running.live.averageHeartRate",
        "Average Heart Rate",
      ),
      value: formatRunningHeartRate(
        metrics.averageHeartRateBpm ??
          metrics.avgHeartRateBpm ??
          metrics.averageHeartRate ??
          metrics.heartRateAverageBpm,
      ),
      suffix: "bpm",
      icon: HeartPulseIcon,
      iconClassName: "text-rose-500",
    },
    {
      label: t("user.workout.running.live.maxHeartRate", "Max Heart Rate"),
      value: formatRunningHeartRate(
        metrics.maxHeartRateBpm ??
          metrics.maxHeartRate ??
          metrics.heartRateMaxBpm,
      ),
      suffix: "bpm",
      icon: HeartPulseIcon,
      iconClassName: "text-red-500",
    },
  ];

  return (
    <Drawer
      direction="bottom"
      open={open}
      dismissible={false}
      shouldScaleBackground={false}
    >
      <DrawerContent>
        <DrawerHeader>
          <div
            className="flex size-14 items-center justify-center rounded-full bg-primary/15 text-primary"
            aria-hidden="true"
          >
            <PauseIcon className="size-7 fill-current" />
          </div>
          <DrawerTitle className="text-2xl font-semibold">
            {t("user.workout.running.live.paused", "Pauzada")}
          </DrawerTitle>
          <DrawerDescription>Outdoor Run</DrawerDescription>
        </DrawerHeader>

        <div className="grid grid-cols-2 gap-3 px-5 pb-2">
          {map(summaryItems, (item) => {
            const Icon = item.icon;

            return (
              <div key={item.label} className="rounded-2xl bg-muted/50 p-3">
                <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Icon
                    className={cn("size-3.5", item.iconClassName)}
                    aria-hidden="true"
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                <div className="flex min-w-0 items-end gap-1">
                  <span className="text-2xl font-semibold leading-none tabular-nums">
                    {item.value}
                  </span>
                  {item.suffix ? (
                    <span className="pb-0.5 text-sm font-medium leading-none text-muted-foreground">
                      {item.suffix}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        <DrawerFooter className="gap-3 p-5 pt-3">
          <Button
            type="button"
            size="lg"
            onClick={onResume}
            disabled={disabled}
          >
            <PlayIcon className="size-5 fill-current" aria-hidden="true" />
            {t("user.workout.running.live.resumeAction", "Davom ettirish")}
          </Button>
          <Button
            type="button"
            size="lg"
            variant="destructive"
            onClick={onFinish}
            disabled={disabled}
          >
            <FlagIcon className="size-5" aria-hidden="true" />
            {t("user.workout.running.live.finish", "Yakunlash")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

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
  const [countdownValue, setCountdownValue] = React.useState(null);
  const [gpsRetryKey, setGpsRetryKey] = React.useState(0);
  const [finishRetryMessage, setFinishRetryMessage] = React.useState("");
  const [backgroundTrackingWarning, setBackgroundTrackingWarning] =
    React.useState("");
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
  const { weather } = useWorkoutWeatherToday({
    enabled: Boolean(workoutSessionId && !isReady),
  });
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
  const temperatureLabel = formatRunningWeatherTemperature(weather.temperatureC);
  const humidityLabel = formatRunningWeatherHumidity(weather.humidity);

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

  React.useEffect(() => {
    if (isReady || isPaused || !workoutSessionId) {
      let isCurrent = true;

      queueMicrotask(() => {
        if (isCurrent) {
          setBackgroundTrackingWarning("");
        }
      });

      return () => {
        isCurrent = false;
      };
    }

    if (typeof document === "undefined") {
      return undefined;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        setBackgroundTrackingWarning(
          t(
            "user.workout.running.live.backgroundTrackingWarning",
            "Brauzer fon rejimida GPS kuzatuvni sekinlashtirishi yoki to'xtatishi mumkin. Aniqroq natija uchun yugurish paytida sahifani ochiq qoldiring.",
          ),
        );
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isPaused, isReady, t, workoutSessionId]);

  const handleFinish = async () => {
    if (!workoutSessionId) {
      return;
    }

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
        className="min-h-[calc(100dvh-7rem)] w-full bg-transparent px-4 pb-28 pt-3 text-[#11121f] sm:px-5 md:min-h-[calc(100dvh-5rem)] md:pb-6 md:pt-0"
      >
        <div className="mx-auto flex w-full max-w-[860px] flex-col">
          <header className="mb-3 flex items-center justify-between gap-3 px-0">
            <div className="min-w-0 flex-1">
              <h1
                className={cn(
                  "truncate font-semibold leading-none tracking-normal text-[#11121f]",
                  isPaused
                    ? "text-[0.95rem] sm:text-[1.15rem]"
                    : isReady
                      ? "text-[1.1rem] sm:text-[1.35rem]"
                      : "text-[1.05rem] sm:text-[1.3rem]",
                )}
              >
                Outdoor Run
              </h1>
              <div
                className={cn(
                  "flex flex-wrap items-center gap-3 font-medium text-[#727a78]",
                  isPaused
                    ? "mt-1.5 text-[0.7rem] sm:text-xs"
                    : "mt-2 text-xs sm:text-sm",
                )}
              >
                <span className="inline-flex items-center gap-1.5">
                  <ThermometerIcon
                    className="size-4 text-[#008566]"
                    aria-hidden="true"
                  />
                  {temperatureLabel}
                </span>
                <span className="h-4 w-px bg-[#dfe8e4]" aria-hidden="true" />
                <span className="inline-flex items-center gap-1.5">
                  <DropletsIcon
                    className="size-4 text-[#008566]"
                    aria-hidden="true"
                  />
                  {humidityLabel}
                </span>
              </div>
            </div>

            {!isReady && !isPaused ? (
              <Button
                type="button"
                variant="default"
                size="sm"
                aria-label="Pause"
                onClick={handlePauseResume}
                disabled={isActionPending}
              >
                <PauseIcon
                  className="size-4 fill-current"
                  aria-hidden="true"
                />
                <span>Pause</span>
              </Button>
            ) : null}
          </header>

          <section
            className={cn(
              "relative rounded-[1.65rem] bg-[#edf5ef] shadow-[0_24px_70px_rgba(24,85,62,0.12)] sm:h-auto sm:min-h-[500px] sm:max-h-none sm:rounded-[2rem]",
              isReady
                ? "h-[47dvh] min-h-[300px] max-h-[410px]"
                : "h-[52dvh] min-h-[330px] max-h-[470px]",
            )}
          >
            <div className="absolute inset-0 overflow-hidden rounded-[2rem]">
              <RunMapPanel
                title={null}
                variant="live"
                points={routePoints}
                emptyLabel={null}
                className="h-full"
                contentClassName="p-0"
                surfaceClassName="h-full min-h-0 rounded-[2rem] border-0 bg-[#f8fbf8] md:h-full"
              />
              <div
                className="pointer-events-none absolute inset-0 bg-white/30"
                aria-hidden="true"
              />
            </div>

            <div className="absolute left-3 top-3 z-10 flex max-w-[calc(100%-1.5rem)] flex-wrap items-center gap-1.5 sm:left-7 sm:top-7 sm:gap-2">
              <Badge
                variant="secondary"
                className="h-8 w-auto max-w-full justify-start gap-1.5 rounded-full border-0 bg-white/95 px-2.5 text-xs font-semibold text-[#11121f] shadow-[0_8px_22px_rgba(17,18,31,0.07)] backdrop-blur sm:h-11 sm:gap-2.5 sm:px-4 sm:text-sm"
                role="status"
                aria-live="polite"
              >
                {gpsState === GPS_STATUS.connected ? (
                  <CheckCircle2Icon
                    className="size-3.5 text-[#008566] sm:size-4"
                    aria-hidden="true"
                  />
                ) : (
                  <AlertTriangleIcon
                    className="size-3.5 text-[#008566] sm:size-4"
                    aria-hidden="true"
                  />
                )}
                <span className="min-w-0 truncate">{gpsStatus}</span>
              </Badge>
              {queuedCount > 0 ? (
                <Badge
                  variant="outline"
                  className="h-8 rounded-full border-0 bg-white/90 px-2.5 text-xs shadow-[0_14px_36px_rgba(17,18,31,0.08)] backdrop-blur sm:h-10 sm:px-3 sm:text-sm"
                >
                  {t("user.workout.running.live.queue", "Navbat")} {queuedCount}
                </Badge>
              ) : null}
              {canRetryGps ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-8 rounded-full bg-white/90 px-2.5 text-xs shadow-[0_14px_36px_rgba(17,18,31,0.08)] backdrop-blur sm:h-10 sm:px-4 sm:text-sm"
                  onClick={handleRetryGps}
                >
                  {t("user.workout.running.live.retryGps", "GPS qayta urinish")}
                </Button>
              ) : null}
            </div>

            {isReady ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t("user.workout.running.live.start", "START")}
                className="absolute bottom-[-2.5rem] left-1/2 z-20 size-20 -translate-x-1/2 rounded-full border-[5px] border-white bg-[#008566] text-white shadow-[0_22px_46px_rgba(0,133,102,0.3)] active:scale-[0.98] hover:bg-[#008566]"
                onClick={handleStartRun}
                disabled={isActionPending || Boolean(countdownValue)}
              >
                <PlayIcon className="size-8 fill-current" aria-hidden="true" />
              </Button>
            ) : null}

            {countdownValue ? (
              <div
                className="absolute inset-0 z-30 flex items-center justify-center rounded-[2rem] bg-black/70"
                aria-live="polite"
              >
                <span className="text-9xl font-semibold leading-none text-white drop-shadow-2xl">
                  {countdownValue}
                </span>
              </div>
            ) : null}
          </section>

          <section
            className={cn(
              "grid grid-cols-2 overflow-hidden rounded-[1.5rem] border border-white/80 bg-white/88 shadow-[0_18px_44px_rgba(24,85,62,0.09)] backdrop-blur",
              isReady ? "mt-8" : "mt-2",
            )}
            aria-label="Running metrics"
          >
            {map(liveMetricCards(metrics, elapsedSeconds, t), (item, index) => (
              <div
                key={item.label}
                className={cn(
                  index % 2 === 0 && "border-r border-[#e8efeb]",
                  index < 2 && "border-b border-[#e8efeb]",
                )}
              >
                <LiveMetricCard item={item} />
              </div>
            ))}
          </section>

        </div>

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

        {backgroundTrackingWarning ? (
          <div
            role="alert"
            className="m-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800"
          >
            {backgroundTrackingWarning}
          </div>
        ) : null}

        <PausedRunBottomDrawer
          open={isPaused}
          metrics={metrics}
          elapsedSeconds={elapsedSeconds}
          t={t}
          onResume={handlePauseResume}
          onFinish={handleFinish}
          disabled={isActionPending}
        />
      </div>
    </PageTransition>
  );
};

export default RunningLivePage;
