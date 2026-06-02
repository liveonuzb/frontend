import React from "react";
import { useTranslation } from "react-i18next";
import findIndex from "lodash/findIndex";
import get from "lodash/get";
import map from "lodash/map";
import sumBy from "lodash/sumBy";
import isArray from "lodash/isArray";
import toNumber from "lodash/toNumber";
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

const formatDuration = (minutes, t) =>
  t("user.workout.sessionSummary.durationValue", {
    count: toNumber(minutes || 0),
  });

const SessionSummaryCard = ({ title, value, hint, icon: Icon, tone }) => (
  <div className="rounded-3xl border bg-card p-4">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="mt-2 text-xl font-black">{value}</p>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-2xl ${tone}`}>
        <Icon className="size-5" />
      </span>
    </div>
  </div>
);

const WorkoutPlanSessionSummaryPage = () => {
  const { planId, dayIndex: dayIndexParam } = useParams();
  const { t } = useTranslation();
  const dayIndex = toNumber(dayIndexParam);
  const location = useLocation();
  const navigate = useNavigate();
  const { plan } = useWorkoutPlanDetail(planId, {
    enabled: Boolean(planId),
  });
  const summary =
    get(location, "state.summary") || readStoredSummary(planId, dayIndex);
  const nextWorkoutDayIndex = React.useMemo(() => {
    const schedule = isArray(get(plan, "schedule")) ? get(plan, "schedule") : [];

    return findIndex(
      schedule,
      (day, index) =>
        index > dayIndex &&
        isArray(get(day, "exercises")) &&
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
        <Card className="py-6">
          <CardHeader>
            <CardTitle>
              {t("user.workout.sessionSummary.notFoundTitle")}
            </CardTitle>
            <CardDescription>
              {t("user.workout.sessionSummary.notFoundDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button variant="outline" onClick={handleBackToDay}>
              <ArrowLeftIcon data-icon="inline-start" />
              {t("user.workout.sessionSummary.backToDay")}
            </Button>
            <Button onClick={handleBackToPlan}>
              {t("user.workout.sessionSummary.planPage")}
            </Button>
          </CardContent>
        </Card>
      </PageTransition>
    );
  }

  const exerciseSummaries = isArray(summary.exerciseSummaries)
    ? summary.exerciseSummaries
    : [];
  const skippedExercises = isArray(summary.skippedExercises)
    ? summary.skippedExercises
    : [];
  const skippedExerciseCount = Math.max(
    0,
    toNumber(get(summary, "skippedExerciseCount", skippedExercises.length)) || 0,
  );
  const distanceMeters = sumBy(exerciseSummaries, (item) => toNumber(item?.distanceMeters || 0));

  return (
    <PageTransition mode="slide-up">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <Card className="overflow-hidden rounded-[2rem] border-0 py-6 shadow-sm ring-1 ring-border">
          <div className="bg-primary/10 px-5 py-6">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <Badge variant="secondary" className="bg-primary/15 text-primary">
                  {t("user.workout.sessionSummary.dayBadge", {
                    day: dayIndex + 1,
                  })}
                </Badge>
                <div>
                  <h1 className="text-3xl font-black">
                    {t("user.workout.sessionSummary.title")}
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {get(summary, "focus") ||
                      get(summary, "planName") ||
                      t("user.workout.sessionSummary.workoutFallback")}
                  </p>
                </div>
              </div>
              <CheckCircle2Icon className="size-9 text-primary" />
            </div>
          </div>

          <CardContent className="space-y-5 p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <SessionSummaryCard
                title={t("user.workout.sessionSummary.duration")}
                value={formatDuration(summary.durationMinutes, t)}
                hint={t("user.workout.sessionSummary.durationHint")}
                icon={TimerIcon}
                tone="bg-primary/10 text-primary"
              />
              <SessionSummaryCard
                title={t("user.workout.sessionSummary.calories")}
                value={`${summary.estimatedCalories || 0} kcal`}
                hint={t("user.workout.sessionSummary.caloriesHint")}
                icon={FlameIcon}
                tone="bg-orange-500/10 text-orange-500"
              />
              <SessionSummaryCard
                title={t("user.workout.sessionSummary.completedSets")}
                value={`${summary.completedSets || 0}/${summary.totalSets || 0}`}
                hint={t("user.workout.sessionSummary.completedExerciseHint", {
                  count: summary.completedExerciseCount || 0,
                })}
                icon={CheckCircle2Icon}
                tone="bg-emerald-500/10 text-emerald-600"
              />
              <SessionSummaryCard
                title={t("user.workout.sessionSummary.volume")}
                value={`${summary.totalVolumeKg || 0} kg`}
                hint={t("user.workout.sessionSummary.volumeHint")}
                icon={GaugeIcon}
                tone="bg-sky-500/10 text-sky-600"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground">
                  {t("user.workout.sessionSummary.exercises")}
                </p>
                <p className="mt-2 text-2xl font-black">{summary.exerciseCount || 0}</p>
              </div>
              <div className="rounded-3xl border bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground">
                  {t("user.workout.sessionSummary.distance")}
                </p>
                <p className="mt-2 text-2xl font-black">{distanceMeters} m</p>
              </div>
              <div className="rounded-3xl border bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground">
                  {t("user.workout.sessionSummary.plan")}
                </p>
                <p className="mt-2 line-clamp-2 text-base font-black">
                  {summary.planName ||
                    t("user.workout.sessionSummary.planFallback")}
                </p>
              </div>
            </div>

            {skippedExerciseCount > 0 ? (
              <div className="space-y-3 rounded-3xl border bg-muted/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-black">
                      {t("user.workout.sessionSummary.skippedTitle")}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {t("user.workout.sessionSummary.skippedDescription")}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {t("user.workout.sessionSummary.skippedCount", {
                      count: skippedExerciseCount,
                    })}
                  </Badge>
                </div>
                {skippedExercises.length > 0 ? (
                  <div className="space-y-2">
                    {map(skippedExercises, (item, index) => (
                      <div
                        key={
                          item.exerciseKey ||
                          item.id ||
                          item.exerciseName ||
                          `skipped-${index}`
                        }
                        className="flex items-center justify-between gap-3 rounded-2xl bg-background px-3 py-2"
                      >
                        <p className="min-w-0 truncate text-sm font-bold">
                          {item.exerciseName ||
                            item.name ||
                            t("user.workout.sessionSummary.exerciseFallback")}
                        </p>
                        <Badge variant="outline">
                          {t("user.workout.sessionSummary.skipped")}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-3">
              <div>
                <h2 className="text-lg font-black">
                  {t("user.workout.sessionSummary.completedExercises")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t("user.workout.sessionSummary.completedDescription")}
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
                  {t("user.workout.sessionSummary.nextDay")}
                </Button>
              ) : (
                <Button size="lg" onClick={handleBackToDay}>
                  {t("user.workout.sessionSummary.backToDay")}
                </Button>
              )}
              <Button variant="outline" size="lg" onClick={handleBackToPlan}>
                {t("user.workout.sessionSummary.planPage")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
};

export default WorkoutPlanSessionSummaryPage;
