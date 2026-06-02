import React from "react";
import { useTranslation } from "react-i18next";
import find from "lodash/find";
import get from "lodash/get";
import map from "lodash/map";
import size from "lodash/size";
import uniq from "lodash/uniq";
import filter from "lodash/filter";
import isArray from "lodash/isArray";
import toNumber from "lodash/toNumber";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  DumbbellIcon,
  ImageIcon,
  MoreVerticalIcon,
  PencilIcon,
  PlayIcon,
  Repeat2Icon,
  RotateCcwIcon,
  SkipForwardIcon,
  TargetIcon,
} from "lucide-react";
import PageLoader from "@/components/page-loader/index.jsx";
import PageTransition from "@/components/page-transition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useWorkoutLogs } from "@/hooks/app/use-workout-logs";
import {
  useActivateWorkoutPlan,
  useRegenerateWorkoutPlanDay,
  useWorkoutPlanDetail,
  WORKOUT_PLAN_STATUS,
} from "@/hooks/app/use-workout-plans";
import {
  useSkipWorkoutSession,
  useUndoSkipWorkoutSession,
} from "@/hooks/app/use-workout-sessions";
import { cn } from "@/lib/utils";
import { useBreadcrumbStore } from "@/store";
import WorkoutExerciseDetailDrawer from "../../workout-exercise-detail-drawer";
import {
  deriveWorkoutPlanMetrics,
  getExerciseDisplaySummary,
  getExerciseSetCount,
  isWorkoutDayLocked,
} from "../../utils";

const parseDayIndex = (value) => {
  const parsed = toNumber(value);

  return Number.isInteger(parsed) && parsed >= 0 ? parsed : -1;
};

const getDayEquipments = (exercises = [], fallback = "Default") => {
  const equipmentNames = uniq(
    exercises.flatMap((exercise) => {
      const equipments = isArray(get(exercise, "equipments"))
        ? get(exercise, "equipments")
        : [];

      return filter([...equipments, get(exercise, "equipment")], Boolean);
    }),
  );

  return equipmentNames.length > 0 ? equipmentNames.join(", ") : fallback;
};

const getBenchmarkText = (generationMeta) =>
  get(generationMeta, "benchmark.oneRepMaxKg")
    ? `${get(generationMeta, "benchmark.oneRepMaxKg")} kg`
    : "-";

const getExerciseEquipment = (exercise, fallback = "Bodyweight") =>
  get(exercise, "equipment") ||
  get(exercise, "equipments[0]") ||
  get(exercise, "category") ||
  fallback;

