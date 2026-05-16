import React from "react";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import {
  ActivityIcon,
  ChevronRightIcon,
  ClockIcon,
  FlameIcon,
  FootprintsIcon,
  HistoryIcon,
  PlayIcon,
  RouteIcon,
  TrendingUpIcon,
} from "lucide-react";
import { toast } from "sonner";
import PageTransition from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import {
  useRunningActiveSession,
  useRunningSessionDetail,
  useRunningSessions,
  useRunningStatsSummary,
  useStartRunningSession,
} from "@/hooks/app/use-running-sessions";
import {
  loadActiveRunningSession,
  loadRunningPointQueue,
} from "@/lib/running-offline-queue";
import {
  formatRunningDistance,
  formatRunningDuration,
  formatRunningPace,
} from "@/lib/running-metrics";
import { cn } from "@/lib/utils";
import { useBreadcrumbStore } from "@/store";
import RunMapPanel from "./components/run-map-panel.jsx";

const weekDays = ["M", "T", "W", "T", "F", "S", "S"];

const safeNumber = (value) => Number(value) || 0;

const formatDistanceSubLabel = (meters = 0) => {
  const kilometers = safeNumber(meters) / 1000;
  return `${kilometers.toLocaleString("en-US", {
    maximumFractionDigits: kilometers >= 10 ? 0 : 1,
  })} km`;
};

