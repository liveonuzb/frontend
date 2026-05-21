import React from "react";
import { useTranslation } from "react-i18next";
import { find, get, map, size, isArray, reduce, toNumber } from "lodash";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import {
  BarChart3Icon,
  CalendarDaysIcon,
  ChevronRightIcon,
  Clock3Icon,
  DumbbellIcon,
  FlameIcon,
  PencilIcon,
  PlayIcon,
  SparklesIcon,
  TargetIcon,
  Trash2Icon,
} from "lucide-react";
import PageLoader from "@/components/page-loader/index.jsx";
import PageTransition from "@/components/page-transition";
import { TrackingPageHeader } from "@/components/tracking-page-shell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useDeleteWorkoutPlan,
  useWorkoutPlanDetail,
} from "@/hooks/app/use-workout-plans";
import useWorkoutPlan from "@/hooks/app/use-workout-plan";
import { cn } from "@/lib/utils";
import { useBreadcrumbStore } from "@/store";
import {
  deriveWorkoutPlanMetrics,
  getNextStartableDayIndex,
  isWorkoutDayLocked,
} from "../../utils";

const WEEK_DAYS = [
  "Yakshanba",
  "Dushanba",
  "Seshanba",
  "Chorshanba",
  "Payshanba",
  "Juma",
  "Shanba",
];

const PlanSourceBadge = ({ plan }) => {
  const { t } = useTranslation();

  if (get(plan, "source") === "ai") {
    return (
      <Badge variant="secondary">
        <SparklesIcon />
        AI
      </Badge>
    );
  }

  if (get(plan, "isTemplate") || get(plan, "status") === "template") {
    return <Badge variant="outline">Template</Badge>;
  }

  return <Badge variant="outline">{t("user.workout.planDetail.manual")}</Badge>;
};

const getTotalExerciseCount = (schedule = []) =>
  reduce(schedule, (total, day) => {
    const exercises = isArray(get(day, "exercises"))
      ? get(day, "exercises")
      : [];
    return total + exercises.length;
  }, 0);

const getEquipmentSummary = (schedule = []) => {
  const equipmentSet = new Set();

  schedule.forEach((day) => {
    const exercises = isArray(get(day, "exercises"))
      ? get(day, "exercises")
      : [];

    exercises.forEach((exercise) => {
      if (isArray(get(exercise, "equipments"))) {
        get(exercise, "equipments").forEach((item) => {
          if (item) equipmentSet.add(String(item));
        });
      }

      const equipment = get(exercise, "equipment");
      if (equipment) {
        equipmentSet.add(String(equipment));
      }
    });
  });

  return Array.from(equipmentSet).slice(0, 5);
};

const DayCard = ({
  day,
  index,
  isToday,
  isCompleted,
  isLocked,
  onSelect,
}) => {
  const { t } = useTranslation();
  const exerciseCount = size(get(day, "exercises", []));

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-900/10 bg-white/55 px-4 py-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-white/10 dark:bg-white/[0.04]",
        isToday && "border-primary/40 bg-primary/10",
      )}
    >
      <div className="flex min-w-0 items-center gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <DumbbellIcon className="size-6" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-black">
              {t("user.workout.planDetail.dayTitle", { day: index + 1 })}
            </p>
          {isToday ? <Badge variant="secondary">{t("user.workout.planDetail.today")}</Badge> : null}
          {isCompleted ? <Badge variant="outline">{t("user.workout.planDetail.completed")}</Badge> : null}
          {isLocked ? <Badge variant="outline">{t("user.workout.planDetail.locked")}</Badge> : null}
          </div>
          <p className="mt-1 truncate text-base font-bold">
            {get(day, "title") ||
              get(day, "focus") ||
              get(day, "day") ||
              t("user.workout.title")}
          </p>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {get(day, "subtitle") ||
              t("user.workout.planDetail.exerciseCountUz", {
                count: exerciseCount,
              })}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-muted-foreground sm:inline">
          {get(day, "duration") || t("user.workout.planDetail.defaultDuration")}
        </span>
        <ChevronRightIcon className="text-muted-foreground transition group-hover:text-primary" />
      </div>
    </button>
  );
};

