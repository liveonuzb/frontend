import React from "react";
import { get, map, sumBy } from "lodash";
import { useNavigate } from "react-router";
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  DumbbellIcon,
  FlameIcon,
  HistoryIcon,
  TimerIcon,
} from "lucide-react";
import PageLoader from "@/components/page-loader/index.jsx";
import PageTransition from "@/components/page-transition";
import { TrackingPageHeader } from "@/components/tracking-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWorkoutPlans } from "@/hooks/app/use-workout-plans";
import { useWorkoutSessionHistory } from "@/hooks/app/use-workout-sessions";
import { useBreadcrumbStore } from "@/store";

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

const formatDuration = (seconds) => {
  const totalMinutes = Math.max(0, Math.round((Number(seconds) || 0) / 60));
  return `${totalMinutes} daqiqa`;
};

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
  const [year, month] = String(monthKey).split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
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
  const uniqueDays = Array.from(
    new Set(
      sessions
        .map((item) => getDateKey(get(item, "endedAt")))
        .filter(Boolean),
    ),
  ).sort((a, b) => (a > b ? -1 : 1));

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
  { key: "all", label: "Barchasi" },
  { key: "7d", label: "7 kun" },
  { key: "30d", label: "30 kun" },
];

const buildMonthlyBuckets = (sessions, monthsCount = 6) => {
  const now = new Date();
  const buckets = [];

  for (let offset = monthsCount - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const monthKey = getMonthKey(date);
    const monthSessions = sessions.filter(
      (item) => getMonthKey(get(item, "endedAt")) === monthKey,
    );

    buckets.push({
      monthKey,
      label: formatMonthLabel(monthKey),
      sessions: monthSessions.length,
      minutes: Math.round(
        sumBy(monthSessions, (item) => Number(item.durationSeconds || 0)) / 60,
      ),
      calories: sumBy(monthSessions, (item) => Number(item.estimatedCalories || 0)),
      volume: sumBy(monthSessions, (item) => Number(item.totalVolumeKg || 0)),
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

  plans.forEach((plan) => {
    if (String(get(plan, "status", "")).toUpperCase() !== "ACTIVE") {
      return;
    }

    const planStart = toStartOfDay(get(plan, "startDate") || get(plan, "createdAt"));
    if (!planStart) {
      return;
    }

    const schedule = Array.isArray(get(plan, "schedule")) ? get(plan, "schedule") : [];
    const progress = Array.isArray(get(plan, "dayProgress")) ? get(plan, "dayProgress") : [];

    schedule.forEach((day, index) => {
      const exercises = Array.isArray(get(day, "exercises")) ? get(day, "exercises") : [];
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
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const { sessions, isLoading, isError, refetch } = useWorkoutSessionHistory();
  const { items: workoutPlans } = useWorkoutPlans();
  const [period, setPeriod] = React.useState("all");

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user", title: "Bosh sahifa" },
      { url: "/user/workout", title: "Workout" },
      { url: "/user/workout/history", title: "Tarix" },
    ]);
  }, [setBreadcrumbs]);

  const filteredSessions = React.useMemo(() => {
    if (period === "7d") {
      return sessions.filter((item) => isWithinLastDays(get(item, "endedAt"), 7));
    }

    if (period === "30d") {
      return sessions.filter((item) => isWithinLastDays(get(item, "endedAt"), 30));
    }

    return sessions;
  }, [period, sessions]);

  const overview = React.useMemo(
    () => ({
      totalSessions: filteredSessions.length,
      totalMinutes: Math.round(
        sumBy(filteredSessions, (item) => Number(item.durationSeconds || 0)) / 60,
      ),
      totalCalories: sumBy(filteredSessions, (item) => Number(item.estimatedCalories || 0)),
      totalVolumeKg: sumBy(filteredSessions, (item) => Number(item.totalVolumeKg || 0)),
      streak: calculateCurrentStreak(sessions),
    }),
    [filteredSessions, sessions],
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
        <Card>
          <CardHeader>
            <CardTitle>Workout tarixi yuklanmadi</CardTitle>
            <CardDescription>
              Session tarixini olishda xatolik yuz berdi.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button onClick={() => refetch()}>Qayta urinish</Button>
            <Button variant="outline" onClick={() => navigate("/user/workout")}>
              Workout sahifasi
            </Button>
          </CardContent>
        </Card>
      </PageTransition>
    );
  }

  return (
    <PageTransition mode="slide-up">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <TrackingPageHeader
          title="Workout tarixi"
          subtitle="Yakunlangan mashg'ulotlar, davomiylik va yuklama."
          hideTitleOnMobile={false}
          actions={
            <Button variant="outline" onClick={() => navigate("/user/workout")}>
              <ArrowLeftIcon data-icon="inline-start" />
              Workout
            </Button>
          }
        />

        {sessions.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Hali yakunlangan mashg'ulot yo'q</CardTitle>
              <CardDescription>
                Birinchi sessiyani yakunlaganingizdan keyin tarix shu yerda ko'rinadi.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Button onClick={() => navigate("/user/workout/plans")}>
                Rejalarni ko'rish
              </Button>
              <Button variant="outline" onClick={() => navigate("/user/workout/plans/create")}>
                Yangi plan yaratish
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {PERIODS.map((item) => (
                <Button
                  key={item.key}
                  type="button"
                  variant={period === item.key ? "default" : "secondary"}
                  className="rounded-full"
                  onClick={() => setPeriod(item.key)}
                >
                  {item.label}
                </Button>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <Card className="rounded-3xl">
                <CardContent className="p-5">
                  <p className="text-xs text-muted-foreground">Sessiyalar</p>
                  <p className="mt-2 text-3xl font-black">{overview.totalSessions}</p>
                </CardContent>
              </Card>
              <Card className="rounded-3xl">
                <CardContent className="p-5">
                  <p className="text-xs text-muted-foreground">Davomiyligi</p>
                  <p className="mt-2 text-3xl font-black">{overview.totalMinutes} min</p>
                </CardContent>
              </Card>
              <Card className="rounded-3xl">
                <CardContent className="p-5">
                  <p className="text-xs text-muted-foreground">Calories</p>
                  <p className="mt-2 text-3xl font-black">{overview.totalCalories} kcal</p>
                </CardContent>
              </Card>
              <Card className="rounded-3xl">
                <CardContent className="p-5">
                  <p className="text-xs text-muted-foreground">Volume</p>
                  <p className="mt-2 text-3xl font-black">{overview.totalVolumeKg} kg</p>
                </CardContent>
              </Card>
              <Card className="rounded-3xl">
                <CardContent className="p-5">
                  <p className="text-xs text-muted-foreground">Streak</p>
                  <p className="mt-2 inline-flex items-center gap-2 text-3xl font-black">
                    <HistoryIcon className="size-5 text-primary" />
                    {overview.streak} kun
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.15fr_1fr]">
              <Card className="rounded-[2rem]">
                <CardHeader>
                  <CardTitle>Ushbu oy</CardTitle>
                  <CardDescription>
                    Aktiv rejalardagi bajarilgan va o‘tkazib yuborilgan mashg‘ulotlar.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-4">
                  <div className="rounded-3xl bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">Rejalashtirilgan</p>
                    <p className="mt-2 text-2xl font-black">
                      {missedSummary.scheduledThisMonth}
                    </p>
                  </div>
                  <div className="rounded-3xl bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">Bajarilgan</p>
                    <p className="mt-2 text-2xl font-black">
                      {missedSummary.completedThisMonth}
                    </p>
                  </div>
                  <div className="rounded-3xl bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">Missed</p>
                    <p className="mt-2 text-2xl font-black">
                      {missedSummary.missedWorkouts}
                    </p>
                  </div>
                  <div className="rounded-3xl bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">Rate</p>
                    <p className="mt-2 text-2xl font-black">
                      {missedSummary.completionRate}%
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[2rem]">
                <CardHeader>
                  <CardTitle>Oylik ko‘rinish</CardTitle>
                  <CardDescription>
                    So‘nggi 6 oy bo‘yicha sessiya, kcal va volume dinamikasi.
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
                          {bucket.minutes} min · {bucket.calories} kcal
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Sessiya</p>
                        <p className="font-black">{bucket.sessions}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Volume</p>
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
              {map(filteredSessions, (session) => (
                <button
                  key={get(session, "id")}
                  type="button"
                  onClick={() =>
                    navigate(`/user/workout/history/${get(session, "id")}`)
                  }
                  className="w-full rounded-3xl border bg-card text-left shadow-sm transition hover:border-primary/40 hover:bg-primary/5"
                >
                  <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-black">
                          {get(session, "focus") || get(session, "planName") || "Workout"}
                        </h2>
                        <Badge variant="outline">
                          Day {(Number(get(session, "planDayIndex")) || 0) + 1}
                        </Badge>
                        <Badge variant="secondary">
                          <CheckCircle2Icon />
                          Yakunlandi
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {get(session, "planName") || "Workout plan"}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDaysIcon className="size-4" />
                          {formatDateTime(get(session, "endedAt"))}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <TimerIcon className="size-4" />
                          {formatDuration(get(session, "durationSeconds"))}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <FlameIcon className="size-4" />
                          {get(session, "estimatedCalories", 0)} kcal
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 sm:min-w-60">
                      <div className="rounded-2xl bg-muted/30 px-3 py-3 text-center">
                        <p className="text-xs text-muted-foreground">Set</p>
                        <p className="mt-1 font-black">
                          {get(session, "completedSets", 0)}/{get(session, "totalSets", 0)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-muted/30 px-3 py-3 text-center">
                        <p className="text-xs text-muted-foreground">Mashq</p>
                        <p className="mt-1 font-black">
                          {get(session, "completedExerciseCount", 0)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-muted/30 px-3 py-3 text-center">
                        <p className="text-xs text-muted-foreground">Volume</p>
                        <p className="mt-1 font-black">{get(session, "totalVolumeKg", 0)} kg</p>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </PageTransition>
  );
};

export default SessionHistoryPage;
