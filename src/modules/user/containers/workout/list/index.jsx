import React from "react";
import { useTranslation } from "react-i18next";
import { get, filter, isArray, map, orderBy, split, toNumber, take } from "lodash";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  ArrowRightIcon,
  CalendarCheck2Icon,
  CheckCircle2Icon,
  Clock3Icon,
  CloudSunIcon,
  DumbbellIcon,
  FlameIcon,
  GaugeIcon,
  HeartPulseIcon,
  MapPinIcon,
  MedalIcon,
  MoreHorizontalIcon,
  PlayIcon,
  RouteIcon,
  TargetIcon,
  ThermometerSunIcon,
  TrophyIcon,
} from "lucide-react";
import PageTransition from "@/components/page-transition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useWorkoutOverview from "@/hooks/app/use-workout-overview";
import useWorkoutPlan from "@/hooks/app/use-workout-plan";
import { WORKOUT_PLAN_STATUS } from "@/hooks/app/use-workout-plans";
import { useWorkoutSessionHistory } from "@/hooks/app/use-workout-sessions";
import {
  useRunningActiveSession,
  useRunningSessions,
  useRunningStatsSummary,
  useStartRunningSession,
} from "@/hooks/app/use-running-sessions";
import useWorkoutWeatherToday from "@/hooks/app/use-workout-weather";
import RunMapPanel from "../running/components/run-map-panel.jsx";
import {
  formatRunningDistance,
  formatRunningDuration,
} from "@/lib/running-metrics";
import { useBreadcrumbStore } from "@/store";
import { cn } from "@/lib/utils";
import {
  deriveWorkoutPlanMetrics,
  getFirstWorkoutDayIndex,
  getNextStartableDayIndex,
  isWorkoutDayLocked,
} from "../utils";
import { WORKOUT_RECOMMENDED_PLANS } from "../workout-showcase-data.js";

const IMAGE_SET = {
  athlete:
    "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1200&q=80",
  athleteAlt:
    "https://images.unsplash.com/photo-1534367610401-9f5ed68180aa?auto=format&fit=crop&w=900&q=80",
  runner:
    "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=900&q=80",
  map:
    "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=900&q=80",
  dumbbell:
    "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=900&q=80",
};

const DAILY_CALORIE_GOAL = 2200;
const WEEKLY_DISTANCE_GOAL_METERS = 40000;

const getDateKey = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return split(date.toISOString(), "T")[0];
};

const getWorkoutDayDateKey = (item) => {
  if (typeof item === "string" || item instanceof Date) {
    return getDateKey(item);
  }

  return getDateKey(get(item, "date", get(item, "completedAt", item)));
};

const toStartOfDay = (value) => {
  const date = value instanceof Date ? new Date(value) : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
};

const addDays = (date, days) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const formatWorkoutRecommendationLabel = (date, now = new Date(), t, language = "uz") => {
  const targetDate = toStartOfDay(date);
  const today = toStartOfDay(now);

  if (!targetDate || !today) {
    return t("user.workout.dashboard.date.recommended");
  }

  const diffDays = Math.round((targetDate - today) / 86400000);

  if (diffDays === 0) {
    return t("user.workout.dashboard.date.today");
  }

  if (diffDays === 1) {
    return t("user.workout.dashboard.date.tomorrow");
  }

  return new Intl.DateTimeFormat(language, {
    day: "numeric",
    month: "short",
  }).format(targetDate);
};

const getWeekDays = (completedDates = [], t) => {
  const labels = [
    t("user.workout.dashboard.weekdays.sun"),
    t("user.workout.dashboard.weekdays.mon"),
    t("user.workout.dashboard.weekdays.tue"),
    t("user.workout.dashboard.weekdays.wed"),
    t("user.workout.dashboard.weekdays.thu"),
    t("user.workout.dashboard.weekdays.fri"),
    t("user.workout.dashboard.weekdays.sat"),
  ];
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - ((today.getDay() + 2) % 7));
  const completedDateSet = new Set(completedDates);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);

    return {
      label: labels[date.getDay()],
      day: date.getDate(),
      isToday: getDateKey(date) === getDateKey(today),
      done: completedDateSet.has(getDateKey(date)),
    };
  });
};

const getPlanImage = (plan, index = 0) =>
  get(plan, "generationMeta.heroImage") ||
  get(plan, "coverImageUrl") ||
  get(plan, "image") ||
  [IMAGE_SET.athlete, IMAGE_SET.athleteAlt, IMAGE_SET.dumbbell][index % 3];

const buildNextWorkouts = (activePlan, now = new Date(), t, language) => {
  const schedule = get(activePlan, "schedule", []);
  const nextStartableDayIndex = getNextStartableDayIndex(activePlan);
  const firstWorkoutDayIndex = getFirstWorkoutDayIndex(schedule);
  const completedDayIndexes = new Set(
    map(filter(
      (isArray(get(activePlan, "dayProgress")) ? get(activePlan, "dayProgress") : []),
      (item) => Boolean(get(item, "completed")),
    ), (item) => toNumber(get(item, "dayIndex"))),
  );
  const nextIncompleteDayIndex = schedule.findIndex(
    (day, dayIndex) =>
      get(day, "exercises", []).length > 0 &&
      !completedDayIndexes.has(dayIndex) &&
      !isWorkoutDayLocked(activePlan, dayIndex),
  );
  const startDayIndex =
    nextIncompleteDayIndex >= 0
      ? nextIncompleteDayIndex
      : nextStartableDayIndex >= 0
        ? nextStartableDayIndex
        : firstWorkoutDayIndex;
  const planStartDate = toStartOfDay(
    get(activePlan, "startDate") || get(activePlan, "createdAt") || now,
  );
  const today = toStartOfDay(now) ?? new Date();
  const initialRecommendedDate =
    planStartDate && startDayIndex >= 0
      ? (() => {
          const candidate = addDays(planStartDate, startDayIndex);
          return candidate > today ? candidate : today;
        })()
      : today;

  return map(take(
    filter(map(schedule, (day, dayIndex) => ({ day, dayIndex })), ({ day, dayIndex }) =>
      dayIndex >= Math.max(0, startDayIndex) &&
      get(day, "exercises", []).length > 0),
    3,
  ), ({ day, dayIndex }, index) => {
      const recommendedDate = addDays(
        initialRecommendedDate,
        dayIndex - Math.max(0, startDayIndex),
      );

      return {
        id: `${get(activePlan, "id", "active")}-${dayIndex}`,
        dayIndex,
        isStartable: !isWorkoutDayLocked(activePlan, dayIndex),
        title:
          get(day, "title") ||
          get(day, "name") ||
          t("user.workout.dashboard.date.dayNumber", { day: dayIndex + 1 }),
        time: formatWorkoutRecommendationLabel(recommendedDate, now, t, language),
        image:
          get(day, "exercises[0].imageUrl") ||
          get(day, "exercises[0].image") ||
          getPlanImage(activePlan, index),
        exerciseCount: get(day, "exercises", []).length,
      };
    });
};

