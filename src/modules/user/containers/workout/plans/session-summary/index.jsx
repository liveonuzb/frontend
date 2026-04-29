import React from "react";
import { findIndex, get, map, sumBy } from "lodash";
import { useLocation, useNavigate, useParams } from "react-router";
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  DumbbellIcon,
  FlameIcon,
  GaugeIcon,
  TimerIcon,
} from "lucide-react";
import PageTransition from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SessionSummaryCard from "@/components/coach-sessions/session-summary-card";
import { Badge } from "@/components/ui/badge";
import { useWorkoutPlanDetail } from "@/hooks/app/use-workout-plans";

const getSummaryStorageKey = (planId, dayIndex) =>
  `liveon:workout-session-summary:${planId}:${dayIndex}`;

const readStoredSummary = (planId, dayIndex) => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.sessionStorage.getItem(
      getSummaryStorageKey(planId, dayIndex),
    );
    return rawValue ? JSON.parse(rawValue) : null;
  } catch {
    return null;
  }
};

const clearStoredSummary = (planId, dayIndex) => {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(getSummaryStorageKey(planId, dayIndex));
};

const formatDuration = (minutes) => `${Number(minutes || 0)} daqiqa`;

const WorkoutPlanSessionSummaryPage = () => {
  const { planId, dayIndex: dayIndexParam } = useParams();
  const dayIndex = Number(dayIndexParam);
  const location = useLocation();
  const navigate = useNavigate();
  const { plan } = useWorkoutPlanDetail(planId, {
    enabled: Boolean(planId),
  });
  const summary =
    get(location, "state.summary") || readStoredSummary(planId, dayIndex);
  const nextWorkoutDayIndex = React.useMemo(() => {
    const schedule = Array.isArray(get(plan, "schedule")) ? get(plan, "schedule") : [];

    return findIndex(
      schedule,
      (day, index) =>
        index > dayIndex &&
        Array.isArray(get(day, "exercises")) &&
        get(day, "exercises.length") > 0,
    );
  }, [dayIndex, plan]);

  const handleBackToDay = React.useCallback(() => {
    clearStoredSummary(planId, dayIndex);
    navigate(`/user/workout/plans/${planId}/days/${dayIndex}`, { replace: true });
  }, [dayIndex, navigate, planId]);

  const handleBackToPlan = React.useCallback(() => {
    clearStoredSummary(planId, dayIndex);
    navigate(`/user/workout/plans/${planId}`, { replace: true });
  }, [dayIndex, navigate, planId]);

  if (!summary) {
    return (
      <PageTransition mode="slide-up">
        <Card>
          <CardHeader>
            <CardTitle>Session summary topilmadi</CardTitle>
            <CardDescription>
              Mashg'ulot yakuni ma'lumotlari saqlanmagan.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button variant="outline" onClick={handleBackToDay}>
              <ArrowLeftIcon data-icon="inline-start" />
              Kunga qaytish
            </Button>
            <Button onClick={handleBackToPlan}>Plan sahifasi</Button>
          </CardContent>
        </Card>
      </PageTransition>
    );
  }

  const exerciseSummaries = Array.isArray(summary.exerciseSummaries)
    ? summary.exerciseSummaries
    : [];
  const distanceMeters = sumBy(exerciseSummaries, (item) => Number(item?.distanceMeters || 0));

  return (
    <PageTransition mode="slide-up">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <Card className="overflow-hidden rounded-[2rem] border-0 shadow-sm ring-1 ring-border">
          <div className="bg-primary/10 px-5 py-6">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <Badge variant="secondary" className="bg-primary/15 text-primary">
                  Day {dayIndex + 1}
                </Badge>
                <div>
                  <h1 className="text-3xl font-black">Mashg'ulot yakunlandi</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {get(summary, "focus") || get(summary, "planName") || "Workout"}
                  </p>
                </div>
              </div>
              <CheckCircle2Icon className="size-9 text-primary" />
            </div>
          </div>

          <CardContent className="space-y-5 p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <SessionSummaryCard
                title="Davomiyligi"
                value={formatDuration(summary.durationMinutes)}
                hint="Umumiy mashg'ulot vaqti"
                icon={TimerIcon}
                tone="bg-primary/10 text-primary"
              />
              <SessionSummaryCard
                title="Calories"
                value={`${summary.estimatedCalories || 0} kcal`}
                hint="Taxminiy sarf"
                icon={FlameIcon}
                tone="bg-orange-500/10 text-orange-500"
              />
              <SessionSummaryCard
                title="Bajarilgan setlar"
                value={`${summary.completedSets || 0}/${summary.totalSets || 0}`}
                hint={`${summary.completedExerciseCount || 0} mashq yakunlandi`}
                icon={CheckCircle2Icon}
                tone="bg-emerald-500/10 text-emerald-600"
              />
              <SessionSummaryCard
                title="Volume"
                value={`${summary.totalVolumeKg || 0} kg`}
                hint="Reps × weight yig'indisi"
                icon={GaugeIcon}
                tone="bg-sky-500/10 text-sky-600"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground">Mashqlar</p>
                <p className="mt-2 text-2xl font-black">{summary.exerciseCount || 0}</p>
              </div>
              <div className="rounded-3xl border bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground">Masofa</p>
                <p className="mt-2 text-2xl font-black">{distanceMeters} m</p>
              </div>
              <div className="rounded-3xl border bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground">Plan</p>
                <p className="mt-2 line-clamp-2 text-base font-black">
                  {summary.planName || "Workout plan"}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h2 className="text-lg font-black">Bajarilgan mashqlar</h2>
                <p className="text-sm text-muted-foreground">
                  Har bir mashq bo'yicha bajarilgan setlar ko'rinadi.
                </p>
              </div>
              <div className="space-y-2">
                {map(exerciseSummaries, (item) => (
                  <div
                    key={item.exerciseKey}
                    className="flex items-start gap-3 rounded-3xl border bg-card px-4 py-3"
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <DumbbellIcon className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-black">
                        {item.exerciseName}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.completedSets} set · {item.totalReps} reps · {item.totalVolumeKg} kg
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {nextWorkoutDayIndex >= 0 ? (
                <Button
                  size="lg"
                  onClick={() =>
                    navigate(`/user/workout/plans/${planId}/days/${nextWorkoutDayIndex}`)
                  }
                >
                  Keyingi kunni ko'rish
                </Button>
              ) : (
                <Button size="lg" onClick={handleBackToDay}>
                  Kunga qaytish
                </Button>
              )}
              <Button variant="outline" size="lg" onClick={handleBackToPlan}>
                Plan sahifasi
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
};

export default WorkoutPlanSessionSummaryPage;
