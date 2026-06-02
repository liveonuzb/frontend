import React from "react";
import { useTranslation } from "react-i18next";
import get from "lodash/get";
import map from "lodash/map";
import orderBy from "lodash/orderBy";
import sumBy from "lodash/sumBy";
import filter from "lodash/filter";
import forEach from "lodash/forEach";
import split from "lodash/split";
import toNumber from "lodash/toNumber";
import isArray from "lodash/isArray";
import toUpper from "lodash/toUpper";
import { useNavigate } from "react-router";
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircle2Icon,
  DownloadIcon,
  DumbbellIcon,
  FlameIcon,
  HeartPulseIcon,
  HistoryIcon,
  RouteIcon,
  TimerIcon,
} from "lucide-react";
import PageLoader from "@/components/page-loader/index.jsx";
import PageTransition from "@/components/page-transition";
import { TrackingPageHeader } from "@/components/tracking-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useWorkoutPlans } from "@/hooks/app/use-workout-plans";
import {
  useWorkoutSessionHistory,
  useWorkoutSessionHistorySummary,
} from "@/hooks/app/use-workout-sessions";
import {
  formatRunningClockDuration,
  formatRunningDistance,
  formatRunningPace,
} from "@/lib/running-metrics";
import {
  getWorkoutSessionDistanceMeters,
  getWorkoutSessionPaceSecondsPerKm,
  isOutdoorRunningSession,
} from "@/lib/workout-session-metrics";
import { useBreadcrumbStore } from "@/store";
import RunMapPanel from "../running/components/run-map-panel.jsx";

const formatDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("uz-UZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatDuration = (seconds, t) => {
  const totalMinutes = Math.max(0, Math.round((toNumber(seconds) || 0) / 60));
  return t("user.workout.history.minutesValue", { count: totalMinutes });
};

const formatSessionDuration = (session, t) =>
  isOutdoorRunningSession(session)
    ? formatRunningClockDuration(get(session, "durationSeconds"))
    : formatDuration(get(session, "durationSeconds"), t);

const getDateKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

const toStartOfDay = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const getMonthKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const formatMonthLabel = (monthKey) => {
  const [year, month] = split(String(monthKey), "-");
  const date = new Date(toNumber(year), toNumber(month) - 1, 1);
  if (Number.isNaN(date.getTime())) return monthKey;
  return new Intl.DateTimeFormat("uz-UZ", {
    month: "short",
    year: "numeric",
  }).format(date);
};

const isWithinLastDays = (value, days) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  const threshold = new Date(now);
  threshold.setHours(0, 0, 0, 0);
  threshold.setDate(threshold.getDate() - (days - 1));
  return date >= threshold;
};

const calculateCurrentStreak = (sessions) => {
  const uniqueDays = orderBy(Array.from(
    new Set(
      filter(map(sessions, (item) => getDateKey(get(item, "endedAt"))), Boolean),
    ),
  ), [(value) => value], ["desc"]);

  if (uniqueDays.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const latest = new Date(uniqueDays[0]);
  latest.setHours(0, 0, 0, 0);
  const diffFromToday = Math.round((today - latest) / 86400000);
  if (diffFromToday > 1) {
    return 0;
  }

  let streak = 1;
  for (let index = 1; index < uniqueDays.length; index += 1) {
    const previous = new Date(uniqueDays[index - 1]);
    const current = new Date(uniqueDays[index]);
    previous.setHours(0, 0, 0, 0);
    current.setHours(0, 0, 0, 0);
    const diffDays = Math.round((previous - current) / 86400000);
    if (diffDays === 1) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
};

const PERIODS = [
  { key: "all", labelKey: "user.workout.history.periodAll" },
  { key: "7d", labelKey: "user.workout.history.period7d" },
  { key: "30d", labelKey: "user.workout.history.period30d" },
];

const TYPE_FILTERS = [
  { key: "all", labelKey: "user.workout.history.typeAll" },
  { key: "running", labelKey: "user.workout.history.typeRunning" },
  { key: "strength", labelKey: "user.workout.history.typeStrength" },
];

const HISTORY_PAGE_LIMIT = 10;

const compactParams = (params) =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  );

const isMatchingType = (session, type) => {
  if (type === "running") {
    return isOutdoorRunningSession(session);
  }

  if (type === "strength") {
    return !isOutdoorRunningSession(session);
  }

  return true;
};

const isWithinDateRange = (value, dateRange) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  if (dateRange.from) {
    const from = new Date(`${dateRange.from}T00:00:00.000`);
    if (!Number.isNaN(from.getTime()) && date < from) {
      return false;
    }
  }

  if (dateRange.to) {
    const to = new Date(`${dateRange.to}T23:59:59.999`);
    if (!Number.isNaN(to.getTime()) && date > to) {
      return false;
    }
  }

  return true;
};

