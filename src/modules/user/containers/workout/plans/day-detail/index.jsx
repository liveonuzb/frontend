import React from "react";
import { get, map, size, uniq, filter, isArray, toNumber } from "lodash";
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
  RotateCcwIcon,
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
} from "@/hooks/app/use-workout-plans";
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

const getDayEquipments = (exercises = []) => {
  const equipmentNames = uniq(
    exercises.flatMap((exercise) => {
      const equipments = isArray(get(exercise, "equipments"))
        ? get(exercise, "equipments")
        : [];

      return filter([...equipments, get(exercise, "equipment")], Boolean);
    }),
  );

  return equipmentNames.length > 0 ? equipmentNames.join(", ") : "Default";
};

const getBenchmarkText = (generationMeta) =>
  get(generationMeta, "benchmark.oneRepMaxKg")
    ? `${get(generationMeta, "benchmark.oneRepMaxKg")} kg`
    : "-";

const getExerciseEquipment = (exercise) =>
  get(exercise, "equipment") ||
  get(exercise, "equipments[0]") ||
  get(exercise, "category") ||
  "Bodyweight";

const ExerciseRow = ({ exercise, onOpen }) => {
  const hasImage = Boolean(get(exercise, "imageUrl"));
  const equipment = getExerciseEquipment(exercise);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-4 rounded-3xl bg-card px-4 py-4 text-left shadow-sm ring-1 ring-border transition hover:bg-primary/5 hover:ring-primary/30"
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
      <Badge variant="secondary">{getExerciseSetCount(exercise)} set</Badge>
    </button>
  );
};

const FocusVisual = ({ focus }) => (
  <div className="flex size-24 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
    <div className="flex size-16 items-center justify-center rounded-full border border-primary/20 bg-background/70">
      <TargetIcon />
    </div>
    <span className="sr-only">{focus || "Workout"} focus visual</span>
  </div>
);

const WorkoutRegenerateOverlay = ({ progress }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/96 px-6 backdrop-blur-sm">
    <div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-primary/10">
        <TargetIcon className="size-9 text-primary" />
      </div>
      <div className="space-y-2">
        <h2 className="text-3xl font-black tracking-tight">
          AI yangi mashg'ulotlarni tayyorlamoqda...
        </h2>
        <p className="text-sm text-muted-foreground">
          Shu kun uchun mashqlar qayta tuzilmoqda.
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
        PLEASE WAIT...
      </Button>
    </div>
  </div>
);