const formatNumber = (value = 0) =>
  new Intl.NumberFormat("en-US").format(Math.round(toNumber(value) || 0));

const formatMetricDuration = (seconds = 0) => {
  const totalSeconds = Math.max(0, toNumber(seconds) || 0);
  if (totalSeconds <= 0) {
    return "0:00";
  }
  return formatRunningDuration(totalSeconds);
};

const formatPace = (secondsPerKm) => {
  const pace = toNumber(secondsPerKm);
  if (!Number.isFinite(pace) || pace <= 0) {
    return "--";
  }

  const minutes = Math.floor(pace / 60);
  const seconds = Math.round(pace % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0",
  )} /km`;
};

const formatTemperature = (value) =>
  Number.isFinite(toNumber(value)) ? `${Math.round(toNumber(value))}°C` : "--";

const clampMetric = (value) => Math.max(0, toNumber(value) || 0);

const clampPercent = (value) =>
  Math.max(0, Math.min(100, Math.round(toNumber(value) || 0)));

const EMPTY_WEATHER = {
  location: "Tashkent",
  temperatureC: null,
  feelsLikeC: null,
  condition: "Ob-havo yuklanmoqda",
  humidity: null,
  windKph: null,
  aqi: null,
  aqiLabel: "Unknown",
};

const getRunningMetrics = (session) => ({
  distanceMeters: toNumber(get(session, "metrics.distanceMeters", 0)) || 0,
  durationSeconds: toNumber(get(session, "metrics.durationSeconds", 0)) || 0,
  caloriesBurned: toNumber(get(session, "metrics.caloriesBurned", 0)) || 0,
  averagePaceSecondsPerKm: get(session, "metrics.averagePaceSecondsPerKm"),
});

const getWorkoutDurationSeconds = (session) =>
  toNumber(get(session, "durationSeconds")) ||
  toNumber(get(session, "elapsedSeconds")) ||
  toNumber(get(session, "durationMinutes", 0)) * 60 ||
  0;

const getWorkoutCalories = (session) =>
  toNumber(get(
    session,
    "burnedCalories",
    get(session, "caloriesBurned", get(session, "calories", 0)),
  )) || 0;

const getActivityTimestamp = (activity) =>
  Date.parse(activity.sortDate || activity.endedAt || activity.startedAt || "") || 0;

const formatActivityTime = (value, t, language = "uz") => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return t("user.workout.dashboard.date.today");
  }

  const todayKey = getDateKey(new Date());
  const dateKey = getDateKey(date);
  const time = new Intl.DateTimeFormat(language, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  if (dateKey === todayKey) {
    return t("user.workout.dashboard.date.todayAt", { time });
  }

  return t("user.workout.dashboard.date.yesterdayAt", { time });
};

const buildActivityFeed = (workoutSessions = [], runningSessions = [], t) => {
  const workoutItems = map(take(workoutSessions, 4), (session, index) => {
    const sessionId = get(session, "id", null);

    return {
      id: sessionId || `workout-${index}`,
      type: "workout",
      title:
        get(session, "title") ||
        get(session, "planDayTitle") ||
        get(session, "planName") ||
        t("user.workout.dashboard.activity.defaultWorkoutTitle"),
      subtitle: t("user.workout.dashboard.activity.workout"),
      image: get(session, "image") || get(session, "imageUrl") || IMAGE_SET.dumbbell,
      href: sessionId
        ? `/user/workout/history/${sessionId}`
        : "/user/workout/history",
      sortDate: get(session, "endedAt") || get(session, "startedAt"),
      metrics: [
        { icon: Clock3Icon, label: formatMetricDuration(getWorkoutDurationSeconds(session)) },
        { icon: FlameIcon, label: `${formatNumber(getWorkoutCalories(session))} kcal` },
        {
          icon: HeartPulseIcon,
          label: `${toNumber(get(session, "averageHeartRate", 0)) || 145} bpm`,
        },
      ],
    };
  });

  const runningItems = map(take(runningSessions, 4), (session, index) => {
    const metrics = getRunningMetrics(session);
    const workoutSessionId =
      get(session, "workoutSessionId") || get(session, "id") || null;
    const routePoints = isArray(get(session, "points"))
      ? get(session, "points")
      : [];

    return {
      id: workoutSessionId || `run-${index}`,
      type: "running",
      title: get(session, "title") || t("user.workout.dashboard.activity.defaultRunTitle"),
      subtitle: t("user.workout.dashboard.activity.running"),
      href: workoutSessionId
        ? `/user/workout/history/${workoutSessionId}`
        : "/user/workout/history",
      routePoints,
      routePolyline: get(session, "route.polyline", get(session, "polyline", null)),
      routeQualityScore: get(
        session,
        "metrics.gpsQualityScore",
        get(session, "gpsQualityScore", null),
      ),
      sortDate: get(session, "endedAt") || get(session, "startedAt"),
      metrics: [
        { icon: RouteIcon, label: formatRunningDistance(metrics.distanceMeters) },
        { icon: Clock3Icon, label: formatMetricDuration(metrics.durationSeconds) },
        { icon: GaugeIcon, label: formatPace(metrics.averagePaceSecondsPerKm) },
      ],
    };
  });

  return take(
    orderBy(
      [...workoutItems, ...runningItems],
      [getActivityTimestamp],
      ["desc"],
    ),
    3,
  );
};

function ProgressBar({ value, className }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-muted">
      <div
        className={cn("h-full rounded-full bg-primary", className)}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

function MetricPill({ icon: Icon, value, label, tone = "text-primary" }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <Icon className={cn("size-5 shrink-0", tone)} />
        <p className="truncate text-xl font-black text-foreground">{value}</p>
      </div>
      <p className="mt-1 truncate text-sm font-medium text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function TodayWorkoutHero({
  item,
  activePlan,
  weeklyStats,
  onOpen,
  onCreate,
  onCreatePlan,
  t,
}) {
  const hasActivePlan = Boolean(activePlan);
  const hasWorkout = Boolean(item);
  const title = hasWorkout
    ? item.title
    : hasActivePlan
      ? get(
          activePlan,
          "todayWorkout.title",
          get(activePlan, "name", t("user.workout.dashboard.hero.defaultWorkout")),
        )
      : t("user.workout.dashboard.hero.choosePlanTitle");
  const image = hasWorkout
    ? item.image
    : getPlanImage(activePlan || WORKOUT_RECOMMENDED_PLANS[0]);
  const workoutCount = toNumber(get(weeklyStats, "count", 0)) || 0;
  const durationSeconds = (toNumber(get(weeklyStats, "duration", 0)) || 0) * 60;
  const calories = toNumber(get(weeklyStats, "calories", 0)) || 0;
  const progress = clampPercent(
    get(activePlan, "progress", get(activePlan, "completionPercent", 0)),
  );
  const currentWeek = toNumber(get(activePlan, "currentWeek", 2)) || 2;
  const currentDay = toNumber(get(activePlan, "currentDay", 3)) || 3;
  const todayFocus =
    get(activePlan, "todayWorkout.title") ||
    get(item, "title") ||
    t("user.workout.dashboard.hero.defaultFocus");

  return (
    <Card className="workout-glass-card overflow-hidden p-0">
      <div className="group relative min-h-[360px] w-full overflow-hidden p-5 text-left sm:p-8">
        <img
          src={image}
          alt={title}
          className="absolute inset-y-0 right-0 h-full w-full object-cover opacity-75 md:w-[52%] dark:opacity-80"
          loading="lazy"
        />
        <div
          data-testid="today-workout-hero-media-scrim"
          className="workout-media-contrast-scrim absolute inset-0 bg-[radial-gradient(circle_at_70%_36%,rgb(var(--accent-rgb)/0.24),transparent_26%),linear-gradient(90deg,color-mix(in_srgb,var(--color-background)_99%,transparent)_0%,color-mix(in_srgb,var(--color-background)_94%,transparent)_46%,color-mix(in_srgb,var(--color-background)_42%,transparent)_100%)] dark:bg-[radial-gradient(circle_at_72%_34%,rgb(var(--accent-rgb)/0.28),transparent_28%),linear-gradient(90deg,color-mix(in_srgb,var(--color-background)_99%,transparent)_0%,color-mix(in_srgb,var(--color-background)_92%,transparent)_48%,color-mix(in_srgb,var(--color-background)_36%,transparent)_100%)]"
        />
        <div className="relative z-10 flex h-full max-w-3xl flex-col gap-5 sm:gap-7">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-black tracking-normal md:text-3xl">
              {t("user.workout.dashboard.hero.title")}
            </h1>
            <Badge
              variant="secondary"
              className={cn(
                "rounded-full border px-4 py-1 text-[11px] font-black uppercase",
                hasActivePlan
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-primary/25 bg-primary/10 text-primary",
              )}
            >
              {hasActivePlan
                ? t("user.workout.dashboard.hero.activeBadge")
                : t("user.workout.dashboard.hero.noActiveBadge")}
            </Badge>
          </div>

          <div className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary sm:size-16">
            <DumbbellIcon className="size-6 sm:size-8" />
          </div>

          <div>
            <p className="text-sm font-semibold text-muted-foreground">
              {hasActivePlan
                ? t("user.workout.dashboard.date.today")
                : t("user.workout.dashboard.hero.statusLabel")}
            </p>
            <h2 className="mt-1 text-3xl font-black leading-tight md:text-4xl">
              {hasActivePlan ? (
                <>
                  {t("user.workout.dashboard.hero.todayIsPrefix")}{" "}
                  <span className="text-primary">{title}</span>
                </>
              ) : (
                <>
                  {t("user.workout.dashboard.hero.choosePlanPrefix")}{" "}
                  <span className="text-primary">
                    {t("user.workout.dashboard.hero.choosePlanHighlight")}
                  </span>
                </>
              )}
            </h2>
            {hasActivePlan ? (
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                {t("user.workout.dashboard.hero.activeDescription")}
              </p>
            ) : (
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                {t("user.workout.dashboard.hero.noActiveDescription")}
              </p>
            )}
          </div>

          {hasActivePlan ? (
            <div className="workout-glass-card max-w-lg rounded-3xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-black">
                    {get(
                      activePlan,
                      "name",
                      t("user.workout.dashboard.hero.defaultPlanName"),
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("user.workout.dashboard.hero.weekDay", {
                      week: currentWeek,
                      day: currentDay,
                    })}
                  </p>
                </div>
                <p className="text-sm font-black text-primary">{progress}%</p>
              </div>
              <div className="mt-3">
                <ProgressBar value={progress || 68} />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {t("user.workout.dashboard.hero.todayFocus", {
                  focus: todayFocus,
                })}
              </p>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <MetricPill
              icon={Clock3Icon}
              value={hasActivePlan ? formatMetricDuration(durationSeconds || 92700) : "00:00:00"}
              label={t("user.workout.dashboard.metrics.duration")}
              tone="text-muted-foreground"
            />
            <MetricPill
              icon={FlameIcon}
              value={hasActivePlan ? formatNumber(calories || 782) : "0"}
              label={t("user.workout.dashboard.metrics.calories")}
            />
            <MetricPill
              icon={HeartPulseIcon}
              value={hasActivePlan ? (workoutCount > 0 ? "145" : "145") : "--"}
              label={t("user.workout.dashboard.metrics.averagePulse")}
              tone="text-red-500"
            />
            <MetricPill
              icon={TargetIcon}
              value={hasActivePlan ? `${Math.max(40, Math.min(100, workoutCount * 20))}%` : "0%"}
              label={t("user.workout.dashboard.metrics.efficiency")}
            />
          </div>

          <div className="mt-auto flex flex-wrap gap-3">
            <Button
              type="button"
              size="xl"
              className="rounded-2xl px-7"
              onClick={hasActivePlan ? onOpen : onCreate}
            >
              <PlayIcon data-icon="inline-start" />
              {hasActivePlan
                ? t("user.workout.dashboard.hero.startToday")
                : t("user.workout.dashboard.hero.choosePlan")}
            </Button>
            {!hasActivePlan ? (
              <Button
                type="button"
                variant="outline"
                size="xl"
                className="rounded-2xl border-white/10 bg-white/10"
                onClick={onCreatePlan}
              >
                {t("user.workout.dashboard.hero.createOwnPlan")}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
}

function TodayWorkoutStickyCta({
  item,
  hasActivePlan,
  onStart,
  onOpenPlans,
  t,
}) {
  const title = hasActivePlan
    ? get(item, "title", t("user.workout.dashboard.hero.title"))
    : t("user.workout.dashboard.hero.choosePlanTitle");

  return (
    <div
      data-testid="today-workout-sticky-cta"
      className="fixed inset-x-3 bottom-3 z-40 rounded-3xl border bg-background/95 p-3 shadow-2xl backdrop-blur xl:hidden"
    >
      <div className="flex items-center gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <DumbbellIcon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase text-muted-foreground">
            {t("user.workout.dashboard.sticky.eyebrow")}
          </p>
          <p className="truncate text-sm font-black">{title}</p>
        </div>
        <Button
          type="button"
          size="sm"
          className="shrink-0 rounded-2xl"
          onClick={hasActivePlan ? onStart : onOpenPlans}
        >
          <PlayIcon data-icon="inline-start" />
          {hasActivePlan
            ? t("user.workout.dashboard.sticky.start")
            : t("user.workout.dashboard.hero.choosePlan")}
        </Button>
      </div>
    </div>
  );
}

function RunningActivityCard({ activeSession, onPrimary, t, language }) {
  const session = activeSession ?? null;
  const metrics = getRunningMetrics(session);
  const isActive = Boolean(activeSession);
  const routePoints = isArray(get(session, "points"))
    ? get(session, "points")
    : [];
  const routePolyline = get(session, "route.polyline", null);
  const routeQualityScore = get(session, "metrics.gpsQualityScore", null);

  return (
    <Card className="relative min-h-[260px] overflow-hidden p-0">
      <RunMapPanel
        title={null}
        variant="preview"
        points={routePoints}
        polyline={routePolyline}
        qualityScore={routeQualityScore}
        emptyLabel={
          session
            ? t("user.workout.dashboard.running.mapWaiting")
            : t("user.workout.dashboard.running.mapEmpty")
        }
        showQuality={Boolean(session)}
        className="absolute inset-0 opacity-20 md:inset-y-0 md:left-auto md:right-0 md:w-[54%] md:opacity-100"
        surfaceClassName="h-full min-h-0 rounded-none md:h-full"
      />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-card via-card/95 to-card/65 md:to-card/10" />
      <CardContent className="relative z-10 flex min-h-[260px] max-w-3xl flex-col gap-6 p-8">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-black">
            {t("user.workout.dashboard.running.title")}
          </h2>
          <Badge
            variant="secondary"
            className={cn(
              "rounded-full px-4 py-1",
              isActive
                ? "bg-primary/10 text-primary"
                : "bg-green-500/10 text-green-600",
            )}
          >
            {t("user.workout.dashboard.activity.running")}
          </Badge>
        </div>

        <div className="grid size-16 place-items-center rounded-full bg-green-500/10 text-green-600">
          <RouteIcon className="size-8" />
        </div>

        {session ? (
          <div className="grid gap-5 sm:grid-cols-4">
            <MetricPill
              icon={RouteIcon}
              value={formatRunningDistance(metrics.distanceMeters)}
              label={t("user.workout.dashboard.metrics.distance")}
              tone="text-green-600"
            />
            <MetricPill
              icon={Clock3Icon}
              value={formatMetricDuration(metrics.durationSeconds)}
              label={t("user.workout.dashboard.metrics.duration")}
              tone="text-muted-foreground"
            />
            <MetricPill
              icon={GaugeIcon}
              value={formatPace(metrics.averagePaceSecondsPerKm)}
              label={t("user.workout.dashboard.metrics.averagePace")}
              tone="text-primary"
            />
            <MetricPill
              icon={FlameIcon}
              value={formatNumber(metrics.caloriesBurned)}
              label={t("user.workout.dashboard.metrics.calories")}
              tone="text-primary"
            />
          </div>
        ) : (
          <p className="max-w-md text-sm text-muted-foreground">
            {t("user.workout.dashboard.running.noSessionDescription")}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <MapPinIcon className="size-4" />
            {t("user.workout.dashboard.running.location")}
          </span>
          {isActive ? (
            <span>{formatActivityTime(get(session, "startedAt"), t, language)}</span>
          ) : null}
          <Button className="ml-auto rounded-2xl" onClick={onPrimary}>
            <PlayIcon data-icon="inline-start" />
            {isActive
              ? t("user.workout.dashboard.running.continue")
              : t("user.workout.dashboard.running.start")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function NoPlanDiscoverySection({
  onOpenPlans,
  onOpenRunning,
  onOpenExercises,
  onOpenReport,
  t,
}) {
  const quickLinks = [
    {
      label: t("user.workout.dashboard.discovery.planLabel"),
      description: t("user.workout.dashboard.discovery.planDescription"),
      icon: CalendarCheck2Icon,
      onClick: onOpenPlans,
      tone: "text-primary bg-primary/10",
    },
    {
      label: t("user.workout.dashboard.discovery.runningLabel"),
      description: t("user.workout.dashboard.discovery.runningDescription"),
      icon: RouteIcon,
      onClick: onOpenRunning,
      tone: "text-green-500 bg-green-500/10",
    },
    {
      label: t("user.workout.dashboard.discovery.exercisesLabel"),
      description: t("user.workout.dashboard.discovery.exercisesDescription"),
      icon: DumbbellIcon,
      onClick: onOpenExercises,
      tone: "text-blue-500 bg-blue-500/10",
    },
    {
      label: t("user.workout.dashboard.discovery.reportLabel"),
      description: t("user.workout.dashboard.discovery.reportDescription"),
      icon: GaugeIcon,
      onClick: onOpenReport,
      tone: "text-purple-500 bg-purple-500/10",
    },
  ];

  return (
    <Card className="workout-glass-card">
      <CardContent className="grid gap-6 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-900/10 pb-5 dark:border-white/10">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-2xl bg-green-500/10 text-green-500">
              <RouteIcon className="size-6" />
            </span>
            <div>
              <h2 className="text-xl font-black">Tezkor kirish</h2>
              <p className="text-sm text-muted-foreground">
                Sevimli funksiyalaringizga tezda o'ting
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {map(quickLinks, (item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.onClick}
                  className="flex min-w-32 items-center gap-3 rounded-2xl border border-slate-900/10 bg-white/55 px-4 py-3 text-left transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
                >
                  <span className={cn("grid size-9 place-items-center rounded-xl", item.tone)}>
                    <Icon className="size-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-black">{item.label}</span>
                    <span className="block text-xs text-muted-foreground">
                      {item.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">
              {t("user.workout.dashboard.discovery.recommendedTitle")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("user.workout.dashboard.discovery.recommendedSubtitle")}
            </p>
          </div>
          <Button variant="ghost" className="rounded-full text-primary" onClick={onOpenPlans}>
            {t("user.workout.dashboard.common.viewAll")}
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {map(take(WORKOUT_RECOMMENDED_PLANS, 3), (plan) => (
            <button
              key={plan.id}
              type="button"
              onClick={onOpenPlans}
              className="group grid min-h-32 grid-cols-[112px_1fr] overflow-hidden rounded-3xl border border-slate-900/10 bg-white/55 text-left transition hover:-translate-y-0.5 hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-white/10 dark:bg-white/[0.04]"
            >
              <img
                src={plan.coverImageUrl}
                alt={plan.name}
                className="h-full min-h-32 w-full object-cover"
                loading="lazy"
              />
              <span className="flex min-w-0 flex-col p-4">
                <span className="truncate text-sm font-black">{plan.name}</span>
                <span className="mt-1 text-xs text-muted-foreground">
                  {t("user.workout.dashboard.discovery.durationWeeks", {
                    count: plan.durationWeeks,
                  })}{" "}
                  • {plan.level}
                </span>
                <span className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                  {plan.description}
                </span>
                <span className="mt-auto inline-flex w-fit rounded-full border border-primary/25 px-4 py-1 text-xs font-black text-primary">
                  {t("user.workout.dashboard.discovery.select")}
                </span>
              </span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TodaySummaryCard({ weeklyStats, runningStats, activeSession, t }) {
  const activeRunningMetrics = getRunningMetrics(activeSession);
  const activeRunCount = activeSession?.workoutSessionId ? 1 : 0;
  const calories =
    clampMetric(get(weeklyStats, "calories", 0)) +
    clampMetric(activeRunningMetrics.caloriesBurned);
  const activityPercent = clampPercent(
    ((clampMetric(get(weeklyStats, "count", 0)) + activeRunCount) / 4) * 100,
  );
  const caloriePercent = clampPercent((calories / DAILY_CALORIE_GOAL) * 100);
  const distanceMeters =
    clampMetric(get(runningStats, "totalDistanceMeters", 0)) +
    clampMetric(activeRunningMetrics.distanceMeters);
  const durationSeconds =
    clampMetric(get(runningStats, "totalDurationSeconds", 0)) +
    clampMetric(activeRunningMetrics.durationSeconds);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("user.workout.dashboard.todaySummary.title")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid gap-6 sm:grid-cols-[160px_1fr] sm:items-center">
          <div
            className="grid size-36 place-items-center rounded-full"
            style={{
              background: `conic-gradient(var(--color-primary) ${
                caloriePercent * 3.6
              }deg, var(--color-muted) 0deg)`,
            }}
          >
            <div className="grid size-28 place-items-center rounded-full bg-background text-center">
              <div>
                <FlameIcon className="mx-auto size-5 text-primary" />
                <p className="mt-2 text-2xl font-black">
                  {formatNumber(calories)}
                </p>
                <p className="text-xs text-muted-foreground">kcal</p>
              </div>
            </div>
          </div>
          <div className="grid gap-5">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-muted-foreground">
                  {t("user.workout.dashboard.todaySummary.goal")}
                </span>
                <span>{formatNumber(DAILY_CALORIE_GOAL)} kcal</span>
              </div>
              <ProgressBar value={caloriePercent} />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-muted-foreground">
                  {t("user.workout.dashboard.todaySummary.activity")}
                </span>
                <span>{activityPercent}%</span>
              </div>
              <ProgressBar value={activityPercent} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <MetricPill
            icon={RouteIcon}
            value="--"
            label={t("user.workout.dashboard.todaySummary.steps")}
          />
          <MetricPill
            icon={MapPinIcon}
            value={formatRunningDistance(distanceMeters)}
            label={t("user.workout.dashboard.metrics.distance")}
          />
          <MetricPill
            icon={Clock3Icon}
            value={formatMetricDuration(durationSeconds)}
            label={t("user.workout.dashboard.todaySummary.activeTime")}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function WeatherCard({ weather, isLoading, isError, locationStatus, t }) {
  const weatherData = weather ?? {
    ...EMPTY_WEATHER,
    condition: t("user.workout.dashboard.weather.loadingCondition"),
    aqiLabel: t("user.workout.dashboard.weather.unknownAqi"),
  };
  const isFallbackLocation = locationStatus === "fallback";
  const location =
    isFallbackLocation && weatherData.location === "Current location"
      ? t("user.workout.dashboard.weather.fallbackLocation")
      : weatherData.location;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4">
        <CardTitle>{t("user.workout.dashboard.weather.title")}</CardTitle>
        <CloudSunIcon className="size-5 text-primary" />
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-4xl font-black">
              {isLoading ? "--" : formatTemperature(weatherData.temperatureC)}
            </p>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              {isError
                ? t("user.workout.dashboard.weather.unavailable")
                : weatherData.condition}
            </p>
          </div>
          <div className="grid size-16 place-items-center rounded-full bg-primary/10 text-primary">
            <ThermometerSunIcon className="size-8" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">His qilinadi</p>
            <p className="mt-1 font-black">{formatTemperature(weatherData.feelsLikeC)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Shamol</p>
            <p className="mt-1 font-black">
              {Number.isFinite(toNumber(weatherData.windKph))
                ? `${Math.round(toNumber(weatherData.windKph))} km/h`
                : "--"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Namlik</p>
            <p className="mt-1 font-black">
              {Number.isFinite(toNumber(weatherData.humidity))
                ? `${Math.round(toNumber(weatherData.humidity))}%`
                : "--"}
            </p>
          </div>
        </div>
        <div className="rounded-2xl border bg-muted/30 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">
                {t("user.workout.dashboard.weather.airQuality")}
              </p>
              <p className="mt-1 text-2xl font-black">
                AQI {weatherData.aqi ?? "--"}
              </p>
            </div>
            <Badge variant="secondary" className="rounded-full">
              {weatherData.aqiLabel}
            </Badge>
          </div>
          <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <MapPinIcon className="size-3.5" />
            {location}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function WeeklyStatsCard({
  completed,
  target,
  completedDates,
  weeklyStats,
  runningStats,
  onOpenHistory,
  t,
}) {
  const days = React.useMemo(
    () => getWeekDays(completedDates, t),
    [completedDates, t],
  );
  const progress =
    target > 0 ? Math.min(100, Math.round((completed / target) * 100)) : 0;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4">
        <CardTitle>{t("user.workout.dashboard.weekly.title")}</CardTitle>
        <Button variant="ghost" className="rounded-full" onClick={onOpenHistory}>
          {t("user.workout.dashboard.common.viewAll")}
        </Button>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid grid-cols-7 gap-2">
          {map(days, (day) => (
            <div key={`${day.label}-${day.day}`} className="text-center">
              <p className="text-sm font-semibold text-muted-foreground">
                {day.label}
              </p>
              <div
                className={cn(
                  "mx-auto mt-3 grid size-8 place-items-center rounded-full text-sm font-black",
                  day.done
                    ? "bg-primary text-primary-foreground"
                    : day.isToday
                      ? "border border-primary text-primary"
                      : "text-muted-foreground",
                )}
              >
                {day.done ? <CheckCircle2Icon className="size-5" /> : "–"}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t pt-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="font-black">
              {t("user.workout.dashboard.weekly.progress", {
                completed,
                target,
              })}
            </p>
            <p className="font-black">{progress}%</p>
          </div>
          <ProgressBar value={progress} />
        </div>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-sm text-muted-foreground">
              {t("user.workout.dashboard.weekly.workouts")}
            </p>
            <p className="mt-1 text-xl font-black">{completed}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {t("user.workout.dashboard.weekly.time")}
            </p>
            <p className="mt-1 text-xl font-black">
              {formatMetricDuration((toNumber(get(weeklyStats, "duration", 0)) || 0) * 60)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {t("user.workout.dashboard.metrics.calories")}
            </p>
            <p className="mt-1 text-xl font-black">
              {formatNumber(get(weeklyStats, "calories", 0))}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {t("user.workout.dashboard.metrics.distance")}
            </p>
            <p className="mt-1 text-xl font-black">
              {formatRunningDistance(get(runningStats, "totalDistanceMeters", 0))}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function GoalsCard({ weeklyStats, runningStats, t }) {
  const calories = clampMetric(get(weeklyStats, "calories", 0));
  const calorieProgress = clampPercent((calories / DAILY_CALORIE_GOAL) * 100);
  const distanceMeters = clampMetric(get(runningStats, "totalDistanceMeters", 0));
  const distanceProgress = clampPercent(
    (distanceMeters / WEEKLY_DISTANCE_GOAL_METERS) * 100,
  );

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4">
        <CardTitle>{t("user.workout.dashboard.goals.title")}</CardTitle>
        <Button variant="ghost" className="rounded-full">
          {t("user.workout.dashboard.goals.edit")}
        </Button>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="grid grid-cols-[44px_1fr_auto] items-center gap-4">
          <div className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
            <FlameIcon className="size-6" />
          </div>
          <div>
            <p className="font-semibold">
              {t("user.workout.dashboard.goals.calorieGoal")}
            </p>
            <p className="text-lg font-black">
              {formatNumber(calories)} / {formatNumber(DAILY_CALORIE_GOAL)} kcal
            </p>
            <div className="mt-2">
              <ProgressBar value={calorieProgress} />
            </div>
          </div>
          <p className="font-semibold text-muted-foreground">{calorieProgress}%</p>
        </div>
        <div className="grid grid-cols-[44px_1fr_auto] items-center gap-4">
          <div className="grid size-11 place-items-center rounded-full bg-green-500/10 text-green-600">
            <RouteIcon className="size-6" />
          </div>
          <div>
            <p className="font-semibold">
              {t("user.workout.dashboard.goals.weeklyDistance")}
            </p>
            <p className="text-lg font-black">
              {formatRunningDistance(distanceMeters)} / 40 km
            </p>
            <div className="mt-2">
              <ProgressBar value={distanceProgress} className="bg-green-500" />
            </div>
          </div>
          <p className="font-semibold text-muted-foreground">{distanceProgress}%</p>
        </div>
      </CardContent>
    </Card>
  );
}

function AchievementsCard({ personalRecordCount, t }) {
  const achievementCount = clampMetric(personalRecordCount);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4">
        <CardTitle>{t("user.workout.dashboard.achievements.title")}</CardTitle>
        <Button variant="ghost" className="rounded-full">
          {t("user.workout.dashboard.common.viewAll")}
        </Button>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-4">
        {achievementCount <= 0 ? (
          <div className="flex min-h-14 items-center gap-3 rounded-2xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            <TrophyIcon className="size-5 text-primary" aria-hidden="true" />
            <span>{t("user.workout.dashboard.achievements.empty")}</span>
          </div>
        ) : (
          <>
            {map(
              [TrophyIcon, MedalIcon, TargetIcon, CalendarCheck2Icon],
              (Icon, index) => (
                <div
                  key={index}
                  className={cn(
                    "grid size-14 place-items-center rounded-full border text-primary shadow-sm",
                    index === 1
                      ? "bg-violet-500/10 text-violet-600"
                      : index === 2
                        ? "bg-amber-500/10 text-amber-600"
                        : "bg-primary/10",
                  )}
                >
                  <Icon className="size-7" />
                </div>
              ),
            )}
            <div className="grid size-14 place-items-center rounded-full border bg-background text-sm font-black">
              +{achievementCount}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function StreakCard({ streak, t }) {
  const currentDays = clampMetric(get(streak, "currentDays", 0));
  const bestDays = clampMetric(get(streak, "bestDays", currentDays));

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4">
        <CardTitle>{t("user.workout.dashboard.streak.title")}</CardTitle>
        <div className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
          <FlameIcon className="size-5" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-black">
          {t("user.workout.dashboard.streak.days", { count: currentDays })}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("user.workout.dashboard.streak.best", { count: bestDays })}
        </p>
      </CardContent>
    </Card>
  );
}

function RecoveryCard({ recovery, t }) {
  const status = get(recovery, "status", "no_data");
  const score = clampPercent(get(recovery, "score", 0));
  const recommendation =
    get(recovery, "recommendation") ||
    t("user.workout.dashboard.recovery.fallbackRecommendation");
  const statusLabel = t(`user.workout.dashboard.recovery.status.${status}`, {
    defaultValue: t("user.workout.dashboard.recovery.status.no_data"),
  });

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4">
        <CardTitle>{t("user.workout.dashboard.recovery.title")}</CardTitle>
        <div className="grid size-10 place-items-center rounded-full bg-green-500/10 text-green-600">
          <HeartPulseIcon className="size-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-3">
          <p className="text-xl font-black text-green-600">{statusLabel}</p>
          <p className="text-lg font-black">{score}%</p>
        </div>
        <div className="mt-3">
          <ProgressBar value={score} className="bg-green-500" />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{recommendation}</p>
      </CardContent>
    </Card>
  );
}

function RecentActivitiesCard({
  activities,
  onOpenHistory,
  onOpenActivity,
  t,
  language,
}) {
  return (
    <Card className="overflow-hidden p-0">
      <CardHeader className="px-8 pt-8">
        <CardTitle>{t("user.workout.dashboard.recent.title")}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {activities.length === 0 ? (
          <div className="px-8 py-10 text-sm text-muted-foreground">
            {t("user.workout.dashboard.recent.empty")}
          </div>
        ) : null}
        {map(activities, (activity) => (
          <div
            key={`${activity.type}-${activity.id}`}
            role="button"
            tabIndex={0}
            onClick={() => onOpenActivity(activity)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onOpenActivity(activity);
              }
            }}
            className="grid cursor-pointer grid-cols-[88px_1fr_auto] items-center gap-4 border-t px-8 py-4 text-left outline-none transition-colors hover:bg-muted/40 focus-visible:bg-muted/50 focus-visible:ring-1 focus-visible:ring-ring"
          >
            {activity.type === "running" ? (
              <div aria-hidden="true" className="pointer-events-none h-16 overflow-hidden rounded-xl">
                <RunMapPanel
                  title={null}
                  variant="preview"
                  points={activity.routePoints}
                  polyline={activity.routePolyline}
                  qualityScore={activity.routeQualityScore}
                  emptyLabel={t("user.workout.dashboard.recent.routeWaiting")}
                  showQuality={Boolean(
                    activity.routePolyline || activity.routePoints?.length,
                  )}
                  className="h-full"
                  surfaceClassName="h-full min-h-0 rounded-xl md:h-full"
                />
              </div>
            ) : (
              <img
                src={activity.image}
                alt={activity.title}
                className="h-16 w-full rounded-xl object-cover"
                loading="lazy"
              />
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "grid size-8 place-items-center rounded-full",
                    activity.type === "running"
                      ? "bg-green-500/10 text-green-600"
                      : "bg-primary/10 text-primary",
                  )}
                >
                  {activity.type === "running" ? (
                    <RouteIcon className="size-4" />
                  ) : (
                    <DumbbellIcon className="size-4" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-muted-foreground">
                    {activity.subtitle}
                  </p>
                  <h3 className="truncate text-lg font-black">{activity.title}</h3>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                {map(activity.metrics, (metric, index) => {
                  const Icon = metric.icon;
                  return (
                    <span key={index} className="inline-flex items-center gap-1.5">
                      <Icon className="size-4" />
                      {metric.label}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="hidden text-right text-sm text-muted-foreground sm:block">
              <p>{formatActivityTime(activity.sortDate, t, language)}</p>
              <MoreHorizontalIcon className="ml-auto mt-3 size-5" />
            </div>
          </div>
        ))}
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 border-t px-6 py-4 text-sm font-black text-primary transition-colors hover:bg-muted/40"
          onClick={onOpenHistory}
        >
          {t("user.workout.dashboard.common.viewAll")}
          <ArrowRightIcon className="size-4" />
        </button>
      </CardContent>
    </Card>
  );
}

const WorkoutDashboardPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const { overview: workoutOverview } = useWorkoutOverview();
  const { sessions: sessionHistory } = useWorkoutSessionHistory({ limit: 6 });
  const { activePlan: rawActivePlan, startPlan } = useWorkoutPlan();
  const { activeSession } = useRunningActiveSession();
  const { sessions: runningSessions } = useRunningSessions({ limit: 4 });
  const { stats: runningStats = {} } = useRunningStatsSummary();
  const { startRunningSession } = useStartRunningSession();
  const {
    weather,
    isLoading: isWeatherLoading,
    isError: isWeatherError,
    locationStatus,
  } = useWorkoutWeatherToday();
  const activePlan = React.useMemo(
    () => deriveWorkoutPlanMetrics(rawActivePlan),
    [rawActivePlan],
  );
  const hasActivePlan = Boolean(activePlan);
  const nextWorkouts = React.useMemo(
    () => buildNextWorkouts(activePlan, new Date(), t, i18n.resolvedLanguage),
    [activePlan, i18n.resolvedLanguage, t],
  );
  const featuredWorkout = nextWorkouts[0] ?? null;
  const activities = React.useMemo(
    () => buildActivityFeed(sessionHistory, runningSessions, t),
    [runningSessions, sessionHistory, t],
  );

  const completedDates = React.useMemo(
    () =>
      isArray(get(workoutOverview, "recentWorkoutDays"))
        ? filter(map(workoutOverview.recentWorkoutDays, (item) => getWorkoutDayDateKey(item)), Boolean)
        : [],
    [workoutOverview],
  );

  const targetWorkouts =
    toNumber(get(activePlan, "daysPerWeek")) ||
    toNumber(get(workoutOverview, "weeklyStats.target")) ||
    4;
  const completedWorkouts = Math.min(
    targetWorkouts,
    toNumber(get(workoutOverview, "weeklyStats.count")) ||
      toNumber(get(activePlan, "completedWorkouts")) ||
      0,
  );

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user", title: t("user.dashboard.breadcrumbs.home") },
      { url: "/user/workout", title: t("user.workout.title") },
    ]);
  }, [setBreadcrumbs, t]);

  const openPlans = React.useCallback(() => {
    navigate("/user/workout/plans");
  }, [navigate]);

  const openExercises = React.useCallback(() => {
    navigate("/user/workout/exercises");
  }, [navigate]);

  const openReport = React.useCallback(() => {
    navigate("/user/workout/report");
  }, [navigate]);

  const openHistory = React.useCallback(() => {
    navigate("/user/workout/history");
  }, [navigate]);

  const openActivity = React.useCallback(
    (activity) => {
      if (!activity?.href) {
        return;
      }

      navigate(activity.href);
    },
    [navigate],
  );

  const createPlan = React.useCallback(() => {
    navigate("/user/workout/plans/create");
  }, [navigate]);

  const handleStartSession = React.useCallback(
    async (targetWorkout = null) => {
      if (!activePlan) {
        navigate("/user/workout/plans");
        return;
      }

      try {
        if (
          get(activePlan, "status") !== WORKOUT_PLAN_STATUS.active &&
          get(activePlan, "id")
        ) {
          await startPlan(activePlan);
        }

        const nextWorkoutDayIndex =
          Number.isInteger(get(targetWorkout, "dayIndex")) &&
          get(targetWorkout, "dayIndex") >= 0
            ? get(targetWorkout, "dayIndex")
            : getNextStartableDayIndex(activePlan);
        const fallbackWorkoutDayIndex = getFirstWorkoutDayIndex(
          get(activePlan, "schedule", []),
        );
        const resolvedDayIndex =
          nextWorkoutDayIndex >= 0
            ? nextWorkoutDayIndex
            : fallbackWorkoutDayIndex >= 0
              ? fallbackWorkoutDayIndex
              : 0;

        if (
          Number.isInteger(get(targetWorkout, "dayIndex")) &&
          isWorkoutDayLocked(activePlan, resolvedDayIndex)
        ) {
          navigate(
            `/user/workout/plans/${get(activePlan, "id")}/days/${resolvedDayIndex}`,
          );
          return;
        }

        navigate(
          `/user/workout/plans/${get(activePlan, "id")}/days/${resolvedDayIndex}/session`,
        );
      } catch (error) {
        toast.error(
          get(error, "response.data.message") ||
            t("user.workout.dashboard.toast.startSessionError"),
        );
      }
    },
    [activePlan, navigate, startPlan, t],
  );

  const handleRunningPrimary = React.useCallback(async () => {
    if (activeSession?.workoutSessionId) {
      navigate(`/user/workout/running/live/${activeSession.workoutSessionId}`);
      return;
    }

    try {
      const session = await startRunningSession({ source: "home" });
      const workoutSessionId = get(session, "workoutSessionId", get(session, "id"));

      if (workoutSessionId) {
        navigate(`/user/workout/running/live/${workoutSessionId}`);
        return;
      }

      navigate("/user/workout/history");
    } catch (error) {
      toast.error(
        get(error, "response.data.message") ||
          t("user.workout.dashboard.toast.startRunError"),
      );
    }
  }, [activeSession, navigate, startRunningSession, t]);

  return (
    <PageTransition mode="slide-up">
      <div className="workout-page-surface mx-auto flex w-full max-w-[1600px] flex-col gap-6 pb-28 xl:pb-4">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_520px]">
          <main className="flex min-w-0 flex-col gap-6">
            <TodayWorkoutHero
              item={featuredWorkout}
              activePlan={activePlan}
              weeklyStats={get(workoutOverview, "weeklyStats", {})}
              onOpen={() => handleStartSession(featuredWorkout)}
              onCreate={openPlans}
              onCreatePlan={createPlan}
              t={t}
            />
            {!hasActivePlan ? (
              <NoPlanDiscoverySection
                onOpenPlans={openPlans}
                onOpenRunning={handleRunningPrimary}
                onOpenExercises={openExercises}
                onOpenReport={openReport}
                t={t}
              />
            ) : null}
            <RunningActivityCard
              activeSession={activeSession}
              onPrimary={handleRunningPrimary}
              t={t}
              language={i18n.resolvedLanguage}
            />
            <RecentActivitiesCard
              activities={activities}
              onOpenHistory={openHistory}
              onOpenActivity={openActivity}
              t={t}
              language={i18n.resolvedLanguage}
            />
          </main>

          <aside className="flex min-w-0 flex-col gap-6 xl:sticky xl:top-6 xl:self-start">
            <TodaySummaryCard
              weeklyStats={get(workoutOverview, "weeklyStats", {})}
              runningStats={runningStats}
              activeSession={activeSession}
              t={t}
            />
            <WeatherCard
              weather={weather}
              isLoading={isWeatherLoading || locationStatus === "requesting"}
              isError={isWeatherError}
              locationStatus={locationStatus}
              t={t}
            />
            <WeeklyStatsCard
              completed={completedWorkouts}
              target={targetWorkouts}
              completedDates={completedDates}
              weeklyStats={get(workoutOverview, "weeklyStats", {})}
              runningStats={runningStats}
              onOpenHistory={openHistory}
              t={t}
            />
            <GoalsCard
              weeklyStats={get(workoutOverview, "weeklyStats", {})}
              runningStats={runningStats}
              t={t}
            />
            <AchievementsCard
              personalRecordCount={get(workoutOverview, "personalRecordCount", 0)}
              t={t}
            />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <StreakCard streak={get(workoutOverview, "streak", {})} t={t} />
              <RecoveryCard
                recovery={get(workoutOverview, "recovery", {})}
                t={t}
              />
            </div>
          </aside>
        </div>
        <TodayWorkoutStickyCta
          item={featuredWorkout}
          hasActivePlan={hasActivePlan}
          onStart={() => handleStartSession(featuredWorkout)}
          onOpenPlans={openPlans}
          t={t}
        />
      </div>
    </PageTransition>
  );
};

export default WorkoutDashboardPage;