const escapeCsvCell = (value) => {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

const getExportSessionTitle = (session) =>
  get(session, "focus") ||
  get(session, "planName") ||
  get(session, "runningSession.momentTitle") ||
  "Workout";

const normalizeRouteQualityScore = (score) => {
  const numericScore = toNumber(score);
  if (!Number.isFinite(numericScore) || numericScore <= 0) {
    return null;
  }

  return Math.min(
    100,
    Math.round(numericScore <= 1 ? numericScore * 100 : numericScore),
  );
};

const getWorkoutSessionRoutePolyline = (session) =>
  get(
    session,
    "routePolyline",
    get(
      session,
      "runningSession.route.polyline",
      get(session, "route.polyline", null),
    ),
  );

const getWorkoutSessionRoutePoints = (session) => {
  const points = get(session, "points", get(session, "runningSession.points", []));
  return isArray(points) ? points : [];
};

const getWorkoutSessionRouteSegments = (session) => {
  const directSegments = get(session, "route.segments");
  const runningSegments = get(session, "runningSession.route.segments");

  if (isArray(directSegments) && directSegments.length > 0) {
    return directSegments;
  }

  return isArray(runningSegments) ? runningSegments : [];
};

const getWorkoutSessionRouteQualityScore = (session) =>
  get(
    session,
    "gpsQualityScore",
    get(
      session,
      "metrics.gpsQualityScore",
      get(session, "runningSession.metrics.gpsQualityScore", null),
    ),
  );

const getWorkoutSessionAveragePulse = (session) => {
  const pulse = get(
    session,
    "averageHeartRate",
    get(
      session,
      "avgHeartRate",
      get(
        session,
        "metrics.averageHeartRate",
        get(session, "runningSession.metrics.averageHeartRate", null),
      ),
    ),
  );
  const numericPulse = toNumber(pulse);
  return Number.isFinite(numericPulse) && numericPulse > 0
    ? Math.round(numericPulse)
    : null;
};

const getRouteQualityToneKey = (score) => {
  if (score === null) return "user.workout.history.routeUnknown";
  if (score >= 80) return "user.workout.history.routeExcellent";
  if (score >= 50) return "user.workout.history.routeNeedsReview";
  return "user.workout.history.routeWeak";
};

export const buildWorkoutHistoryCsv = (sessions) => {
  const headers = [
    "id",
    "title",
    "type",
    "endedAt",
    "durationSeconds",
    "calories",
    "distanceMeters",
    "paceSecondsPerKm",
    "totalVolumeKg",
    "status",
  ];
  const rows = map(sessions, (session) => [
    get(session, "id", ""),
    getExportSessionTitle(session),
    isOutdoorRunningSession(session) ? "running" : "strength",
    get(session, "endedAt", ""),
    toNumber(get(session, "durationSeconds", 0)) || 0,
    toNumber(get(session, "estimatedCalories", 0)) || 0,
    getWorkoutSessionDistanceMeters(session),
    getWorkoutSessionPaceSecondsPerKm(session) ?? "",
    toNumber(get(session, "totalVolumeKg", 0)) || 0,
    get(session, "status", "completed"),
  ]);

  return [headers, ...rows]
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\n");
};

const buildMonthlyBuckets = (sessions, monthsCount = 6) => {
  const now = new Date();
  const buckets = [];

  for (let offset = monthsCount - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const monthKey = getMonthKey(date);
    const monthSessions = filter(sessions, (item) => getMonthKey(get(item, "endedAt")) === monthKey);

    buckets.push({
      monthKey,
      label: formatMonthLabel(monthKey),
      sessions: monthSessions.length,
      minutes: Math.round(
        sumBy(monthSessions, (item) => toNumber(item.durationSeconds || 0)) / 60,
      ),
      calories: sumBy(monthSessions, (item) => toNumber(item.estimatedCalories || 0)),
      volume: sumBy(monthSessions, (item) => toNumber(item.totalVolumeKg || 0)),
    });
  }

  return buckets;
};

const calculateMissedWorkouts = (plans = []) => {
  const todayStart = toStartOfDay(new Date());
  const currentMonthKey = getMonthKey(todayStart);
  let missedWorkouts = 0;
  let scheduledThisMonth = 0;
  let completedThisMonth = 0;

  forEach(plans, (plan) => {
    if (toUpper(String(get(plan, "status", ""))) !== "ACTIVE") {
      return;
    }

    const planStart = toStartOfDay(get(plan, "startDate") || get(plan, "createdAt"));
    if (!planStart) {
      return;
    }

    const schedule = isArray(get(plan, "schedule")) ? get(plan, "schedule") : [];
    const progress = isArray(get(plan, "dayProgress")) ? get(plan, "dayProgress") : [];

    forEach(schedule, (day, index) => {
      const exercises = isArray(get(day, "exercises")) ? get(day, "exercises") : [];
      if (exercises.length === 0) {
        return;
      }

      const plannedDate = addDays(planStart, index);
      if (plannedDate > todayStart) {
        return;
      }

      const isCompleted = Boolean(get(progress[index], "completed"));
      const monthKey = getMonthKey(plannedDate);

      if (monthKey === currentMonthKey) {
        scheduledThisMonth += 1;
        if (isCompleted) {
          completedThisMonth += 1;
        }
      }

      if (!isCompleted && plannedDate < todayStart) {
        missedWorkouts += 1;
      }
    });
  });

  return {
    missedWorkouts,
    scheduledThisMonth,
    completedThisMonth,
    completionRate:
      scheduledThisMonth > 0
        ? Math.round((completedThisMonth / scheduledThisMonth) * 100)
        : 0,
  };
};

const SessionHistoryPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const { items: workoutPlans } = useWorkoutPlans();
  const [period, setPeriod] = React.useState("all");
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [dateRange, setDateRange] = React.useState({ from: "", to: "" });
  const [cursorStack, setCursorStack] = React.useState([]);
  const currentCursor = cursorStack[cursorStack.length - 1] ?? "";
  const pageNumber = cursorStack.length + 1;
  const historyParams = React.useMemo(
    () =>
      compactParams({
        cursor: currentCursor,
        dateFrom: dateRange.from,
        dateTo: dateRange.to,
        limit: HISTORY_PAGE_LIMIT,
        period,
        status: "completed",
        type: typeFilter,
      }),
    [currentCursor, dateRange.from, dateRange.to, period, typeFilter],
  );
  const summaryParams = React.useMemo(
    () =>
      compactParams({
        dateFrom: dateRange.from,
        dateTo: dateRange.to,
        period,
        status: "completed",
        type: typeFilter,
      }),
    [dateRange.from, dateRange.to, period, typeFilter],
  );
  const { sessions, meta, isLoading, isError, refetch } =
    useWorkoutSessionHistory(historyParams);
  const { summary } = useWorkoutSessionHistorySummary(summaryParams);
  const canGoPrevious = cursorStack.length > 0;
  const canGoNext = Boolean(get(meta, "hasMore") && get(meta, "nextCursor"));

  const resetPagination = React.useCallback(() => {
    setCursorStack([]);
  }, []);

  const handlePeriodChange = React.useCallback((nextPeriod) => {
    setPeriod(nextPeriod);
    resetPagination();
  }, [resetPagination]);

  const handleTypeChange = React.useCallback((nextType) => {
    setTypeFilter(nextType);
    resetPagination();
  }, [resetPagination]);

  const handleDateRangeChange = React.useCallback(
    (field, value) => {
      setDateRange((current) => ({
        ...current,
        [field]: value,
      }));
      resetPagination();
    },
    [resetPagination],
  );

  const handleNextPage = React.useCallback(() => {
    const nextCursor = get(meta, "nextCursor");
    if (!nextCursor) return;
    setCursorStack((current) => [...current, nextCursor]);
  }, [meta]);

  const handlePreviousPage = React.useCallback(() => {
    setCursorStack((current) => current.slice(0, -1));
  }, []);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user", title: t("user.dashboard.title") },
      { url: "/user/workout", title: t("user.workout.title") },
      { url: "/user/workout/history", title: t("user.workout.history.breadcrumb") },
    ]);
  }, [setBreadcrumbs, t]);

  const filteredSessions = React.useMemo(() => {
    const typeSessions = filter(sessions, (item) =>
      isMatchingType(item, typeFilter),
    );
    const dateSessions = filter(typeSessions, (item) =>
      isWithinDateRange(get(item, "endedAt"), dateRange),
    );

    if (period === "30d") {
      return filter(dateSessions, (item) => isWithinLastDays(get(item, "endedAt"), 30));
    }

    if (period === "7d") {
      return filter(dateSessions, (item) => isWithinLastDays(get(item, "endedAt"), 7));
    }

    return dateSessions;
  }, [dateRange, period, sessions, typeFilter]);

  const downloadHistoryCsv = React.useCallback(() => {
    if (filteredSessions.length === 0) return;

    const csv = buildWorkoutHistoryCsv(filteredSessions);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `workout-history-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [filteredSessions]);

  const overview = React.useMemo(
    () => {
      const fallbackDurationSeconds = sumBy(filteredSessions, (item) =>
        toNumber(item.durationSeconds || 0),
      );

      return {
        totalSessions:
          toNumber(get(summary, "totalSessions")) || filteredSessions.length,
        totalMinutes: Math.round(
          (toNumber(get(summary, "totalDurationSeconds")) ||
            fallbackDurationSeconds) / 60,
        ),
        totalCalories:
          toNumber(get(summary, "totalCalories")) ||
          sumBy(filteredSessions, (item) =>
            toNumber(item.estimatedCalories || 0),
          ),
        totalVolumeKg:
          toNumber(get(summary, "totalVolumeKg")) ||
          sumBy(filteredSessions, (item) => toNumber(item.totalVolumeKg || 0)),
        streak:
          toNumber(get(summary, "streakDays")) ||
          calculateCurrentStreak(sessions),
      };
    },
    [filteredSessions, sessions, summary],
  );
  const monthlyBuckets = React.useMemo(() => buildMonthlyBuckets(sessions), [sessions]);
  const missedSummary = React.useMemo(
    () => calculateMissedWorkouts(workoutPlans),
    [workoutPlans],
  );

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError) {
    return (
      <PageTransition mode="slide-up">
        <Card className="py-6">
          <CardHeader>
            <CardTitle>{t("user.workout.history.errorTitle")}</CardTitle>
            <CardDescription>
              {t("user.workout.history.errorDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button onClick={() => refetch()}>
              {t("user.workout.history.retry")}
            </Button>
            <Button variant="outline" onClick={() => navigate("/user/workout")}>
              {t("user.workout.history.workoutPage")}
            </Button>
          </CardContent>
        </Card>
      </PageTransition>
    );
  }

  return (
    <PageTransition mode="slide-up">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <TrackingPageHeader
          title={t("user.workout.history.title")}
          subtitle={t("user.workout.history.subtitle")}
          hideTitleOnMobile={false}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={downloadHistoryCsv}
                disabled={filteredSessions.length === 0}
              >
                <DownloadIcon data-icon="inline-start" />
                {t("user.workout.history.export")}
              </Button>
              <Button variant="outline" onClick={() => navigate("/user/workout")}>
                <ArrowLeftIcon data-icon="inline-start" />
                {t("user.workout.title")}
              </Button>
            </div>
          }
        />

        <div className="flex flex-wrap items-end gap-3 rounded-3xl border bg-card/80 p-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            {map(PERIODS, (item) => (
              <Button
                key={item.key}
                type="button"
                variant={period === item.key ? "default" : "secondary"}
                className="rounded-full"
                onClick={() => handlePeriodChange(item.key)}
              >
                {t(item.labelKey)}
              </Button>
            ))}
          </div>
          <span className="hidden h-8 w-px bg-border sm:inline-flex" />
          <div className="flex flex-wrap items-center gap-2">
            {map(TYPE_FILTERS, (item) => (
              <Button
                key={item.key}
                type="button"
                variant={typeFilter === item.key ? "default" : "secondary"}
                className="rounded-full"
                onClick={() => handleTypeChange(item.key)}
              >
                {t(item.labelKey)}
              </Button>
            ))}
          </div>
          <span className="hidden h-8 w-px bg-border lg:inline-flex" />
          <label className="grid min-w-40 gap-1 text-xs font-semibold text-muted-foreground">
            {t("user.workout.history.dateFrom")}
            <Input
              aria-label={t("user.workout.history.dateFrom")}
              type="date"
              value={dateRange.from}
              onChange={(event) =>
                handleDateRangeChange("from", event.target.value)
              }
              className="h-9 rounded-full"
            />
          </label>
          <label className="grid min-w-40 gap-1 text-xs font-semibold text-muted-foreground">
            {t("user.workout.history.dateTo")}
            <Input
              aria-label={t("user.workout.history.dateTo")}
              type="date"
              value={dateRange.to}
              onChange={(event) =>
                handleDateRangeChange("to", event.target.value)
              }
              className="h-9 rounded-full"
            />
          </label>
        </div>

        {filteredSessions.length === 0 ? (
          <Card className="py-6">
            <CardHeader>
              <CardTitle>{t("user.workout.history.emptyTitle")}</CardTitle>
              <CardDescription>
                {t("user.workout.history.emptyDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Button onClick={() => navigate("/user/workout/plans")}>
                {t("user.workout.history.viewPlans")}
              </Button>
              <Button variant="outline" onClick={() => navigate("/user/workout/plans/create")}>
                {t("user.workout.history.createPlan")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <Card className="rounded-3xl py-6">
                <CardContent className="p-5">
                  <p className="text-xs text-muted-foreground">
                    {t("user.workout.history.sessions")}
                  </p>
                  <p className="mt-2 text-3xl font-black">{overview.totalSessions}</p>
                </CardContent>
              </Card>
              <Card className="rounded-3xl py-6">
                <CardContent className="p-5">
                  <p className="text-xs text-muted-foreground">
                    {t("user.workout.history.duration")}
                  </p>
                  <p className="mt-2 text-3xl font-black">
                    {t("user.workout.history.minutesShort", {
                      count: overview.totalMinutes,
                    })}
                  </p>
                </CardContent>
              </Card>
              <Card className="rounded-3xl py-6">
                <CardContent className="p-5">
                  <p className="text-xs text-muted-foreground">
                    {t("user.workout.history.calories")}
                  </p>
                  <p className="mt-2 text-3xl font-black">{overview.totalCalories} kcal</p>
                </CardContent>
              </Card>
              <Card className="rounded-3xl py-6">
                <CardContent className="p-5">
                  <p className="text-xs text-muted-foreground">
                    {t("user.workout.history.volume")}
                  </p>
                  <p className="mt-2 text-3xl font-black">{overview.totalVolumeKg} kg</p>
                </CardContent>
              </Card>
              <Card className="rounded-3xl py-6">
                <CardContent className="p-5">
                  <p className="text-xs text-muted-foreground">
                    {t("user.workout.history.streak")}
                  </p>
                  <p className="mt-2 inline-flex items-center gap-2 text-3xl font-black">
                    <HistoryIcon className="size-5 text-primary" />
                    {t("user.workout.history.daysValue", {
                      count: overview.streak,
                    })}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.15fr_1fr]">
              <Card className="rounded-[2rem] py-6">
                <CardHeader>
                  <CardTitle>{t("user.workout.history.thisMonth")}</CardTitle>
                  <CardDescription>
                    {t("user.workout.history.thisMonthDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-4">
                  <div className="rounded-3xl bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">
                      {t("user.workout.history.scheduled")}
                    </p>
                    <p className="mt-2 text-2xl font-black">
                      {missedSummary.scheduledThisMonth}
                    </p>
                  </div>
                  <div className="rounded-3xl bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">
                      {t("user.workout.history.completed")}
                    </p>
                    <p className="mt-2 text-2xl font-black">
                      {missedSummary.completedThisMonth}
                    </p>
                  </div>
                  <div className="rounded-3xl bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">
                      {t("user.workout.history.missed")}
                    </p>
                    <p className="mt-2 text-2xl font-black">
                      {missedSummary.missedWorkouts}
                    </p>
                  </div>
                  <div className="rounded-3xl bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">
                      {t("user.workout.history.rate")}
                    </p>
                    <p className="mt-2 text-2xl font-black">
                      {missedSummary.completionRate}%
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[2rem] py-6">
                <CardHeader>
                  <CardTitle>{t("user.workout.history.monthlyView")}</CardTitle>
                  <CardDescription>
                    {t("user.workout.history.monthlyViewDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {map(monthlyBuckets, (bucket) => (
                    <div
                      key={bucket.monthKey}
                      className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-3 rounded-3xl border px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-black">{bucket.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {t("user.workout.history.monthlyBucketSummary", {
                            minutes: bucket.minutes,
                            calories: bucket.calories,
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {t("user.workout.history.session")}
                        </p>
                        <p className="font-black">{bucket.sessions}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {t("user.workout.history.volume")}
                        </p>
                        <p className="font-black">{bucket.volume} kg</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Kcal</p>
                        <p className="font-black">{bucket.calories}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              {map(filteredSessions, (session) => {
                const isRunning = isOutdoorRunningSession(session);
                const sessionId = get(session, "id");
                const distanceMeters = getWorkoutSessionDistanceMeters(session);
                const paceSecondsPerKm = getWorkoutSessionPaceSecondsPerKm(session);
                const routePoints = getWorkoutSessionRoutePoints(session);
                const routeSegments = getWorkoutSessionRouteSegments(session);
                const routePolyline = getWorkoutSessionRoutePolyline(session);
                const routeQualityScore = getWorkoutSessionRouteQualityScore(session);
                const normalizedRouteQuality =
                  normalizeRouteQualityScore(routeQualityScore);
                const averagePulse = getWorkoutSessionAveragePulse(session);
                const openSession = () => navigate(`/user/workout/history/${sessionId}`);

                return (
                  <div
                    key={sessionId}
                    role="button"
                    tabIndex={0}
                    onClick={openSession}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openSession();
                      }
                    }}
                    className="w-full cursor-pointer rounded-3xl border bg-card text-left shadow-sm outline-none transition hover:border-primary/40 hover:bg-primary/5 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/25"
                  >
                    <div className="grid gap-4 p-5 lg:grid-cols-[168px_minmax(0,1fr)_minmax(250px,auto)] lg:items-start">
                      <div className="h-28 overflow-hidden rounded-2xl bg-muted/40 lg:h-24">
                        {isRunning ? (
                          <RunMapPanel
                            title={null}
                            variant="preview"
                            provider="none"
                            points={routePoints}
                            segments={routeSegments}
                            polyline={routePolyline}
                            qualityScore={routeQualityScore}
                            emptyLabel={t("user.workout.history.routeWaiting")}
                            showQuality={false}
                            className="h-full"
                            surfaceClassName="h-full min-h-0 rounded-2xl md:h-full"
                            labels={{
                              loading: t("user.workout.history.routeLoading"),
                              error: t("user.workout.history.routeUnavailable"),
                              routePreviewLabel: t("user.workout.history.routePreview"),
                            }}
                          />
                        ) : (
                          <div className="grid h-full place-items-center bg-primary/5 text-primary">
                            <DumbbellIcon className="size-8" aria-hidden="true" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-black">
                            {get(session, "focus") ||
                              get(session, "planName") ||
                              (isRunning
                                ? t("user.workout.running.shared.outdoorRun")
                                : t("user.workout.title"))}
                          </h2>
                          {isRunning ? (
                            <Badge variant="outline">
                              <RouteIcon />
                              {t("user.workout.history.running")}
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              <DumbbellIcon />
                              {t("user.workout.history.dayBadge", {
                                day:
                                  (toNumber(get(session, "planDayIndex")) || 0) +
                                  1,
                              })}
                            </Badge>
                          )}
                          <Badge variant="secondary">
                            <CheckCircle2Icon />
                            {t("user.workout.history.completedBadge")}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {isRunning
                            ? t("user.workout.history.gpsRunningSession")
                            : get(session, "planName") ||
                              t("user.workout.session.workoutPlan")}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDaysIcon className="size-4" />
                            {formatDateTime(get(session, "endedAt"))}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <TimerIcon className="size-4" />
                            {formatSessionDuration(session, t)}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <FlameIcon className="size-4" />
                            {get(session, "estimatedCalories", 0)} kcal
                          </span>
                          {isRunning ? (
                            <>
                              <span className="inline-flex items-center gap-1.5">
                                <HeartPulseIcon className="size-4 text-rose-500" />
                                {averagePulse
                                  ? `${averagePulse} bpm`
                                  : t("user.workout.history.noPulse")}
                              </span>
                              <span className="inline-flex items-center gap-1.5">
                                <RouteIcon className="size-4 text-primary" />
                                {t("user.workout.history.routeQuality")}{" "}
                                <span className="font-bold text-foreground">
                                  {normalizedRouteQuality === null
                                    ? "--/100"
                                    : `${normalizedRouteQuality}/100`}
                                </span>
                              </span>
                            </>
                          ) : null}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:min-w-64">
                        {isRunning ? (
                          <>
                            <div className="rounded-2xl bg-muted/30 p-3 text-center">
                              <p className="text-xs text-muted-foreground">
                                {t("user.workout.history.distance")}
                              </p>
                              <p className="mt-1 font-black">
                                {formatRunningDistance(distanceMeters)}
                              </p>
                            </div>
                            <div className="rounded-2xl bg-muted/30 p-3 text-center">
                              <p className="text-xs text-muted-foreground">
                                {t("user.workout.history.time")}
                              </p>
                              <p className="mt-1 font-black">
                                {formatRunningClockDuration(
                                  get(session, "durationSeconds"),
                                )}
                              </p>
                            </div>
                            <div className="rounded-2xl bg-muted/30 p-3 text-center">
                              <p className="text-xs text-muted-foreground">
                                {t("user.workout.history.pace")}
                              </p>
                              <p className="mt-1 font-black">
                                {formatRunningPace(paceSecondsPerKm)}
                              </p>
                            </div>
                            <div className="rounded-2xl bg-primary/10 p-3 text-center text-primary sm:col-span-3">
                              <p className="text-xs font-semibold">
                                {t(getRouteQualityToneKey(normalizedRouteQuality))}
                              </p>
                              <p className="mt-1 font-black">
                                {normalizedRouteQuality === null
                                  ? "--/100"
                                  : `${normalizedRouteQuality}/100`}
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="rounded-2xl bg-muted/30 p-3 text-center">
                              <p className="text-xs text-muted-foreground">
                                {t("user.workout.history.set")}
                              </p>
                              <p className="mt-1 font-black">
                                {get(session, "completedSets", 0)}/{get(session, "totalSets", 0)}
                              </p>
                            </div>
                            <div className="rounded-2xl bg-muted/30 p-3 text-center">
                              <p className="text-xs text-muted-foreground">
                                {t("user.workout.history.exercise")}
                              </p>
                              <p className="mt-1 font-black">
                                {get(session, "completedExerciseCount", 0)}
                              </p>
                            </div>
                            <div className="rounded-2xl bg-muted/30 p-3 text-center">
                              <p className="text-xs text-muted-foreground">
                                {t("user.workout.history.volume")}
                              </p>
                              <p className="mt-1 font-black">
                                {get(session, "totalVolumeKg", 0)} kg
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 rounded-3xl border bg-card px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-muted-foreground">
                {t("user.workout.history.pageLabel", { page: pageNumber })}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!canGoPrevious}
                  onClick={handlePreviousPage}
                >
                  <ChevronLeftIcon data-icon="inline-start" />
                  {t("user.workout.history.previous")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!canGoNext}
                  onClick={handleNextPage}
                >
                  {t("user.workout.history.next")}
                  <ChevronRightIcon data-icon="inline-end" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </PageTransition>
  );
};

export default SessionHistoryPage;
