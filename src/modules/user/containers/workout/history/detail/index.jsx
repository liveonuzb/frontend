import React from "react";
import { useTranslation } from "react-i18next";
import { filter, get, isArray, map, size, toNumber } from "lodash";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  DumbbellIcon,
  FlameIcon,
  GaugeIcon,
  RouteIcon,
  TimerIcon,
} from "lucide-react";
import PageLoader from "@/components/page-loader/index.jsx";
import PageTransition from "@/components/page-transition";
import { TrackingPageHeader, TrackingPageLayout } from "@/components/tracking-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useWorkoutSessionHistory,
  useWorkoutSessionHistoryItem,
} from "@/hooks/app/use-workout-sessions";
import { formatRunningDistance, formatRunningPace } from "@/lib/running-metrics";
import {
  getWorkoutSessionDistanceMeters,
  getWorkoutSessionPaceSecondsPerKm,
  isOutdoorRunningSession,
} from "@/lib/workout-session-metrics";
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

const formatDuration = (seconds, t) => {
  const totalMinutes = Math.max(0, Math.round((toNumber(seconds) || 0) / 60));
  return t("user.workout.historyDetail.durationValue", {
    count: totalMinutes,
  });
};

const getRenderableExercises = (session) => {
  const detailedExercises = isArray(get(session, "exercises"))
    ? get(session, "exercises")
    : [];
  const skippedExercises = isArray(get(session, "skippedExercises"))
    ? get(session, "skippedExercises")
    : [];
  const skippedRenderableExercises = map(skippedExercises, (exercise, index) => ({
    key:
      get(exercise, "exerciseKey") ||
      get(exercise, "id") ||
      get(exercise, "exerciseName") ||
      get(exercise, "name") ||
      `skipped-${index}`,
    name: get(exercise, "exerciseName") || get(exercise, "name"),
    equipment: get(exercise, "equipment"),
    completedSets: get(exercise, "completedSets", 0),
    totalSets: get(exercise, "totalSets", 0),
    totalReps: get(exercise, "totalReps", 0),
    totalVolumeKg: get(exercise, "totalVolumeKg", 0),
    distanceMeters: get(exercise, "distanceMeters", 0),
    skipped: true,
    sets: isArray(get(exercise, "sets")) ? get(exercise, "sets") : [],
  }));

  if (detailedExercises.length > 0) {
    const renderableExercises = map(detailedExercises, (exercise, index) => ({
      key:
        get(exercise, "id") ||
        get(exercise, "exerciseKey") ||
        get(exercise, "name") ||
        `exercise-${index}`,
      name: get(exercise, "exerciseName") || get(exercise, "name"),
      equipment: get(exercise, "equipment"),
      completedSets: get(exercise, "completedSets", 0),
      totalSets: get(exercise, "totalSets", 0),
      totalReps: get(exercise, "totalReps", 0),
      totalVolumeKg: get(exercise, "totalVolumeKg", 0),
      distanceMeters: get(exercise, "distanceMeters", 0),
      skipped: Boolean(get(exercise, "skipped")),
      sets: isArray(get(exercise, "sets")) ? get(exercise, "sets") : [],
    }));
    const renderedKeys = new Set(map(renderableExercises, (item) => get(item, "key")));
    const missingSkippedExercises = filter(
      skippedRenderableExercises,
      (item) => !renderedKeys.has(get(item, "key")),
    );

    return [...renderableExercises, ...missingSkippedExercises];
  }

  return [
    ...map(get(session, "exerciseSummaries", []), (item, index) => ({
      key:
        get(item, "exerciseKey") ||
        get(item, "exerciseName") ||
        `summary-${index}`,
      name: get(item, "exerciseName"),
      equipment: null,
      completedSets: get(item, "completedSets", 0),
      totalSets: get(item, "completedSets", 0),
      totalReps: get(item, "totalReps", 0),
      totalVolumeKg: get(item, "totalVolumeKg", 0),
      distanceMeters: get(item, "distanceMeters", 0),
      skipped: false,
      sets: [],
    })),
    ...skippedRenderableExercises,
  ];
};

