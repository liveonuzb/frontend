import React from "react";
import { get } from "lodash";
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
import { useWorkoutSessionHistory } from "@/hooks/app/use-workout-sessions";
import {
  useRunningActiveSession,
  useRunningSessions,
  useRunningStatsSummary,
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

  return date.toISOString().split("T")[0];
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

const formatWorkoutRecommendationLabel = (date, now = new Date()) => {
  const targetDate = toStartOfDay(date);
  const today = toStartOfDay(now);

  if (!targetDate || !today) {
    return "Tavsiya etiladi";
  }

  const diffDays = Math.round((targetDate - today) / 86400000);

  if (diffDays === 0) {
    return "Bugun";
  }

  if (diffDays === 1) {
    return "Ertaga";
  }

  return new Intl.DateTimeFormat("uz-UZ", {
    day: "numeric",
    month: "short",
  }).format(targetDate);
};

const getWeekDays = (completedDates = []) => {
  const labels = ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"];
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

const countPlanExercises = (plan) =>
  get(plan, "schedule", []).reduce(
    (total, day) => total + get(day, "exercises", []).length,
    0,
  );

const getPlanImage = (plan, index = 0) =>
  get(plan, "generationMeta.heroImage") ||
  get(plan, "image") ||
  [IMAGE_SET.athlete, IMAGE_SET.athleteAlt, IMAGE_SET.dumbbell][index % 3];

const buildNextWorkouts = (activePlan, now = new Date()) => {
  const schedule = get(activePlan, "schedule", []);
  const nextStartableDayIndex = getNextStartableDayIndex(activePlan);
  const firstWorkoutDayIndex = getFirstWorkoutDayIndex(schedule);
  const completedDayIndexes = new Set(
    (Array.isArray(get(activePlan, "dayProgress"))
      ? get(activePlan, "dayProgress")
      : []
    )
      .filter((item) => Boolean(get(item, "completed")))
      .map((item) => Number(get(item, "dayIndex"))),
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

  return schedule
    .map((day, dayIndex) => ({ day, dayIndex }))
    .filter(
      ({ day, dayIndex }) =>
        dayIndex >= Math.max(0, startDayIndex) &&
        get(day, "exercises", []).length > 0,
    )
    .slice(0, 3)
    .map(({ day, dayIndex }, index) => {
      const recommendedDate = addDays(
        initialRecommendedDate,
        dayIndex - Math.max(0, startDayIndex),
      );

      return {
        id: `${get(activePlan, "id", "active")}-${dayIndex}`,
        dayIndex,
        isStartable: !isWorkoutDayLocked(activePlan, dayIndex),
        title: get(day, "title") || get(day, "name") || `Day ${dayIndex + 1}`,
        time: formatWorkoutRecommendationLabel(recommendedDate, now),
        image:
          get(day, "exercises[0].imageUrl") ||
          get(day, "exercises[0].image") ||
          getPlanImage(activePlan, index),
        exerciseCount: get(day, "exercises", []).length,
      };
    });
};

const formatNumber = (value = 0) =>
  new Intl.NumberFormat("en-US").format(Math.round(Number(value) || 0));

const formatMetricDuration = (seconds = 0) => {
  const totalSeconds = Math.max(0, Number(seconds) || 0);
  if (totalSeconds <= 0) {
    return "0:00";
  }
  return formatRunningDuration(totalSeconds);
};

const formatPace = (secondsPerKm) => {
  const pace = Number(secondsPerKm);
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
  Number.isFinite(Number(value)) ? `${Math.round(Number(value))}°C` : "--";

const getRunningMetrics = (session) => ({
  distanceMeters: Number(get(session, "metrics.distanceMeters", 0)) || 0,
  durationSeconds: Number(get(session, "metrics.durationSeconds", 0)) || 0,
  caloriesBurned: Number(get(session, "metrics.caloriesBurned", 0)) || 0,
  averagePaceSecondsPerKm: get(session, "metrics.averagePaceSecondsPerKm"),
});

const getWorkoutDurationSeconds = (session) =>
  Number(get(session, "durationSeconds")) ||
  Number(get(session, "elapsedSeconds")) ||
  Number(get(session, "durationMinutes", 0)) * 60 ||
  0;

const getWorkoutCalories = (session) =>
  Number(
    get(
      session,
      "burnedCalories",
      get(session, "caloriesBurned", get(session, "calories", 0)),
    ),
  ) || 0;

const getActivityTimestamp = (activity) =>
  Date.parse(activity.sortDate || activity.endedAt || activity.startedAt || "") || 0;

const formatActivityTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Bugun";
  }

  const todayKey = getDateKey(new Date());
  const dateKey = getDateKey(date);
  const time = new Intl.DateTimeFormat("uz-UZ", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  if (dateKey === todayKey) {
    return `Bugun, ${time}`;
  }

  return `Kecha, ${time}`;
};

const buildActivityFeed = (workoutSessions = [], runningSessions = []) => {
  const workoutItems = workoutSessions.slice(0, 4).map((session, index) => ({
    id: get(session, "id", `workout-${index}`),
    type: "workout",
    title:
      get(session, "title") ||
      get(session, "planDayTitle") ||
      get(session, "planName") ||
      "Full Body Strength",
    subtitle: "Workout",
    image: get(session, "image") || get(session, "imageUrl") || IMAGE_SET.dumbbell,
    sortDate: get(session, "endedAt") || get(session, "startedAt"),
    metrics: [
      { icon: Clock3Icon, label: formatMetricDuration(getWorkoutDurationSeconds(session)) },
      { icon: FlameIcon, label: `${formatNumber(getWorkoutCalories(session))} kcal` },
      {
        icon: HeartPulseIcon,
        label: `${Number(get(session, "averageHeartRate", 0)) || 145} bpm`,
      },
    ],
  }));

  const runningItems = runningSessions.slice(0, 4).map((session, index) => {
    const metrics = getRunningMetrics(session);

    return {
      id: get(session, "workoutSessionId", `run-${index}`),
      type: "running",
      title: get(session, "title") || "Morning Run",
      subtitle: "Yugurish",
      image: IMAGE_SET.map,
      sortDate: get(session, "endedAt") || get(session, "startedAt"),
      metrics: [
        { icon: RouteIcon, label: formatRunningDistance(metrics.distanceMeters) },
        { icon: Clock3Icon, label: formatMetricDuration(metrics.durationSeconds) },
        { icon: GaugeIcon, label: formatPace(metrics.averagePaceSecondsPerKm) },
      ],
    };
  });

  return [...workoutItems, ...runningItems]
    .sort((left, right) => getActivityTimestamp(right) - getActivityTimestamp(left))
    .slice(0, 3);
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

function TodayWorkoutHero({ item, activePlan, weeklyStats, onOpen, onCreate }) {
  const hasWorkout = Boolean(item);
  const title = hasWorkout
    ? item.title
    : activePlan
      ? get(activePlan, "name", "Workout plan")
      : "Workout reja tanlang";
  const image = hasWorkout ? item.image : getPlanImage(activePlan);
  const workoutCount = Number(get(weeklyStats, "count", 0)) || 0;
  const durationSeconds = (Number(get(weeklyStats, "duration", 0)) || 0) * 60;
  const calories = Number(get(weeklyStats, "calories", 0)) || 0;

  return (
    <Card className="overflow-hidden p-0">
      <div
        role="button"
        tabIndex={0}
        className="group relative min-h-[300px] cursor-pointer overflow-hidden p-8 outline-none"
        onClick={hasWorkout ? onOpen : onCreate}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            (hasWorkout ? onOpen : onCreate)();
          }
        }}
      >
        <img
          src={image}
          alt={title}
          className="absolute inset-y-0 right-0 h-full w-full object-cover md:w-[48%]"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/92 to-background/20" />
        <div className="relative z-10 flex h-full max-w-3xl flex-col gap-7">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-black tracking-normal md:text-3xl">
              Bugungi mashg'ulot
            </h1>
            <Badge variant="secondary" className="rounded-full px-4 py-1">
              Workout
            </Badge>
          </div>

          <div className="grid size-16 place-items-center rounded-full bg-primary/10 text-primary">
            <DumbbellIcon className="size-8" />
          </div>

          <div>
            <p className="text-sm font-semibold text-muted-foreground">
              {item?.time || "Reja holati"}
            </p>
            <h2 className="mt-1 text-3xl font-black leading-tight">{title}</h2>
            {!hasWorkout ? (
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Faol plan yo‘q. Reja yaratganingizdan keyin keyingi mashg‘ulot
                shu yerda ko‘rinadi.
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricPill
              icon={Clock3Icon}
              value={formatMetricDuration(durationSeconds)}
              label="Davomiylik"
              tone="text-muted-foreground"
            />
            <MetricPill
              icon={FlameIcon}
              value={formatNumber(calories)}
              label="Kaloriya"
            />
            <MetricPill
              icon={HeartPulseIcon}
              value={workoutCount > 0 ? "145" : "--"}
              label="O'rtacha puls"
              tone="text-red-500"
            />
            <MetricPill
              icon={TargetIcon}
              value={`${Math.min(100, workoutCount * 20)}%`}
              label="Samaradorlik"
            />
          </div>

          <Button
            className="mt-auto w-fit rounded-2xl px-8"
            onClick={(event) => {
              event.stopPropagation();
              (hasWorkout ? onOpen : onCreate)();
            }}
          >
            Batafsil ko'rish
          </Button>
        </div>
      </div>
    </Card>
  );
}

function RunningActivityCard({ activeSession, latestRun, onPrimary }) {
  const session = activeSession || latestRun;
  const metrics = getRunningMetrics(session);
  const isActive = Boolean(activeSession);
  const routePoints = Array.isArray(get(session, "points"))
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
            ? "GPS nuqtalar kutilmoqda"
            : "Yugurishni boshlanganda xarita shu yerda ko'rinadi"
        }
        showQuality={Boolean(session)}
        className="absolute inset-0 opacity-20 md:inset-y-0 md:left-auto md:right-0 md:w-[54%] md:opacity-100"
        surfaceClassName="h-full min-h-0 rounded-none md:h-full"
      />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-card via-card/95 to-card/65 md:to-card/10" />
      <CardContent className="relative z-10 flex min-h-[260px] max-w-3xl flex-col gap-6 p-8">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-black">So'nggi faoliyat</h2>
          <Badge
            variant="secondary"
            className={cn(
              "rounded-full px-4 py-1",
              isActive
                ? "bg-primary/10 text-primary"
                : "bg-green-500/10 text-green-600",
            )}
          >
            Yugurish
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
              label="Masofa"
              tone="text-green-600"
            />
            <MetricPill
              icon={Clock3Icon}
              value={formatMetricDuration(metrics.durationSeconds)}
              label="Davomiylik"
              tone="text-muted-foreground"
            />
            <MetricPill
              icon={GaugeIcon}
              value={formatPace(metrics.averagePaceSecondsPerKm)}
              label="O'rtacha temp"
              tone="text-primary"
            />
            <MetricPill
              icon={FlameIcon}
              value={formatNumber(metrics.caloriesBurned)}
              label="Kaloriya"
              tone="text-primary"
            />
          </div>
        ) : (
          <p className="max-w-md text-sm text-muted-foreground">
            Hali yugurish sessiyasi yo‘q. Running dashboard orqali birinchi
            outdoor mashg‘ulotni boshlang.
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <MapPinIcon className="size-4" />
            Toshkent, O'zbekiston
          </span>
          <span>{formatActivityTime(get(session, "startedAt"))}</span>
          <Button className="ml-auto rounded-2xl" onClick={onPrimary}>
            <PlayIcon data-icon="inline-start" />
            {isActive ? "Davom ettirish" : "Yugurishni boshlash"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TodaySummaryCard({ weeklyStats, runningStats }) {
  const calories = Number(get(weeklyStats, "calories", 0)) || 0;
  const activityPercent = Math.min(
    100,
    Math.round(((Number(get(weeklyStats, "count", 0)) || 0) / 4) * 100),
  );
  const caloriePercent = Math.min(
    100,
    Math.round((calories / DAILY_CALORIE_GOAL) * 100),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bugun</CardTitle>
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
                  Maqsad
                </span>
                <span>{formatNumber(DAILY_CALORIE_GOAL)} kcal</span>
              </div>
              <ProgressBar value={caloriePercent} />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-muted-foreground">
                  Faollik
                </span>
                <span>{activityPercent}%</span>
              </div>
              <ProgressBar value={activityPercent} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <MetricPill icon={RouteIcon} value="--" label="Qadamlar" />
          <MetricPill
            icon={MapPinIcon}
            value={formatRunningDistance(get(runningStats, "totalDistanceMeters", 0))}
            label="Masofa"
          />
          <MetricPill
            icon={Clock3Icon}
            value={formatMetricDuration(get(runningStats, "totalDurationSeconds", 0))}
            label="Faol vaqt"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function WeatherCard({ weather, isLoading, isError, locationStatus }) {
  const isFallbackLocation = locationStatus === "fallback";
  const location =
    isFallbackLocation && weather.location === "Current location"
      ? "Tashkent"
      : weather.location;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4">
        <CardTitle>Bugungi ob-havo</CardTitle>
        <CloudSunIcon className="size-5 text-primary" />
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-4xl font-black">
              {isLoading ? "--" : formatTemperature(weather.temperatureC)}
            </p>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              {isError ? "Ob-havo vaqtincha mavjud emas" : weather.condition}
            </p>
          </div>
          <div className="grid size-16 place-items-center rounded-full bg-primary/10 text-primary">
            <ThermometerSunIcon className="size-8" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">His qilinadi</p>
            <p className="mt-1 font-black">{formatTemperature(weather.feelsLikeC)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Shamol</p>
            <p className="mt-1 font-black">
              {Number.isFinite(Number(weather.windKph))
                ? `${Math.round(Number(weather.windKph))} km/h`
                : "--"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Namlik</p>
            <p className="mt-1 font-black">
              {Number.isFinite(Number(weather.humidity))
                ? `${Math.round(Number(weather.humidity))}%`
                : "--"}
            </p>
          </div>
        </div>
        <div className="rounded-2xl border bg-muted/30 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Havo sifati</p>
              <p className="mt-1 text-2xl font-black">
                AQI {weather.aqi ?? "--"}
              </p>
            </div>
            <Badge variant="secondary" className="rounded-full">
              {weather.aqiLabel}
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
}) {
  const days = React.useMemo(
    () => getWeekDays(completedDates),
    [completedDates],
  );
  const progress =
    target > 0 ? Math.min(100, Math.round((completed / target) * 100)) : 0;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4">
        <CardTitle>Haftalik statistika</CardTitle>
        <Button variant="ghost" className="rounded-full" onClick={onOpenHistory}>
          Barchasini ko'rish
        </Button>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => (
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
              {completed}/{target} mashg'ulot
            </p>
            <p className="font-black">{progress}%</p>
          </div>
          <ProgressBar value={progress} />
        </div>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-sm text-muted-foreground">Mashg'ulotlar</p>
            <p className="mt-1 text-xl font-black">{completed}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Vaqt</p>
            <p className="mt-1 text-xl font-black">
              {formatMetricDuration((Number(get(weeklyStats, "duration", 0)) || 0) * 60)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Kaloriya</p>
            <p className="mt-1 text-xl font-black">
              {formatNumber(get(weeklyStats, "calories", 0))}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Masofa</p>
            <p className="mt-1 text-xl font-black">
              {formatRunningDistance(get(runningStats, "totalDistanceMeters", 0))}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function GoalsCard({ weeklyStats, runningStats }) {
  const calories = Number(get(weeklyStats, "calories", 0)) || 0;
  const calorieProgress = Math.min(
    100,
    Math.round((calories / DAILY_CALORIE_GOAL) * 100),
  );
  const distanceMeters = Number(get(runningStats, "totalDistanceMeters", 0)) || 0;
  const distanceProgress = Math.min(
    100,
    Math.round((distanceMeters / WEEKLY_DISTANCE_GOAL_METERS) * 100),
  );

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4">
        <CardTitle>Maqsadlar</CardTitle>
        <Button variant="ghost" className="rounded-full">
          Tahrirlash
        </Button>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="grid grid-cols-[44px_1fr_auto] items-center gap-4">
          <div className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
            <FlameIcon className="size-6" />
          </div>
          <div>
            <p className="font-semibold">Kaloriya maqsadi</p>
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
            <p className="font-semibold">Haftalik masofa</p>
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

function AchievementsCard({ personalRecordCount }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4">
        <CardTitle>Yutuqlar</CardTitle>
        <Button variant="ghost" className="rounded-full">
          Barchasini ko'rish
        </Button>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        {[TrophyIcon, MedalIcon, TargetIcon, CalendarCheck2Icon].map(
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
          +{Math.max(0, Number(personalRecordCount) || 0)}
        </div>
      </CardContent>
    </Card>
  );
}

function RecentActivitiesCard({ activities, onOpenHistory }) {
  return (
    <Card className="overflow-hidden p-0">
      <CardHeader className="px-8 pt-8">
        <CardTitle>So'nggi mashg'ulotlar</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {activities.length === 0 ? (
          <div className="px-8 py-10 text-sm text-muted-foreground">
            Hali mashg‘ulot tarixi yo‘q. Workout yoki running boshlaganingizdan
            keyin ular shu yerda ko‘rinadi.
          </div>
        ) : null}
        {activities.map((activity) => (
          <div
            key={`${activity.type}-${activity.id}`}
            className="grid grid-cols-[88px_1fr_auto] items-center gap-4 border-t px-8 py-4"
          >
            <img
              src={activity.image}
              alt={activity.title}
              className="h-16 w-full rounded-xl object-cover"
              loading="lazy"
            />
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
                {activity.metrics.map((metric, index) => {
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
              <p>{formatActivityTime(activity.sortDate)}</p>
              <MoreHorizontalIcon className="ml-auto mt-3 size-5" />
            </div>
          </div>
        ))}
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 border-t px-6 py-4 text-sm font-black text-primary transition-colors hover:bg-muted/40"
          onClick={onOpenHistory}
        >
          Barchasini ko'rish
          <ArrowRightIcon className="size-4" />
        </button>
      </CardContent>
    </Card>
  );
}

const WorkoutDashboardPage = () => {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const { overview: workoutOverview } = useWorkoutOverview();
  const { sessions: sessionHistory } = useWorkoutSessionHistory();
  const { activePlan: rawActivePlan, startPlan } = useWorkoutPlan();
  const { activeSession } = useRunningActiveSession();
  const { sessions: runningSessions } = useRunningSessions({ limit: 4 });
  const { stats: runningStats = {} } = useRunningStatsSummary();
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
  const nextWorkouts = React.useMemo(
    () => buildNextWorkouts(activePlan),
    [activePlan],
  );
  const featuredWorkout = nextWorkouts[0] ?? null;
  const latestRun = runningSessions[0] ?? null;
  const activities = React.useMemo(
    () => buildActivityFeed(sessionHistory, runningSessions),
    [runningSessions, sessionHistory],
  );

  const completedDates = React.useMemo(
    () =>
      Array.isArray(get(workoutOverview, "recentWorkoutDays"))
        ? workoutOverview.recentWorkoutDays
            .map((item) => item?.date)
            .filter(Boolean)
        : [],
    [workoutOverview],
  );

  const targetWorkouts =
    Number(get(activePlan, "daysPerWeek")) ||
    Number(get(workoutOverview, "weeklyStats.target")) ||
    4;
  const completedWorkouts = Math.min(
    targetWorkouts,
    Number(get(workoutOverview, "weeklyStats.count")) ||
      Number(get(activePlan, "completedWorkouts")) ||
      0,
  );

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user", title: "Bosh sahifa" },
      { url: "/user/workout", title: "Workout" },
    ]);
  }, [setBreadcrumbs]);

  const openPlans = React.useCallback(() => {
    navigate("/user/workout/plans");
  }, [navigate]);

  const openHistory = React.useCallback(() => {
    navigate("/user/workout/history");
  }, [navigate]);

  const createPlan = React.useCallback(() => {
    navigate("/user/workout/plans/create");
  }, [navigate]);

  const handleStartSession = React.useCallback(
    async (targetWorkout = null) => {
      if (!activePlan) {
        navigate("/user/workout/plans/create");
        return;
      }

      try {
        if (get(activePlan, "status") !== "active" && get(activePlan, "id")) {
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
            "Sessiyani boshlashda xatolik yuz berdi",
        );
      }
    },
    [activePlan, navigate, startPlan],
  );

  const handleRunningPrimary = React.useCallback(() => {
    if (activeSession?.workoutSessionId) {
      navigate(`/user/workout/running/live/${activeSession.workoutSessionId}`);
      return;
    }

    navigate("/user/workout/running");
  }, [activeSession, navigate]);

  return (
    <PageTransition mode="slide-up">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 pb-4">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_520px]">
          <main className="flex min-w-0 flex-col gap-6">
            <TodayWorkoutHero
              item={featuredWorkout}
              activePlan={activePlan}
              weeklyStats={get(workoutOverview, "weeklyStats", {})}
              onOpen={() => handleStartSession(featuredWorkout)}
              onCreate={openPlans}
            />
            <RunningActivityCard
              activeSession={activeSession}
              latestRun={latestRun}
              onPrimary={handleRunningPrimary}
            />
            <RecentActivitiesCard
              activities={activities}
              onOpenHistory={openHistory}
            />
          </main>

          <aside className="flex min-w-0 flex-col gap-6 xl:sticky xl:top-6 xl:self-start">
            <TodaySummaryCard
              weeklyStats={get(workoutOverview, "weeklyStats", {})}
              runningStats={runningStats}
            />
            <WeatherCard
              weather={weather}
              isLoading={isWeatherLoading || locationStatus === "requesting"}
              isError={isWeatherError}
              locationStatus={locationStatus}
            />
            <WeeklyStatsCard
              completed={completedWorkouts}
              target={targetWorkouts}
              completedDates={completedDates}
              weeklyStats={get(workoutOverview, "weeklyStats", {})}
              runningStats={runningStats}
              onOpenHistory={openHistory}
            />
            <GoalsCard
              weeklyStats={get(workoutOverview, "weeklyStats", {})}
              runningStats={runningStats}
            />
            <AchievementsCard
              personalRecordCount={get(workoutOverview, "personalRecordCount", 0)}
            />
          </aside>
        </div>
      </div>
    </PageTransition>
  );
};

export default WorkoutDashboardPage;