const WorkoutPlanDayDetailPage = () => {
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
  const isLocked = isWorkoutDayLocked(plan, dayIndex);
  const generationMeta = get(plan, "generationMeta");
  const benchmarkText = getBenchmarkText(generationMeta);
  const focus = get(selectedDay, "focus") || get(selectedDay, "day") || "Workout";
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
      { url: "/user", title: "Bosh sahifa" },
      { url: "/user/workout", title: "Workout" },
      { url: "/user/workout/plans", title: "Mening rejalarim" },
      {
        url: `/user/workout/plans/${planId}`,
        title: get(plan, "name", "Plan"),
      },
      {
        url: `/user/workout/plans/${planId}/days/${dayIndex}`,
        title: `DAY ${dayIndex + 1}`,
      },
    ]);
  }, [dayIndex, plan, planId, setBreadcrumbs]);

  const handleStart = async () => {
    if (!get(plan, "id")) return;
    if (isLocked) {
      toast.error("Avval oldingi kun mashg'ulotini yakunlang");
      return;
    }

    try {
      if (get(plan, "status") !== "active") {
        await activatePlanMutation.activatePlan(get(plan, "id"), plan);
      }

      navigate(`/user/workout/plans/${planId}/days/${dayIndex}/session`);
    } catch (error) {
      toast.error(
        get(error, "response.data.message") ||
          "Rejani boshlashda xatolik yuz berdi",
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
      toast.success("Kun mashqlari yangilandi");
      window.setTimeout(() => {
        setIsRegenerateOverlayOpen(false);
      }, 250);
    } catch (error) {
      setIsRegenerateOverlayOpen(false);
      setRegenerateProgress(0);
      toast.error(
        get(error, "response.data.message") ||
          "Kun mashqlarini yangilab bo'lmadi",
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
              aria-label="Planga qaytish"
            >
              <ArrowLeftIcon />
            </Button>
            <div className="min-w-0">
              <h1 className="text-3xl font-black tracking-normal">
                DAY {dayIndex + 1}
              </h1>
              <p className="text-sm text-muted-foreground">
                Workout kuni tafsilotlari
              </p>
            </div>
          </header>
          <Card>
            <CardHeader>
              <CardTitle>Workout reja topilmadi</CardTitle>
              <CardDescription>
                Reja o'chirilgan yoki sizda unga ruxsat yo'q.
              </CardDescription>
            </CardHeader>
            <CardFooter className="gap-2">
              <Button onClick={() => refetch()}>Qayta urinish</Button>
              <Button variant="outline" onClick={() => navigate("/user/workout/plans")}>
                Rejalarga qaytish
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
        <Card>
          <CardHeader>
            <CardTitle>Workout kuni topilmadi</CardTitle>
            <CardDescription>
              Tanlangan kun bu reja schedule ro'yxatida mavjud emas.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              variant="outline"
              onClick={() => navigate(`/user/workout/plans/${planId}`)}
            >
              <ArrowLeftIcon data-icon="inline-start" />
              Plan sahifasiga qaytish
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
              alt={get(plan, "name", "Workout reja")}
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
              aria-label="Planga qaytish"
            >
              <ArrowLeftIcon />
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="icon"
                className="rounded-full bg-background/85"
                onClick={() => navigate(`/user/workout/plans/edit/${planId}`)}
                aria-label="Rejani tahrirlash"
              >
                <PencilIcon />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="rounded-full bg-background/85"
                aria-label="Ko'proq"
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
                DAY {dayIndex + 1}
              </h1>
              <Badge variant="secondary" className="mt-3 text-base font-black">
                {focus}
              </Badge>
            </div>
            <FocusVisual focus={focus} />
          </div>

          <div className="grid overflow-hidden rounded-3xl bg-card shadow-sm ring-1 ring-border sm:grid-cols-2">
            <div className="flex items-center gap-3 border-b px-5 py-5 sm:border-b-0 sm:border-r">
              <DumbbellIcon className="text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Equipment</p>
                <p className="text-lg font-black">{getDayEquipments(exercises)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-5 py-5">
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
              <h2 className="text-2xl font-black">{size(exercises)} exercises</h2>
              <Badge variant="outline">
                <CalendarDaysIcon />
                {get(selectedDay, "day", "Workout kuni")}
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
              <Card>
                <CardHeader>
                  <CardTitle>Bu kunda mashq yo'q</CardTitle>
                  <CardDescription>
                    Rejani tahrirlab ushbu kunga mashqlar qo'shing.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </section>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              className="w-full sm:flex-1"
              onClick={handleStart}
              disabled={activatePlanMutation.isPending || isLocked}
            >
              <PlayIcon data-icon="inline-start" />
              {isLocked ? "Locked" : "START"}
            </Button>
            {get(plan, "source") === "ai" ? (
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={handleRegenerate}
                disabled={regenerateDayMutation.isPending}
              >
                <RotateCcwIcon data-icon="inline-start" />
                Regenerate
              </Button>
            ) : null}
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => navigate(`/user/workout/plans/edit/${planId}?day=${dayIndex}`)}
            >
              <PencilIcon data-icon="inline-start" />
              Edit
            </Button>
          </div>
          {isLocked ? (
            <p className="text-sm text-muted-foreground">
              Keyingi kunni boshlashdan oldin oldingi workout kunlarini yakunlang.
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