const WorkoutPlanDetailPage = () => {
  const { t } = useTranslation();
  const { planId } = useParams();
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const {
    plan: remotePlan,
    isLoading,
    refetch,
  } = useWorkoutPlanDetail(
    planId,
    {
      enabled: Boolean(planId),
    },
  );
  const {
    plans = [],
    templates = [],
    startPlan,
    isStartingPlan,
    isLoading: isPlansLoading = false,
  } = useWorkoutPlan();
  const deletePlanMutation = useDeleteWorkoutPlan();
  const fallbackPlan = React.useMemo(
    () =>
      find(
        [...plans, ...templates],
        (item) => String(get(item, "id")) === String(planId),
      ) || null,
    [planId, plans, templates],
  );
  const rawPlan = remotePlan || fallbackPlan;
  const plan = React.useMemo(
    () => deriveWorkoutPlanMetrics(rawPlan),
    [rawPlan],
  );
  const schedule = isArray(get(plan, "schedule"))
    ? get(plan, "schedule")
    : [];
  const todayName = WEEK_DAYS[new Date().getDay()];
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const dayProgress = isArray(get(plan, "dayProgress"))
    ? get(plan, "dayProgress")
    : [];
  const isTemplatePlan =
    Boolean(get(plan, "isTemplate")) || get(plan, "status") === "template";

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user", title: t("user.dashboard.title") },
      { url: "/user/workout", title: t("user.workout.title") },
      { url: "/user/workout/plans", title: t("user.workout.dayDetail.myPlans") },
      {
        url: `/user/workout/plans/${planId}`,
        title: get(plan, "name", t("user.workout.dayDetail.planFallback")),
      },
    ]);
  }, [plan, planId, setBreadcrumbs, t]);

  const handleSelectDay = (index) => {
    navigate(`/user/workout/plans/${planId}/days/${index}`);
  };

  const handleStart = async () => {
    if (!get(plan, "id")) {
      return;
    }

    try {
      const activatedPlan = await startPlan(plan);
      const targetPlan = deriveWorkoutPlanMetrics(activatedPlan || plan);
      const nextDayIndex = Number.isInteger(
        toNumber(get(targetPlan, "nextWorkout.dayIndex")),
      )
        ? toNumber(get(targetPlan, "nextWorkout.dayIndex"))
        : getNextStartableDayIndex(targetPlan);
      toast.success(
        t("user.workout.planDetail.startSuccess", {
          name: get(plan, "name", t("user.workout.planDetail.planFallbackUz")),
        }),
      );
      navigate(
        `/user/workout/plans/${get(targetPlan, "id", get(plan, "id"))}/days/${Math.max(0, nextDayIndex)}/session`,
      );
    } catch (error) {
      toast.error(
        get(error, "response.data.message") ||
          t("user.workout.planDetail.startError"),
      );
    }
  };

  const handleDelete = async () => {
    if (!get(plan, "id") || isTemplatePlan) {
      return;
    }

    try {
      await deletePlanMutation.deletePlan(get(plan, "id"));
      toast.success(t("user.workout.planDetail.deleteSuccess"));
      navigate("/user/workout/plans", { replace: true });
    } catch (error) {
      toast.error(
        get(error, "response.data.message") ||
          t("user.workout.planDetail.deleteError"),
      );
    }
  };

  if ((isLoading || isPlansLoading) && !plan) {
    return <PageLoader />;
  }

  if (!plan) {
    return (
      <PageTransition mode="slide-up">
        <div className="flex flex-col gap-6">
          <TrackingPageHeader
            title={t("user.workout.planDetail.errorHeaderTitle")}
            subtitle={t("user.workout.planDetail.errorHeaderSubtitle")}
            hideTitleOnMobile={false}
          />
          <Card className="py-6">
            <CardHeader>
              <CardTitle>{t("user.workout.planDetail.notFoundTitle")}</CardTitle>
              <CardDescription>
                {t("user.workout.planDetail.notFoundDescription")}
              </CardDescription>
            </CardHeader>
            <CardFooter className="gap-2">
              <Button onClick={() => refetch()}>
                {t("user.workout.planDetail.retry")}
              </Button>
              <Button variant="outline" onClick={() => navigate("/user/workout/plans")}>
                {t("user.workout.planDetail.backToPlans")}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </PageTransition>
    );
  }

  const durationWeeks =
    toNumber(get(plan, "durationWeeks")) ||
    Math.max(1, Math.round((toNumber(get(plan, "days")) || 56) / 7));
  const daysPerWeek = toNumber(get(plan, "daysPerWeek")) || 4;
  const coverImageUrl = get(plan, "coverImageUrl");
  const workoutDuration =
    get(plan, "todayWorkout.duration") ||
    get(schedule, "[0].duration") ||
    t("user.workout.planDetail.defaultDuration");
  const goalTitle = get(plan, "goal", t("user.workout.planDetail.defaultGoal"));
  const goalDescription =
    get(plan, "goalDescription") ||
    t("user.workout.planDetail.defaultGoalDescription");
  const included = get(plan, "included", {});
  const totalWorkouts =
    toNumber(get(plan, "targetWorkouts")) ||
    toNumber(get(included, "workouts")) ||
    Math.max(0, durationWeeks * daysPerWeek);
  const totalExercises =
    toNumber(get(included, "exercises")) ||
    toNumber(get(plan, "totalExercises")) ||
    getTotalExerciseCount(schedule);
  const completedWorkouts = Math.min(
    totalWorkouts,
    toNumber(get(plan, "completedWorkouts")) || 0,
  );
  const progress = Math.max(
    0,
    Math.min(100, Math.round(toNumber(get(plan, "progress")) || 0)),
  );
  const completedExercises = reduce(
    dayProgress,
    (total, item) =>
      total + (get(item, "completed") ? toNumber(get(item, "exerciseCount")) || 0 : 0),
    0,
  );
  const estimatedCalories =
    toNumber(get(plan, "todayWorkout.calories")) ||
    toNumber(get(plan, "nextWorkout.estimatedCalories")) ||
    toNumber(get(schedule, "[0].estimatedCalories")) ||
    toNumber(get(schedule, "[0].calories")) ||
    0;
  const equipmentItems = getEquipmentSummary(schedule);
  const equipmentLabel =
    equipmentItems.length > 0
      ? equipmentItems.join(", ")
      : t("user.workout.planDetail.equipmentNotSpecified");
  const equipmentTitle =
    equipmentItems.length > 0
      ? t("user.workout.planDetail.equipmentConfigured")
      : t("user.workout.planDetail.equipmentFlexible");

  return (
    <PageTransition mode="slide-up">
      <div className="workout-page-surface grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <main className="flex min-w-0 flex-col gap-5">
          <section className="workout-glass-card relative min-h-[330px] overflow-hidden rounded-[1.75rem] border p-6 sm:p-8">
            {coverImageUrl ? (
              <img
                src={coverImageUrl}
                alt={get(plan, "name", t("user.workout.dayDetail.planImageAlt"))}
                className="absolute inset-y-0 right-0 h-full w-full object-cover opacity-70 md:w-[46%] dark:opacity-75"
                loading="lazy"
              />
            ) : null}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_25%,rgb(var(--accent-rgb)/0.22),transparent_28%),linear-gradient(90deg,color-mix(in_srgb,var(--color-background)_98%,transparent)_0%,color-mix(in_srgb,var(--color-background)_90%,transparent)_50%,color-mix(in_srgb,var(--color-background)_20%,transparent)_100%)] dark:bg-[radial-gradient(circle_at_74%_25%,rgb(var(--accent-rgb)/0.3),transparent_30%),linear-gradient(90deg,color-mix(in_srgb,var(--color-background)_98%,transparent)_0%,color-mix(in_srgb,var(--color-background)_90%,transparent)_52%,color-mix(in_srgb,var(--color-background)_20%,transparent)_100%)]" />
            <div className="relative z-10 max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-black tracking-tight">
                  {get(plan, "name", t("user.workout.planDetail.defaultPlanName"))}
                </h1>
                <Badge className="rounded-full bg-primary/10 text-primary">
                  {t("user.workout.planDetail.weeksPlan", {
                    count: durationWeeks,
                  })}
                </Badge>
                <PlanSourceBadge plan={plan} />
              </div>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
                {get(plan, "description") ||
                  t("user.workout.planDetail.defaultDescription")}
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {map([
                  [
                    CalendarDaysIcon,
                    durationWeeks,
                    t("user.workout.planDetail.weeks"),
                    t("user.workout.planDetail.totalDuration"),
                  ],
                  [
                    CalendarDaysIcon,
                    daysPerWeek,
                    t("user.workout.planDetail.daysPerWeek"),
                    t("user.workout.planDetail.recommended"),
                  ],
                  [
                    Clock3Icon,
                    workoutDuration,
                    t("user.workout.planDetail.minPerWorkout"),
                    t("user.workout.planDetail.estimatedTime"),
                  ],
                ], ([Icon, value, label, caption]) => (
                  <div
                    key={`${label}-${value}`}
                    className="workout-glass-card rounded-3xl p-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                        <Icon className="size-5" />
                      </span>
                      <div>
                        <p className="text-2xl font-black">{value}</p>
                        <p className="text-sm font-medium text-muted-foreground">
                          {label}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">{caption}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="workout-glass-card rounded-[1.5rem] border p-6">
            <div className="flex gap-5">
              <span className="grid size-16 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                <TargetIcon className="size-8" />
              </span>
              <div>
                <p className="text-sm font-black text-muted-foreground">
                  {t("user.workout.planDetail.goal")}
                </p>
                <h2 className="mt-1 text-2xl font-black">{goalTitle}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {goalDescription}
                </p>
              </div>
            </div>
          </section>

          <section className="workout-glass-card rounded-[1.5rem] border p-5 sm:p-6">
            <h2 className="text-2xl font-black">
              {t("user.workout.planDetail.thisWeek")}
            </h2>
            {size(schedule) > 0 ? (
              <div className="mt-5 grid gap-3">
                {map(schedule, (day, index) => (
                  <DayCard
                    key={`${get(day, "day")}-${index}`}
                    day={day}
                    index={index}
                    isToday={get(day, "day") === todayName}
                    isCompleted={Boolean(get(dayProgress[index], "completed"))}
                    isLocked={isWorkoutDayLocked(plan, index)}
                    onSelect={() => handleSelectDay(index)}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-3xl border border-dashed bg-muted/20 px-5 py-10 text-center">
                <CalendarDaysIcon className="mx-auto text-muted-foreground" />
                <p className="mt-3 font-semibold">
                  {t("user.workout.planDetail.emptySchedule")}
                </p>
              </div>
            )}
            <Button
              size="xl"
              className="mt-5 w-full rounded-2xl"
              onClick={handleStart}
              disabled={isStartingPlan}
            >
              <PlayIcon data-icon="inline-start" />
              {t("user.workout.planDetail.startThisPlan")}
            </Button>
          </section>

          <section className="workout-glass-card rounded-[1.5rem] border p-5 sm:p-6">
            <h2 className="text-2xl font-black">
              {t("user.workout.planDetail.included")}
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-4">
              {map([
                [
                  CalendarDaysIcon,
                  totalWorkouts,
                  t("user.workout.planDetail.workouts"),
                  t("user.workout.planDetail.structuredSessions"),
                ],
                [
                  DumbbellIcon,
                  totalExercises,
                  t("user.workout.planDetail.exercises"),
                  t("user.workout.planDetail.movementVariety"),
                ],
                [
                  BarChart3Icon,
                  t("user.workout.planDetail.progress"),
                  t("user.workout.planDetail.tracking"),
                  t("user.workout.planDetail.trackImprovement"),
                ],
                [
                  SparklesIcon,
                  "AI",
                  t("user.workout.planDetail.tips"),
                  t("user.workout.planDetail.personalizedGuidance"),
                ],
              ], ([Icon, value, label, caption]) => (
                <div key={`${value}-${label}`} className="rounded-2xl border border-slate-900/10 bg-white/45 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                  <Icon className="size-6 text-primary" />
                  <p className="mt-3 text-2xl font-black">{value}</p>
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
                </div>
              ))}
            </div>
          </section>
        </main>

        <aside className="flex min-w-0 flex-col gap-4 xl:sticky xl:top-4 xl:self-start">
          <div className="workout-glass-card rounded-3xl p-5">
            <h3 className="text-lg font-black">
              {t("user.workout.planDetail.difficultyLevel")}
            </h3>
            <div className="mt-5 flex items-center gap-4">
              <span className="grid size-16 place-items-center rounded-full bg-primary/10 text-primary">
                <BarChart3Icon className="size-8" />
              </span>
              <div>
                <p className="text-xl font-black text-primary">
                  {get(plan, "difficulty", t("user.workout.planDetail.intermediate"))}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("user.workout.planDetail.difficultyDescription")}
                </p>
              </div>
            </div>
          </div>

          <div className="workout-glass-card rounded-3xl p-5">
            <h3 className="text-lg font-black">
              {t("user.workout.planDetail.caloriesEstimate")}
            </h3>
            <div className="mt-5 flex items-center gap-4">
              <span className="grid size-16 place-items-center rounded-full bg-primary/10 text-primary">
                <FlameIcon className="size-8" />
              </span>
              <div>
                <p className="text-xl font-black">
                  {estimatedCalories > 0
                    ? t("user.workout.planDetail.caloriesPerWorkout", {
                        calories: estimatedCalories,
                      })
                    : t("user.workout.planDetail.caloriesNotSpecified")}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("user.workout.planDetail.caloriesDescription")}
                </p>
              </div>
            </div>
          </div>

          <div className="workout-glass-card rounded-3xl p-5">
            <h3 className="text-lg font-black">
              {t("user.workout.planDetail.equipmentNeeded")}
            </h3>
            <div className="mt-5 flex items-center gap-4">
              <span className="grid size-16 place-items-center rounded-full bg-green-500/10 text-green-500">
                <DumbbellIcon className="size-8" />
              </span>
              <div>
                <p className="text-xl font-black text-green-500">
                  {equipmentTitle}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {equipmentLabel}
                </p>
              </div>
            </div>
          </div>

          <div className="workout-glass-card rounded-3xl p-5">
            <h3 className="text-lg font-black">
              {t("user.workout.planDetail.weeklyPreview")}
            </h3>
            <div className="mt-5 grid grid-cols-[96px_1fr] items-center gap-5">
              <div className="grid size-24 place-items-center rounded-full border border-primary/30 bg-primary/5 text-center">
                <div>
                  <p className="text-2xl font-black text-primary">{progress}%</p>
                  <p className="text-xs text-muted-foreground">
                    {t("user.workout.planDetail.completedPreview")}
                  </p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">
                    {t("user.workout.planDetail.workouts")}
                  </span>
                  <span className="font-black">{completedWorkouts} / {totalWorkouts}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">
                    {t("user.workout.planDetail.exercises")}
                  </span>
                  <span className="font-black">
                    {Math.min(completedExercises, totalExercises)} / {Math.max(1, totalExercises)}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">
                    {t("user.workout.planDetail.time")}
                  </span>
                  <span className="font-black">{workoutDuration}</span>
                </div>
              </div>
            </div>
          </div>

          {!isTemplatePlan ? (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="flex-1 rounded-2xl"
              onClick={() => navigate(`/user/workout/plans/edit/${get(plan, "id")}`)}
            >
              <PencilIcon data-icon="inline-start" />
              {t("user.workout.planDetail.edit")}
            </Button>
            <Button
              variant="outline"
              className="flex-1 rounded-2xl"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2Icon data-icon="inline-start" />
              {t("user.workout.planDetail.delete")}
            </Button>
          </div>
          ) : null}
        </aside>
      </div>
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("user.workout.planDetail.deleteConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("user.workout.planDetail.deleteConfirmDescription", {
                name: get(plan, "name"),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePlanMutation.isPending}>
              {t("user.workout.planDetail.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deletePlanMutation.isPending}
              onClick={handleDelete}
            >
              {t("user.workout.planDetail.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  );
};

export default WorkoutPlanDetailPage;