const ExerciseRow = ({ exercise, onOpen }) => {
  const { t } = useTranslation();
  const hasImage = Boolean(get(exercise, "imageUrl"));
  const equipment = getExerciseEquipment(
    exercise,
    t("user.workout.dayDetail.bodyweight"),
  );

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-4 rounded-3xl bg-card p-4 text-left shadow-sm ring-1 ring-border transition hover:bg-primary/5 hover:ring-primary/30"
    >
      <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted/40">
        {hasImage ? (
          <img
            src={get(exercise, "imageUrl")}
            alt={get(exercise, "name")}
            className="size-full object-cover"
            loading="lazy"
          />
        ) : (
          <DumbbellIcon className="text-muted-foreground" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base font-black">
          {get(exercise, "name")} · {equipment}
        </span>
        <span className="mt-1 block truncate text-sm text-muted-foreground">
          {getExerciseDisplaySummary(exercise)}
        </span>
      </span>
      <Badge variant="secondary">
        {t("user.workout.dayDetail.setCount", {
          count: getExerciseSetCount(exercise),
        })}
      </Badge>
    </button>
  );
};

const FocusVisual = ({ focus }) => {
  const { t } = useTranslation();

  return (
  <div className="flex size-24 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
    <div className="flex size-16 items-center justify-center rounded-full border border-primary/20 bg-background/70">
      <TargetIcon />
    </div>
    <span className="sr-only">
      {t("user.workout.dayDetail.focusVisual", {
        focus: focus || t("user.workout.title"),
      })}
    </span>
  </div>
  );
};

const WorkoutRegenerateOverlay = ({ progress }) => {
  const { t } = useTranslation();

  return (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/96 px-6 backdrop-blur-sm">
    <div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-primary/10">
        <TargetIcon className="size-9 text-primary" />
      </div>
      <div className="space-y-2">
        <h2 className="text-3xl font-black tracking-tight">
          {t("user.workout.dayDetail.regenerateTitle")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("user.workout.dayDetail.regenerateDescription")}
        </p>
      </div>
      <div className="relative flex size-52 items-center justify-center rounded-full">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(hsl(var(--primary)) ${progress}%, hsl(var(--muted)) ${progress}% 100%)`,
          }}
        />
        <div className="absolute inset-4 rounded-full bg-background" />
        <div className="relative text-5xl font-black">{progress}%</div>
      </div>
      <Button className="w-full" size="lg" disabled>
        {t("user.workout.dayDetail.pleaseWait")}
      </Button>
    </div>
  </div>
  );
};

const WorkoutPlanDayDetailPage = () => {
  const { t } = useTranslation();
  const { planId, dayIndex: dayIndexParam } = useParams();
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const dayIndex = parseDayIndex(dayIndexParam);
  const { plan: rawPlan, isLoading, isError, refetch } = useWorkoutPlanDetail(
    planId,
    {
      enabled: Boolean(planId),
    },
  );
  const { items: workoutLogs } = useWorkoutLogs({}, { enabled: Boolean(rawPlan) });
  const activatePlanMutation = useActivateWorkoutPlan();
  const regenerateDayMutation = useRegenerateWorkoutPlanDay();
  const skipSessionMutation = useSkipWorkoutSession();
  const undoSkipSessionMutation = useUndoSkipWorkoutSession();
  const [exerciseDrawerOpen, setExerciseDrawerOpen] = React.useState(false);
  const [selectedExercise, setSelectedExercise] = React.useState(null);
  const [isRegenerateOverlayOpen, setIsRegenerateOverlayOpen] = React.useState(false);
  const [regenerateProgress, setRegenerateProgress] = React.useState(0);
  const plan = React.useMemo(
    () => deriveWorkoutPlanMetrics(rawPlan),
    [rawPlan],
  );
  const schedule = isArray(get(plan, "schedule"))
    ? get(plan, "schedule")
    : [];
  const selectedDay = dayIndex >= 0 ? get(schedule, `[${dayIndex}]`) : null;
  const exercises = isArray(get(selectedDay, "exercises"))
    ? get(selectedDay, "exercises")
    : [];
  const selectedDayProgress = React.useMemo(
    () =>
      find(
        isArray(get(plan, "dayProgress")) ? get(plan, "dayProgress") : [],
        (item) => toNumber(get(item, "dayIndex")) === dayIndex,
      ) ?? null,
    [dayIndex, plan],
  );
  const isCompletedDay = Boolean(get(selectedDayProgress, "completed"));
  const isSkippedDay = Boolean(get(selectedDayProgress, "skipped"));
  const isLocked = isWorkoutDayLocked(plan, dayIndex);
  const canRedoAsExtra = isCompletedDay && !isSkippedDay;
  const generationMeta = get(plan, "generationMeta");
  const benchmarkText = getBenchmarkText(generationMeta);
  const focus =
    get(selectedDay, "focus") || get(selectedDay, "day") || t("user.workout.title");
  const coverImageUrl = get(plan, "coverImageUrl");

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (!isRegenerateOverlayOpen) {
      return undefined;
    }

    setRegenerateProgress(20);
    const intervalId = window.setInterval(() => {
      setRegenerateProgress((current) => (current >= 90 ? current : current + 7));
    }, 220);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isRegenerateOverlayOpen]);
  /* eslint-enable react-hooks/set-state-in-effect */

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user", title: t("user.dashboard.title") },
      { url: "/user/workout", title: t("user.workout.title") },
      { url: "/user/workout/plans", title: t("user.workout.dayDetail.myPlans") },
      {
        url: `/user/workout/plans/${planId}`,
        title: get(plan, "name", t("user.workout.dayDetail.planFallback")),
      },
      {
        url: `/user/workout/plans/${planId}/days/${dayIndex}`,
        title: t("user.workout.dayDetail.dayTitle", { day: dayIndex + 1 }),
      },
    ]);
  }, [dayIndex, plan, planId, setBreadcrumbs, t]);

  const handleStart = async () => {
    if (!get(plan, "id")) return;
    if (isSkippedDay) {
      toast.error(t("user.workout.dayDetail.skippedStartError"));
      return;
    }

    try {
      let activePlanId = planId;
      if (get(plan, "status") !== WORKOUT_PLAN_STATUS.active) {
        const activatedPlan = await activatePlanMutation.activatePlan(
          get(plan, "id"),
          plan,
        );
        activePlanId = get(activatedPlan, "id", planId);
      }

      navigate(
        `/user/workout/plans/${activePlanId}/days/${dayIndex}/session${canRedoAsExtra ? "?mode=extra" : ""}`,
      );
    } catch (error) {
      toast.error(
        get(error, "response.data.message") ||
          t("user.workout.dayDetail.startError"),
      );
    }
  };

  const handleSkipDay = async () => {
    if (!get(plan, "id") || isLocked) {
      return;
    }

    try {
      await skipSessionMutation.skipSession(get(plan, "id"), dayIndex);
      toast.success(t("user.workout.dayDetail.skipSuccess"));
      navigate(`/user/workout/plans/${get(plan, "id")}`);
    } catch (error) {
      toast.error(
        get(error, "response.data.message") ||
          t("user.workout.dayDetail.skipError"),
      );
    }
  };

  const handleUndoSkipDay = async () => {
    if (!get(plan, "id") || !isSkippedDay) {
      return;
    }

    try {
      await undoSkipSessionMutation.undoSkipSession(get(plan, "id"), dayIndex);
      toast.success(t("user.workout.dayDetail.undoSkipSuccess"));
      navigate(`/user/workout/plans/${get(plan, "id")}`);
    } catch (error) {
      toast.error(
        get(error, "response.data.message") ||
          t("user.workout.dayDetail.undoSkipError"),
      );
    }
  };

  const handleOpenExercise = (exercise) => {
    setSelectedExercise(exercise);
    setExerciseDrawerOpen(true);
  };

  const handleRegenerate = async () => {
    if (!get(plan, "id")) {
      return;
    }

    try {
      setIsRegenerateOverlayOpen(true);
      await regenerateDayMutation.regenerateDay(get(plan, "id"), dayIndex, {});
      setRegenerateProgress(100);
      toast.success(t("user.workout.dayDetail.regenerateSuccess"));
      window.setTimeout(() => {
        setIsRegenerateOverlayOpen(false);
      }, 250);
    } catch (error) {
      setIsRegenerateOverlayOpen(false);
      setRegenerateProgress(0);
      toast.error(
        get(error, "response.data.message") ||
          t("user.workout.dayDetail.regenerateError"),
      );
    }
  };

  if (isLoading && !plan) {
    return <PageLoader />;
  }

  if (isError || !plan) {
    return (
      <PageTransition mode="slide-up">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <header className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full"
              onClick={() => navigate(`/user/workout/plans/${planId}`)}
              aria-label={t("user.workout.dayDetail.backToPlan")}
            >
              <ArrowLeftIcon />
            </Button>
            <div className="min-w-0">
              <h1 className="text-3xl font-black tracking-normal">
                {t("user.workout.dayDetail.dayTitle", { day: dayIndex + 1 })}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("user.workout.dayDetail.subtitle")}
              </p>
            </div>
          </header>
          <Card className="py-6">
            <CardHeader>
              <CardTitle>{t("user.workout.dayDetail.planNotFoundTitle")}</CardTitle>
              <CardDescription>
                {t("user.workout.dayDetail.planNotFoundDescription")}
              </CardDescription>
            </CardHeader>
            <CardFooter className="gap-2">
              <Button onClick={() => refetch()}>
                {t("user.workout.dayDetail.retry")}
              </Button>
              <Button variant="outline" onClick={() => navigate("/user/workout/plans")}>
                {t("user.workout.dayDetail.backToPlans")}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </PageTransition>
    );
  }

  if (!selectedDay) {
    return (
      <PageTransition mode="slide-up">
        <Card className="py-6">
          <CardHeader>
            <CardTitle>{t("user.workout.dayDetail.dayNotFoundTitle")}</CardTitle>
            <CardDescription>
              {t("user.workout.dayDetail.dayNotFoundDescription")}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              variant="outline"
              onClick={() => navigate(`/user/workout/plans/${planId}`)}
            >
              <ArrowLeftIcon data-icon="inline-start" />
              {t("user.workout.dayDetail.backToPlanPage")}
            </Button>
          </CardFooter>
        </Card>
      </PageTransition>
    );
  }

  return (
    <PageTransition mode="slide-up">
      <div className="mx-auto flex w-full max-w-5xl flex-col pb-8">
        <section className="relative min-h-72 overflow-hidden rounded-b-[2rem] bg-muted md:min-h-96 md:rounded-[2rem]">
          {coverImageUrl ? (
            <img
              src={coverImageUrl}
              alt={get(plan, "name", t("user.workout.dayDetail.planImageAlt"))}
              className="absolute inset-0 size-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <ImageIcon className="text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-background/15 via-background/25 to-background/85" />
          <div className="relative flex items-center justify-between gap-3 p-4 md:p-6">
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full bg-background/85"
              onClick={() => navigate(`/user/workout/plans/${planId}`)}
              aria-label={t("user.workout.dayDetail.backToPlan")}
            >
              <ArrowLeftIcon />
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="icon"
                className="rounded-full bg-background/85"
                onClick={() => navigate(`/user/workout/plans/edit/${planId}`)}
                aria-label={t("user.workout.dayDetail.editPlan")}
              >
                <PencilIcon />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="rounded-full bg-background/85"
                aria-label={t("user.workout.dayDetail.more")}
              >
                <MoreVerticalIcon />
              </Button>
            </div>
          </div>
        </section>

        <main className="-mt-12 flex flex-col gap-6 rounded-t-[2rem] bg-background px-4 py-6 shadow-sm ring-1 ring-border md:-mt-16 md:mx-6 md:rounded-[2rem] md:px-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-5xl font-black tracking-normal md:text-6xl">
                {t("user.workout.dayDetail.dayTitle", { day: dayIndex + 1 })}
              </h1>
              <Badge variant="secondary" className="mt-3 text-base font-black">
                {focus}
              </Badge>
            </div>
            <FocusVisual focus={focus} />
          </div>

          <div className="grid overflow-hidden rounded-3xl bg-card shadow-sm ring-1 ring-border sm:grid-cols-2">
            <div className="flex items-center gap-3 border-b p-5 sm:border-b-0 sm:border-r">
              <DumbbellIcon className="text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("user.workout.dayDetail.equipment")}
                </p>
                <p className="text-lg font-black">
                  {getDayEquipments(
                    exercises,
                    t("user.workout.dayDetail.defaultEquipment"),
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-5">
              <TargetIcon className="text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">
                  1RM {get(generationMeta, "benchmark.exerciseName") || ""}
                </p>
                <p className="text-lg font-black">{benchmarkText}</p>
              </div>
            </div>
          </div>

          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-black">
                {t("user.workout.dayDetail.exerciseCount", {
                  count: size(exercises),
                })}
              </h2>
              <Badge variant="outline">
                <CalendarDaysIcon />
                {get(selectedDay, "day", t("user.workout.dayDetail.workoutDay"))}
              </Badge>
            </div>

            {size(exercises) > 0 ? (
              <div className="flex flex-col gap-3">
                {map(exercises, (exercise, index) => (
                  <ExerciseRow
                    key={`${get(exercise, "name")}-${index}`}
                    exercise={exercise}
                    onOpen={() => handleOpenExercise(exercise)}
                  />
                ))}
              </div>
            ) : (
              <Card className="py-6">
                <CardHeader>
                  <CardTitle>{t("user.workout.dayDetail.noExercisesTitle")}</CardTitle>
                  <CardDescription>
                    {t("user.workout.dayDetail.noExercisesDescription")}
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </section>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              className="w-full sm:flex-1"
              onClick={handleStart}
              disabled={
                activatePlanMutation.isPending ||
                skipSessionMutation.isPending ||
                undoSkipSessionMutation.isPending ||
                (isLocked && !canRedoAsExtra)
              }
            >
              {canRedoAsExtra ? (
                <Repeat2Icon data-icon="inline-start" />
              ) : (
                <PlayIcon data-icon="inline-start" />
              )}
              {isSkippedDay
                ? t("user.workout.dayDetail.skipped")
                : canRedoAsExtra
                  ? t("user.workout.dayDetail.redoExtra")
                  : t("user.workout.dayDetail.start")}
            </Button>
            {!isLocked ? (
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={handleSkipDay}
                disabled={skipSessionMutation.isPending}
              >
                <SkipForwardIcon data-icon="inline-start" />
                {t("user.workout.dayDetail.skipDay")}
              </Button>
            ) : null}
            {isSkippedDay ? (
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={handleUndoSkipDay}
                disabled={undoSkipSessionMutation.isPending}
              >
                <RotateCcwIcon data-icon="inline-start" />
                {t("user.workout.dayDetail.undoSkip")}
              </Button>
            ) : null}
            {get(plan, "source") === "ai" ? (
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={handleRegenerate}
                disabled={regenerateDayMutation.isPending || isLocked}
              >
                <RotateCcwIcon data-icon="inline-start" />
                {t("user.workout.dayDetail.regenerate")}
              </Button>
            ) : null}
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => navigate(`/user/workout/plans/edit/${planId}?day=${dayIndex}`)}
              disabled={isLocked}
            >
              <PencilIcon data-icon="inline-start" />
              {t("user.workout.dayDetail.edit")}
            </Button>
          </div>
          {isLocked ? (
            <p className="text-sm text-muted-foreground">
              {isSkippedDay
                ? t("user.workout.dayDetail.skippedHint")
                : t("user.workout.dayDetail.lockedHint")}
            </p>
          ) : null}
        </main>

        <WorkoutExerciseDetailDrawer
          open={exerciseDrawerOpen}
          onOpenChange={setExerciseDrawerOpen}
          exercise={selectedExercise}
          logs={workoutLogs}
        />
        {isRegenerateOverlayOpen ? (
          <WorkoutRegenerateOverlay progress={regenerateProgress} />
        ) : null}
      </div>
    </PageTransition>
  );
};

export default WorkoutPlanDayDetailPage;