const SessionHistoryDetailPage = () => {
  const { t } = useTranslation();
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const { session, isLoading, isError, refetch } = useWorkoutSessionHistoryItem(sessionId);
  const { sessions } = useWorkoutSessionHistory({ enabled: false });

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user", title: t("user.workout.plansList.breadcrumbs.home") },
      {
        url: "/user/workout",
        title: t("user.workout.plansList.breadcrumbs.workout"),
      },
      {
        url: "/user/workout/history",
        title: t("user.workout.history.breadcrumb"),
      },
      {
        url: `/user/workout/history/${sessionId}`,
        title: t("user.workout.historyDetail.session"),
      },
    ]);
  }, [sessionId, setBreadcrumbs, t]);

  const relatedPlanPath = React.useMemo(() => {
    const planId = get(session, "planId");
    const dayIndex = get(session, "planDayIndex");
    if (!planId || dayIndex === null || dayIndex === undefined) {
      return null;
    }

    return `/user/workout/plans/${planId}/days/${dayIndex}`;
  }, [session]);

  const previousSessionId = React.useMemo(() => {
    const index = sessions.findIndex((item) => get(item, "id") === sessionId);
    if (index < 0 || index === sessions.length - 1) {
      return null;
    }

    return get(sessions[index + 1], "id") || null;
  }, [sessionId, sessions]);
  const renderableExercises = React.useMemo(
    () => getRenderableExercises(session),
    [session],
  );
  const skippedExerciseCount = Math.max(
    toNumber(get(session, "skippedExerciseCount", 0)) || 0,
    size(filter(renderableExercises, (item) => get(item, "skipped"))),
  );
  const isRunning = isOutdoorRunningSession(session);
  const distanceMeters = getWorkoutSessionDistanceMeters(session);
  const paceSecondsPerKm = getWorkoutSessionPaceSecondsPerKm(session);

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError || !session) {
    return (
      <PageTransition mode="slide-up">
        <Card>
          <CardHeader>
            <CardTitle>{t("user.workout.historyDetail.notFoundTitle")}</CardTitle>
            <CardDescription>
              {t("user.workout.historyDetail.notFoundDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button onClick={() => refetch()}>
              {t("user.workout.historyDetail.retry")}
            </Button>
            <Button variant="outline" onClick={() => navigate("/user/workout/history")}>
              {t("user.workout.historyDetail.backToHistory")}
            </Button>
          </CardContent>
        </Card>
      </PageTransition>
    );
  }

  if (isRunning) {
    return (
      <PageTransition mode="slide-up">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <TrackingPageHeader
            title={get(session, "focus") || t("user.workout.historyDetail.outdoorRun")}
            subtitle={t("user.workout.historyDetail.runningSubtitle")}
            hideTitleOnMobile={false}
            actions={
              <Button variant="outline" onClick={() => navigate("/user/workout/history")}>
                <ArrowLeftIcon data-icon="inline-start" />
                {t("user.workout.historyDetail.history")}
              </Button>
            }
          />

          <TrackingPageLayout
            aside={
              <div className="space-y-4">
                <Card className="rounded-[2rem]">
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">
                        <RouteIcon />
                        {t("user.workout.historyDetail.running")}
                      </Badge>
                      <Badge variant="secondary">
                        <CheckCircle2Icon />
                        {t("user.workout.historyDetail.completed")}
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl font-black">
                      {t("user.workout.historyDetail.gpsRunningSession")}
                    </CardTitle>
                    <CardDescription>
                      {formatDateTime(get(session, "endedAt"))}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p className="inline-flex items-center gap-2">
                      <CalendarDaysIcon className="size-4" />
                      {formatDateTime(get(session, "endedAt"))}
                    </p>
                    <p className="inline-flex items-center gap-2">
                      <TimerIcon className="size-4" />
                      {formatDuration(get(session, "durationSeconds"), t)}
                    </p>
                    <p className="inline-flex items-center gap-2">
                      <FlameIcon className="size-4" />
                      {get(session, "estimatedCalories", 0)} kcal
                    </p>
                  </CardContent>
                </Card>

                {previousSessionId ? (
                  <Card className="rounded-[2rem]">
                    <CardHeader className="pb-3">
                    <CardTitle className="text-base font-black">
                      {t("user.workout.historyDetail.previousSession")}
                    </CardTitle>
                    <CardDescription>
                      {t("user.workout.historyDetail.previousDescription")}
                    </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate(`/user/workout/history/${previousSessionId}`)}
                      >
                        {t("user.workout.historyDetail.openPrevious")}
                      </Button>
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            }
          >
            <Card className="rounded-[2rem]">
              <CardHeader>
                <CardTitle>{t("user.workout.historyDetail.runningSummary")}</CardTitle>
                <CardDescription>
                  {t("user.workout.historyDetail.runningSummaryDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-3xl bg-muted/30 p-5">
                  <p className="text-xs text-muted-foreground">
                    {t("user.workout.historyDetail.distance")}
                  </p>
                  <p className="mt-2 text-2xl font-black">
                    {formatRunningDistance(distanceMeters)}
                  </p>
                </div>
                <div className="rounded-3xl bg-muted/30 p-5">
                  <p className="text-xs text-muted-foreground">
                    {t("user.workout.historyDetail.duration")}
                  </p>
                  <p className="mt-2 text-2xl font-black">
                    {formatDuration(get(session, "durationSeconds"), t)}
                  </p>
                </div>
                <div className="rounded-3xl bg-muted/30 p-5">
                  <p className="text-xs text-muted-foreground">
                    {t("user.workout.historyDetail.pace")}
                  </p>
                  <p className="mt-2 text-2xl font-black">
                    {formatRunningPace(paceSecondsPerKm)}
                  </p>
                </div>
                <div className="rounded-3xl bg-muted/30 p-5">
                  <p className="text-xs text-muted-foreground">
                    {t("user.workout.historyDetail.calories")}
                  </p>
                  <p className="mt-2 text-2xl font-black">
                    {get(session, "estimatedCalories", 0)} kcal
                  </p>
                </div>
              </CardContent>
            </Card>
          </TrackingPageLayout>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition mode="slide-up">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <TrackingPageHeader
          title={
            get(session, "focus") ||
            get(session, "planName") ||
            t("user.workout.historyDetail.workout")
          }
          subtitle={t("user.workout.historyDetail.workoutSubtitle")}
          hideTitleOnMobile={false}
          actions={
            <>
              <Button variant="outline" onClick={() => navigate("/user/workout/history")}>
                <ArrowLeftIcon data-icon="inline-start" />
                {t("user.workout.historyDetail.history")}
              </Button>
              {relatedPlanPath ? (
                <Button onClick={() => navigate(relatedPlanPath)}>
                  {t("user.workout.historyDetail.planDay")}
                </Button>
              ) : null}
            </>
          }
        />

        <TrackingPageLayout
          aside={
            <div className="space-y-4">
              <Card className="rounded-[2rem]">
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">
                      {t("user.workout.historyDetail.dayBadge", {
                        day: (toNumber(get(session, "planDayIndex")) || 0) + 1,
                      })}
                    </Badge>
                    <Badge variant="secondary">
                      <CheckCircle2Icon />
                      {t("user.workout.historyDetail.completed")}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl font-black">
                    {get(session, "planName") ||
                      t("user.workout.historyDetail.workoutPlan")}
                  </CardTitle>
                  <CardDescription>
                    {formatDateTime(get(session, "endedAt"))}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-3xl bg-muted/30 p-4">
                      <p className="text-xs text-muted-foreground">
                        {t("user.workout.historyDetail.duration")}
                      </p>
                      <p className="mt-2 text-xl font-black">
                        {formatDuration(get(session, "durationSeconds"), t)}
                      </p>
                    </div>
                    <div className="rounded-3xl bg-muted/30 p-4">
                      <p className="text-xs text-muted-foreground">
                        {t("user.workout.historyDetail.calories")}
                      </p>
                      <p className="mt-2 text-xl font-black">
                        {get(session, "estimatedCalories", 0)} kcal
                      </p>
                    </div>
                    <div className="rounded-3xl bg-muted/30 p-4">
                      <p className="text-xs text-muted-foreground">
                        {t("user.workout.historyDetail.sets")}
                      </p>
                      <p className="mt-2 text-xl font-black">
                        {get(session, "completedSets", 0)}/{get(session, "totalSets", 0)}
                      </p>
                    </div>
                    <div className="rounded-3xl bg-muted/30 p-4">
                      <p className="text-xs text-muted-foreground">
                        {t("user.workout.historyDetail.volume")}
                      </p>
                      <p className="mt-2 text-xl font-black">
                        {get(session, "totalVolumeKg", 0)} kg
                      </p>
                    </div>
                    {skippedExerciseCount > 0 ? (
                      <div className="rounded-3xl bg-muted/30 p-4">
                        <p className="text-xs text-muted-foreground">
                          {t("user.workout.historyDetail.skipped")}
                        </p>
                        <p className="mt-2 text-xl font-black">
                          {t("user.workout.historyDetail.skippedCount", {
                            count: skippedExerciseCount,
                          })}
                        </p>
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p className="inline-flex items-center gap-2">
                      <CalendarDaysIcon className="size-4" />
                      {formatDateTime(get(session, "endedAt"))}
                    </p>
                    <p className="inline-flex items-center gap-2">
                      <TimerIcon className="size-4" />
                      {formatDuration(get(session, "durationSeconds"), t)}
                    </p>
                    <p className="inline-flex items-center gap-2">
                      <FlameIcon className="size-4" />
                      {get(session, "estimatedCalories", 0)} kcal
                    </p>
                  </div>
                </CardContent>
              </Card>

              {previousSessionId ? (
                <Card className="rounded-[2rem]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-black">
                      {t("user.workout.historyDetail.previousSession")}
                    </CardTitle>
                    <CardDescription>
                      {t("user.workout.historyDetail.previousDescription")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate(`/user/workout/history/${previousSessionId}`)}
                    >
                      {t("user.workout.historyDetail.openPrevious")}
                    </Button>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          }
        >
          <Card className="rounded-[2rem]">
            <CardHeader>
              <CardTitle>{t("user.workout.historyDetail.completedExercises")}</CardTitle>
              <CardDescription>
                {t("user.workout.historyDetail.completedDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {map(renderableExercises, (item) => (
                <div
                  key={get(item, "key")}
                  className="space-y-3 rounded-3xl border bg-card px-4 py-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <DumbbellIcon className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-black">{get(item, "name")}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {get(item, "equipment") ||
                          t("user.workout.historyDetail.bodyweight")}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="outline">
                          {t("user.workout.historyDetail.setCount", {
                            completed: get(item, "completedSets", 0),
                            total: get(item, "totalSets", 0),
                          })}
                        </Badge>
                        <Badge variant="outline">
                          {t("user.workout.historyDetail.repsCount", {
                            count: get(item, "totalReps", 0),
                          })}
                        </Badge>
                        {toNumber(get(item, "distanceMeters", 0)) > 0 ? (
                          <Badge variant="outline">
                            {get(item, "distanceMeters", 0)} m
                          </Badge>
                        ) : null}
                        {get(item, "skipped") ? (
                          <Badge variant="secondary">
                            {t("user.workout.historyDetail.skippedBadge")}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="inline-flex items-center gap-1 text-sm font-bold">
                        <GaugeIcon className="size-4 text-muted-foreground" />
                        {get(item, "totalVolumeKg", 0)} kg
                      </p>
                    </div>
                  </div>

                  {isArray(get(item, "sets")) && get(item, "sets.length") > 0 ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {map(get(item, "sets", []), (set) => (
                        <div
                          key={get(set, "id") || `${get(item, "key")}-${get(set, "setIndex")}`}
                          className="grid grid-cols-[28px_repeat(4,minmax(0,1fr))] items-center gap-2 rounded-2xl bg-muted/30 px-3 py-2 text-sm"
                        >
                          <span className="font-black">{toNumber(get(set, "setIndex", 0)) + 1}</span>
                          <span>
                            {t("user.workout.historyDetail.repsCount", {
                              count: get(set, "reps", 0),
                            })}
                          </span>
                          <span>{get(set, "weight", 0)} kg</span>
                          <span>
                            {t("user.workout.historyDetail.secondsCount", {
                              count: get(set, "durationSeconds", 0),
                            })}
                          </span>
                          <span>{get(set, "distanceMeters", 0)} m</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>
        </TrackingPageLayout>
      </div>
    </PageTransition>
  );
};

export default SessionHistoryDetailPage;
