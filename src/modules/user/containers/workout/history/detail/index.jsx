import React from "react";
import { get, map } from "lodash";
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

const formatDuration = (seconds) => {
  const totalMinutes = Math.max(0, Math.round((Number(seconds) || 0) / 60));
  return `${totalMinutes} daqiqa`;
};

const getRenderableExercises = (session) => {
  const detailedExercises = Array.isArray(get(session, "exercises"))
    ? get(session, "exercises")
    : [];

  if (detailedExercises.length > 0) {
    return detailedExercises.map((exercise) => ({
      key: get(exercise, "id") || get(exercise, "exerciseKey"),
      name: get(exercise, "exerciseName"),
      equipment: get(exercise, "equipment"),
      completedSets: get(exercise, "completedSets", 0),
      totalSets: get(exercise, "totalSets", 0),
      totalReps: get(exercise, "totalReps", 0),
      totalVolumeKg: get(exercise, "totalVolumeKg", 0),
      distanceMeters: get(exercise, "distanceMeters", 0),
      skipped: Boolean(get(exercise, "skipped")),
      sets: Array.isArray(get(exercise, "sets")) ? get(exercise, "sets") : [],
    }));
  }

  return map(get(session, "exerciseSummaries", []), (item) => ({
    key: get(item, "exerciseKey"),
    name: get(item, "exerciseName"),
    equipment: null,
    completedSets: get(item, "completedSets", 0),
    totalSets: get(item, "completedSets", 0),
    totalReps: get(item, "totalReps", 0),
    totalVolumeKg: get(item, "totalVolumeKg", 0),
    distanceMeters: get(item, "distanceMeters", 0),
    skipped: false,
    sets: [],
  }));
};

const SessionHistoryDetailPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const { session, isLoading, isError, refetch } = useWorkoutSessionHistoryItem(sessionId);
  const { sessions } = useWorkoutSessionHistory({ enabled: false });

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user", title: "Bosh sahifa" },
      { url: "/user/workout", title: "Workout" },
      { url: "/user/workout/history", title: "Tarix" },
      { url: `/user/workout/history/${sessionId}`, title: "Session" },
    ]);
  }, [sessionId, setBreadcrumbs]);

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
            <CardTitle>Workout session topilmadi</CardTitle>
            <CardDescription>
              Tanlangan mashg'ulot tafsilotlarini olishda xatolik yuz berdi.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button onClick={() => refetch()}>Qayta urinish</Button>
            <Button variant="outline" onClick={() => navigate("/user/workout/history")}>
              Tarixga qaytish
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
            title={get(session, "focus") || "Outdoor run"}
            subtitle="Yakunlangan running session tafsilotlari va GPS metrikalari."
            hideTitleOnMobile={false}
            actions={
              <>
                <Button variant="outline" onClick={() => navigate("/user/workout/history")}>
                  <ArrowLeftIcon data-icon="inline-start" />
                  Tarix
                </Button>
                <Button onClick={() => navigate(`/user/workout/running/${sessionId}`)}>
                  Running detail
                </Button>
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
                        <RouteIcon />
                        Running
                      </Badge>
                      <Badge variant="secondary">
                        <CheckCircle2Icon />
                        Yakunlandi
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl font-black">
                      GPS running session
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
                      {formatDuration(get(session, "durationSeconds"))}
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
                      <CardTitle className="text-base font-black">Oldingi session</CardTitle>
                      <CardDescription>
                        Avvalgi workout tafsilotlarini ham ko'rishingiz mumkin.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate(`/user/workout/history/${previousSessionId}`)}
                      >
                        Oldingi sessionni ochish
                      </Button>
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            }
          >
            <Card className="rounded-[2rem]">
              <CardHeader>
                <CardTitle>Running summary</CardTitle>
                <CardDescription>
                  Umumiy masofa, vaqt, pace va kaloriya ko'rsatkichlari.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-3xl bg-muted/30 p-5">
                  <p className="text-xs text-muted-foreground">Masofa</p>
                  <p className="mt-2 text-2xl font-black">
                    {formatRunningDistance(distanceMeters)}
                  </p>
                </div>
                <div className="rounded-3xl bg-muted/30 p-5">
                  <p className="text-xs text-muted-foreground">Davomiyligi</p>
                  <p className="mt-2 text-2xl font-black">
                    {formatDuration(get(session, "durationSeconds"))}
                  </p>
                </div>
                <div className="rounded-3xl bg-muted/30 p-5">
                  <p className="text-xs text-muted-foreground">Pace</p>
                  <p className="mt-2 text-2xl font-black">
                    {formatRunningPace(paceSecondsPerKm)}
                  </p>
                </div>
                <div className="rounded-3xl bg-muted/30 p-5">
                  <p className="text-xs text-muted-foreground">Calories</p>
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
          title={get(session, "focus") || get(session, "planName") || "Workout"}
          subtitle="Yakunlangan session tafsilotlari va bajarilgan mashqlar."
          hideTitleOnMobile={false}
          actions={
            <>
              <Button variant="outline" onClick={() => navigate("/user/workout/history")}>
                <ArrowLeftIcon data-icon="inline-start" />
                Tarix
              </Button>
              {relatedPlanPath ? (
                <Button onClick={() => navigate(relatedPlanPath)}>Plan kuni</Button>
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
                      Day {(Number(get(session, "planDayIndex")) || 0) + 1}
                    </Badge>
                    <Badge variant="secondary">
                      <CheckCircle2Icon />
                      Yakunlandi
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl font-black">
                    {get(session, "planName") || "Workout plan"}
                  </CardTitle>
                  <CardDescription>
                    {formatDateTime(get(session, "endedAt"))}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-3xl bg-muted/30 p-4">
                      <p className="text-xs text-muted-foreground">Davomiyligi</p>
                      <p className="mt-2 text-xl font-black">
                        {formatDuration(get(session, "durationSeconds"))}
                      </p>
                    </div>
                    <div className="rounded-3xl bg-muted/30 p-4">
                      <p className="text-xs text-muted-foreground">Calories</p>
                      <p className="mt-2 text-xl font-black">
                        {get(session, "estimatedCalories", 0)} kcal
                      </p>
                    </div>
                    <div className="rounded-3xl bg-muted/30 p-4">
                      <p className="text-xs text-muted-foreground">Setlar</p>
                      <p className="mt-2 text-xl font-black">
                        {get(session, "completedSets", 0)}/{get(session, "totalSets", 0)}
                      </p>
                    </div>
                    <div className="rounded-3xl bg-muted/30 p-4">
                      <p className="text-xs text-muted-foreground">Volume</p>
                      <p className="mt-2 text-xl font-black">
                        {get(session, "totalVolumeKg", 0)} kg
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p className="inline-flex items-center gap-2">
                      <CalendarDaysIcon className="size-4" />
                      {formatDateTime(get(session, "endedAt"))}
                    </p>
                    <p className="inline-flex items-center gap-2">
                      <TimerIcon className="size-4" />
                      {formatDuration(get(session, "durationSeconds"))}
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
                    <CardTitle className="text-base font-black">Oldingi session</CardTitle>
                    <CardDescription>
                      Avvalgi workout tafsilotlarini ham ko'rishingiz mumkin.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate(`/user/workout/history/${previousSessionId}`)}
                    >
                      Oldingi sessionni ochish
                    </Button>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          }
        >
          <Card className="rounded-[2rem]">
            <CardHeader>
              <CardTitle>Bajarilgan mashqlar</CardTitle>
              <CardDescription>
                Session davomida log qilingan mashqlar va umumiy yuklama.
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
                        {get(item, "equipment") || "Bodyweight"}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="outline">
                          {get(item, "completedSets", 0)}/{get(item, "totalSets", 0)} set
                        </Badge>
                        <Badge variant="outline">
                          {get(item, "totalReps", 0)} reps
                        </Badge>
                        {Number(get(item, "distanceMeters", 0)) > 0 ? (
                          <Badge variant="outline">
                            {get(item, "distanceMeters", 0)} m
                          </Badge>
                        ) : null}
                        {get(item, "skipped") ? (
                          <Badge variant="secondary">Skipped</Badge>
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

                  {Array.isArray(get(item, "sets")) && get(item, "sets.length") > 0 ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {map(get(item, "sets", []), (set) => (
                        <div
                          key={get(set, "id") || `${get(item, "key")}-${get(set, "setIndex")}`}
                          className="grid grid-cols-[28px_repeat(4,minmax(0,1fr))] items-center gap-2 rounded-2xl bg-muted/30 px-3 py-2 text-sm"
                        >
                          <span className="font-black">{Number(get(set, "setIndex", 0)) + 1}</span>
                          <span>{get(set, "reps", 0)} reps</span>
                          <span>{get(set, "weight", 0)} kg</span>
                          <span>{get(set, "durationSeconds", 0)} sec</span>
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