const formatDurationSubLabel = (seconds = 0) => {
  const totalSeconds = Math.max(0, safeNumber(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours} h ${minutes} m`;
};

const getWeekStart = (date) => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + diff);
  return start;
};

const getWeeklyRuns = (sessions = []) => {
  const start = getWeekStart(new Date());

  return weekDays.map((label, index) => {
    const dayStart = new Date(start);
    dayStart.setDate(start.getDate() + index);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);
    const runs = sessions.filter((session) => {
      const startedAt = new Date(session.startedAt);
      return startedAt >= dayStart && startedAt < dayEnd;
    });
    const distanceMeters = runs.reduce(
      (total, session) =>
        total + safeNumber(session.metrics?.distanceMeters ?? 0),
      0,
    );

    return {
      label,
      runs: runs.length,
      distanceMeters,
    };
  });
};

const metricCards = (stats, t) => [
  {
    label: t("user.workout.running.home.totalDistance", "Total distance"),
    value: formatRunningDistance(stats.totalDistanceMeters),
    subValue: formatDistanceSubLabel(stats.totalDistanceMeters),
    icon: RouteIcon,
    trendLabel: t("user.workout.running.home.vsLast7Days", "vs last 7 days"),
  },
  {
    label: t("user.workout.running.home.totalTime", "Total time"),
    value: formatRunningDuration(stats.totalDurationSeconds),
    subValue: formatDurationSubLabel(stats.totalDurationSeconds),
    icon: ClockIcon,
    trendLabel: t("user.workout.running.home.vsLast7Days", "vs last 7 days"),
  },
  {
    label: t("user.workout.running.home.runs", "Runs"),
    value: String(safeNumber(stats.totalRuns)),
    subValue: "",
    icon: ActivityIcon,
    trendLabel: t("user.workout.running.home.vsLast7Days", "vs last 7 days"),
  },
  {
    label: t("user.workout.running.home.calories", "Calories"),
    value: `${safeNumber(stats.totalCaloriesBurned)} kcal`,
    subValue: "",
    icon: FlameIcon,
    trendLabel: t("user.workout.running.home.vsLast7Days", "vs last 7 days"),
  },
];

const RunningPanel = ({ className, children }) => (
  <section
    className={cn(
      "rounded-[1.7rem] border border-white/10 bg-[rgba(27,21,16,0.82)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl",
      className,
    )}
  >
    {children}
  </section>
);

const MetricCard = ({ item }) => {
  const Icon = item.icon;

  return (
    <RunningPanel className="p-3 sm:p-6">
      <div className="flex items-start gap-2 sm:gap-5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[rgba(245,158,11,0.18)] text-[#f59e0b] shadow-[0_0_32px_rgba(245,158,11,0.18)] sm:size-14">
          <Icon className="size-5 sm:size-7" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-sm leading-snug text-white/[0.62] sm:text-base">
            {item.label}
          </p>
          <p className="mt-3 break-words text-2xl font-semibold leading-none text-white sm:text-3xl md:text-4xl">
            {item.value}
          </p>
          {item.subValue ? (
            <p className="mt-3 text-base text-white/[0.58] sm:text-lg">
              {item.subValue}
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-5 flex items-center gap-1 text-xs text-white/[0.58] sm:mt-6 sm:gap-2 sm:text-base">
        <TrendingUpIcon
          className="size-3.5 shrink-0 text-[#f59e0b] sm:size-5"
          aria-hidden="true"
        />
        <span className="font-semibold text-[#f59e0b]">0%</span>
        <span className="whitespace-nowrap">{item.trendLabel}</span>
      </div>
    </RunningPanel>
  );
};

const WeeklyPanel = ({ weeklyRuns, t }) => {
  const totalRuns = weeklyRuns.reduce((total, day) => total + day.runs, 0);

  return (
    <RunningPanel className="p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold text-white">
          {t("user.workout.running.home.thisWeek", "This week")}
        </h2>
        <p className="text-xl text-white/[0.55]">
          {t("user.workout.running.home.weekRuns", "{{count}} runs", {
            count: totalRuns,
          })}
        </p>
      </div>
      <div className="mt-8 grid grid-cols-7 gap-2 text-center">
        {weeklyRuns.map((day, index) => (
          <div key={`${day.label}-${index}`} className="space-y-3">
            <p className="text-base font-medium text-white/[0.58]">
              {day.label}
            </p>
            <div
              className={cn(
                "mx-auto size-11 rounded-full border-4",
                day.runs
                  ? "border-[#f59e0b] bg-[#f59e0b]/20 shadow-[0_0_28px_rgba(245,158,11,0.18)]"
                  : "border-white/[0.08] bg-black/10",
              )}
              aria-label={t(
                "user.workout.running.home.dayRunsLabel",
                "{{day}}: {{count}} runs",
                {
                  day: day.label,
                  count: day.runs,
                },
              )}
            />
            <p className="min-h-5 text-sm text-white/[0.55]">
              {day.runs ? formatRunningDistance(day.distanceMeters) : "-"}
            </p>
          </div>
        ))}
      </div>
    </RunningPanel>
  );
};

const RecentRunsPanel = ({ sessions, t }) => (
  <RunningPanel className="p-6">
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-2xl font-semibold text-white">
        {t("user.workout.running.home.recentRuns", "Recent runs")}
      </h2>
      <Link
        to="/user/workout/running/history"
        className="inline-flex items-center gap-2 rounded-full px-2 py-1 text-base font-semibold text-[#f59e0b] outline-none transition hover:text-[#fbbf24] focus-visible:ring-2 focus-visible:ring-[#f59e0b]"
      >
        {t("user.workout.running.home.viewAll", "View all")}
        <ChevronRightIcon className="size-5" aria-hidden="true" />
      </Link>
    </div>

    {sessions.length === 0 ? (
      <div className="mt-7 flex items-center gap-6">
        <div className="flex size-24 shrink-0 items-center justify-center rounded-full border border-dashed border-white/20 text-white/60">
          <FootprintsIcon className="size-10" aria-hidden="true" />
        </div>
        <div>
          <p className="text-2xl font-semibold text-white">
            {t("user.workout.running.home.noRuns", "No runs yet")}
          </p>
          <p className="mt-2 text-lg leading-relaxed text-white/[0.58]">
            {t(
              "user.workout.running.home.noRunsDescription",
              "Start your first run and see your stats here.",
            )}
          </p>
        </div>
      </div>
    ) : (
      <div className="mt-6 space-y-3">
        {sessions.slice(0, 3).map((session) => (
          <Link
            key={session.workoutSessionId}
            to={`/user/workout/running/${session.workoutSessionId}`}
            className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 outline-none transition hover:bg-white/[0.07] focus-visible:ring-2 focus-visible:ring-[#f59e0b]"
          >
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-white">
                {t("user.workout.running.shared.outdoorRun", "Outdoor run")}
              </p>
              <p className="mt-1 text-sm text-white/[0.52]">
                {new Intl.DateTimeFormat("en", {
                  month: "short",
                  day: "numeric",
                }).format(new Date(session.startedAt))}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-semibold text-white">
                {formatRunningDistance(session.metrics.distanceMeters)}
              </p>
              <p className="mt-1 text-sm text-white/[0.52]">
                {formatRunningDuration(session.metrics.durationSeconds)} ·{" "}
                {formatRunningPace(session.metrics.averagePaceSecondsPerKm)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    )}
  </RunningPanel>
);

const RunningPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const { activeSession } = useRunningActiveSession();
  const { stats = {} } = useRunningStatsSummary();
  const { sessions = [] } = useRunningSessions({}, { enabled: true });
  const { startRunningSession, isPending } = useStartRunningSession();
  const startRequestInFlightRef = React.useRef(false);
  const localActiveSession = React.useMemo(
    () => loadActiveRunningSession(),
    [],
  );
  const recoverySession = activeSession ?? localActiveSession;
  const recoveryWorkoutSessionId = recoverySession?.workoutSessionId ?? null;
  const latestSession = sessions[0] ?? null;
  const latestSessionId = latestSession?.workoutSessionId ?? null;
  const { session: latestSessionDetail, isLoading: isLatestRouteLoading } =
    useRunningSessionDetail(latestSessionId, {
      enabled: Boolean(latestSessionId && !recoverySession),
    });
  const [startErrorMessage, setStartErrorMessage] = React.useState("");
  const queuedActivePoints = React.useMemo(() => {
    if (!recoveryWorkoutSessionId) {
      return [];
    }

    return loadRunningPointQueue(recoveryWorkoutSessionId);
  }, [recoveryWorkoutSessionId]);
  const activePreviewSession = recoverySession
    ? {
        ...recoverySession,
        points: [
          ...(Array.isArray(recoverySession.points)
            ? recoverySession.points
            : []),
          ...queuedActivePoints,
        ],
      }
    : null;
  const previewSession =
    activePreviewSession ?? latestSessionDetail ?? latestSession ?? null;
  const recentSessions = sessions.slice(0, 3);
  const weeklyRuns = getWeeklyRuns(sessions);
  const previewPoints = Array.isArray(previewSession?.points)
    ? previewSession.points
    : [];
  const previewPolyline = previewSession?.route?.polyline ?? null;
  const hasPreviewRoute = previewPoints.length > 0 || Boolean(previewPolyline);
  const previewQualityScore = previewSession?.metrics?.gpsQualityScore ?? null;
  const previewEmptyLabel = recoverySession
    ? t("user.workout.running.home.gpsWaiting", "GPS points are waiting")
    : isLatestRouteLoading
      ? t("user.workout.running.home.routeLoading", "Route is loading")
      : t("user.workout.running.home.noRoute", "No route yet");
  const previewMapLabel = hasPreviewRoute ? null : previewEmptyLabel;
  const routeMapLabels = React.useMemo(
    () => ({
      routePreviewLabel: t(
        "user.workout.running.map.routePreviewLabel",
        "Route preview",
      ),
      qualityLabel: t("user.workout.running.map.qualityLabel", "Route quality"),
      unavailableTitle: t(
        "user.workout.running.map.unavailableTitle",
        "No route yet",
      ),
      unavailableDescription: t(
        "user.workout.running.map.unavailableDescription",
        "GPS points are waiting",
      ),
      greatTitle: t("user.workout.running.map.greatTitle", "Great route!"),
      greatDescription: t(
        "user.workout.running.map.greatDescription",
        "Smooth & safe",
      ),
      fairTitle: t("user.workout.running.map.fairTitle", "Needs review"),
      fairDescription: t(
        "user.workout.running.map.fairDescription",
        "Some GPS drift",
      ),
      weakTitle: t("user.workout.running.map.weakTitle", "Weak GPS"),
      weakDescription: t(
        "user.workout.running.map.weakDescription",
        "Route was noisy",
      ),
    }),
    [t],
  );

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user", title: t("user.dashboard.title", "Home") },
      { url: "/user/workout", title: t("user.workout.title", "Workout") },
      {
        url: "/user/workout/running",
        title: t("user.workout.running.home.title", "Running"),
      },
    ]);
  }, [setBreadcrumbs, t]);

  const handleStart = async () => {
    if (startRequestInFlightRef.current) {
      return;
    }

    if (recoverySession?.workoutSessionId) {
      navigate(
        `/user/workout/running/live/${recoverySession.workoutSessionId}`,
      );
      return;
    }

    setStartErrorMessage("");
    startRequestInFlightRef.current = true;
    try {
      const session = await startRunningSession({
        clientSessionId: `web-${Date.now()}`,
        startedAt: new Date().toISOString(),
      });
      const workoutSessionId = session?.workoutSessionId;
      navigate(
        workoutSessionId
          ? `/user/workout/running/live/${workoutSessionId}`
          : "/user/workout/running/live",
      );
    } catch {
      const message = t(
        "user.workout.running.home.startError",
        "Run could not be started. Try again.",
      );
      setStartErrorMessage(message);
      toast.error(message);
    } finally {
      startRequestInFlightRef.current = false;
    }
  };

  const handleExpandRoute = () => {
    if (recoverySession?.workoutSessionId) {
      navigate(
        `/user/workout/running/live/${recoverySession.workoutSessionId}`,
      );
      return;
    }

    if (latestSessionId) {
      navigate(`/user/workout/running/${latestSessionId}`);
      return;
    }

    void handleStart();
  };

  return (
    <PageTransition mode="slide-up">
      <div className="relative mx-auto max-w-[920px] overflow-hidden rounded-[2rem] bg-[#100c09] px-3 pb-7 pt-0 text-white shadow-[0_30px_90px_rgba(0,0,0,0.35)] sm:px-6 md:rounded-none md:bg-transparent md:px-0 md:pb-0 md:pt-0 md:shadow-none">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.18),transparent_46%)]" />

        <RunningPanel className="relative overflow-hidden p-4 sm:p-6 md:p-8">
          <RunMapPanel
            title={null}
            variant="preview"
            points={previewPoints}
            polyline={previewPolyline}
            qualityScore={previewQualityScore}
            emptyLabel={previewMapLabel}
            showExpand
            expandLabel={t(
              "user.workout.running.home.expandRoute",
              "Expand route preview",
            )}
            onExpand={handleExpandRoute}
            labels={routeMapLabels}
            className="absolute -right-2 top-5 h-[300px] w-[45%] opacity-95 sm:hidden"
            surfaceClassName="h-full min-h-0"
          />
          <div className="grid gap-7 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="relative z-10 flex min-h-[430px] flex-col justify-between gap-5 sm:min-h-0 sm:gap-8">
              <div className="max-w-[62%] sm:max-w-none">
                <div className="inline-flex items-center gap-2 rounded-2xl bg-[rgba(245,158,11,0.14)] px-3 py-2 text-base font-semibold text-[#f59e0b] shadow-[0_0_34px_rgba(245,158,11,0.14)] sm:px-4 sm:py-3 sm:text-lg">
                  <RouteIcon className="size-5 sm:size-6" aria-hidden="true" />
                  {t("user.workout.running.home.badge", "Running")}
                </div>
                <h1 className="mt-8 text-[3.25rem] font-semibold leading-none tracking-normal text-white min-[420px]:text-6xl sm:mt-9 sm:text-7xl md:text-6xl">
                  {t("user.workout.running.home.title", "Running")}
                </h1>
                <p className="mt-7 max-w-[430px] text-base leading-relaxed text-white/[0.62] min-[420px]:text-lg sm:mt-8 sm:text-2xl md:text-xl">
                  {t(
                    "user.workout.running.home.description",
                    "Track outdoor runs, recover active sessions, and review pace, distance, calories, and route quality inside Workout.",
                  )}
                </p>
              </div>

              {recoverySession ? (
                <div className="rounded-[1.25rem] border border-[#f59e0b]/30 bg-[#f59e0b]/10 p-4 text-sm text-white/80">
                  <p className="font-semibold text-white">
                    {t(
                      "user.workout.running.home.activeReady",
                      "Active run is ready",
                    )}
                  </p>
                  <p className="mt-1">
                    {t(
                      "user.workout.running.home.activeReadyDescription",
                      "Continue without losing locally saved GPS points.",
                    )}
                  </p>
                </div>
              ) : null}

              {startErrorMessage ? (
                <div
                  role="alert"
                  aria-label="Running start error"
                  className="rounded-[1.25rem] border border-red-400/30 bg-red-500/12 p-4 text-sm font-medium text-red-50"
                >
                  {startErrorMessage}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2 sm:gap-4">
                <Button
                  onClick={handleStart}
                  disabled={isPending}
                  className="h-14 rounded-[1.25rem] px-4 text-lg font-semibold shadow-[0_22px_50px_rgba(249,115,22,0.36)] sm:h-20 sm:px-7 sm:text-2xl"
                >
                  <PlayIcon
                    className="size-6 fill-current sm:size-8"
                    aria-hidden="true"
                  />
                  {isPending
                    ? t("user.workout.running.home.starting", "Starting...")
                    : recoverySession
                      ? t("user.workout.running.home.resumeRun", "Resume run")
                      : t("user.workout.running.home.startRun", "Start run")}
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-14 rounded-[1.25rem] border-white/10 bg-white/[0.04] px-4 text-lg font-semibold text-white hover:bg-white/[0.08] sm:h-20 sm:px-7 sm:text-2xl"
                >
                  <Link to="/user/workout/running/history">
                    <HistoryIcon
                      className="size-6 sm:size-8"
                      aria-hidden="true"
                    />
                    {t("user.workout.running.home.history", "History")}
                  </Link>
                </Button>
              </div>
            </div>
            <RunMapPanel
              title={null}
              variant="preview"
              points={previewPoints}
              polyline={previewPolyline}
              qualityScore={previewQualityScore}
              emptyLabel={previewMapLabel}
              showExpand
              expandLabel={t(
                "user.workout.running.home.expandRoute",
                "Expand route preview",
              )}
              onExpand={handleExpandRoute}
              labels={routeMapLabels}
              className="hidden sm:block"
            />
          </div>
        </RunningPanel>

        <section className="mt-7 grid grid-cols-2 gap-3 sm:gap-5">
          {metricCards(stats, t).map((item) => (
            <MetricCard key={item.label} item={item} />
          ))}
        </section>

        <div className="mt-7 space-y-7">
          <WeeklyPanel weeklyRuns={weeklyRuns} t={t} />
          <RecentRunsPanel sessions={recentSessions} t={t} />
        </div>
      </div>
    </PageTransition>
  );
};

export default RunningPage;
