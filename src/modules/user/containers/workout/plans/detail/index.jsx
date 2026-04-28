import React from "react";
import { findIndex, get, map, size, uniq } from "lodash";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  ChevronRightIcon,
  DumbbellIcon,
  PencilIcon,
  PlayIcon,
  RotateCcwIcon,
  SparklesIcon,
  TargetIcon,
  Trash2Icon,
} from "lucide-react";
import PageLoader from "@/components/page-loader/index.jsx";
import PageTransition from "@/components/page-transition";
import {
  TrackingPageHeader,
  TrackingPageLayout,
} from "@/components/tracking-page-shell";
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
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useWorkoutLogs } from "@/hooks/app/use-workout-logs";
import {
  useActivateWorkoutPlan,
  useDeleteWorkoutPlan,
  useWorkoutPlanDetail,
} from "@/hooks/app/use-workout-plans";
import { cn } from "@/lib/utils";
import { useBreadcrumbStore } from "@/store";
import WorkoutExerciseDetailDrawer from "../../workout-exercise-detail-drawer";
import SessionDrawer from "../../session-drawer";
import {
  deriveWorkoutPlanMetrics,
  getExerciseDisplaySummary,
  getExerciseSetCount,
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
  if (get(plan, "source") === "ai") {
    return (
      <Badge variant="secondary">
        <SparklesIcon />
        AI
      </Badge>
    );
  }

  if (get(plan, "source") === "coach") {
    return <Badge variant="outline">Murabbiy</Badge>;
  }

  return <Badge variant="outline">Manual</Badge>;
};

const getDayEquipments = (exercises = []) => {
  const equipmentNames = uniq(
    exercises.flatMap((exercise) => {
      const equipments = Array.isArray(get(exercise, "equipments"))
        ? get(exercise, "equipments")
        : [];
      return [...equipments, get(exercise, "equipment")].filter(Boolean);
    }),
  );

  return equipmentNames.length > 0 ? equipmentNames.join(", ") : "Default";
};

const getTotalExerciseCount = (schedule = []) =>
  schedule.reduce((total, day) => {
    const exercises = Array.isArray(get(day, "exercises"))
      ? get(day, "exercises")
      : [];
    return total + exercises.length;
  }, 0);

const DayCard = ({
  day,
  index,
  isSelected,
  isToday,
  onSelect,
}) => {
  const exerciseCount = size(get(day, "exercises", []));

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center justify-between gap-4 rounded-3xl border bg-card px-5 py-5 text-left shadow-sm transition-all hover:border-primary/40 hover:bg-primary/5",
        isSelected && "border-primary/40 bg-primary/10",
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-2xl font-black">Day {index + 1}</p>
          {isToday ? <Badge variant="secondary">Bugun</Badge> : null}
        </div>
        <p className="mt-1 truncate text-base font-medium text-muted-foreground">
          {get(day, "focus") || get(day, "day") || "Workout"}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {exerciseCount} mashq
        </p>
      </div>
      <div className="flex items-center gap-3">
        {isSelected ? (
          <Badge variant="secondary">Active</Badge>
        ) : (
          <ChevronRightIcon className="text-muted-foreground" />
        )}
      </div>
    </button>
  );
};

const ExerciseRow = ({ exercise, index, onOpen }) => {
  const hasImage = Boolean(get(exercise, "imageUrl"));
  const equipment =
    get(exercise, "equipment") ||
    get(exercise, "equipments[0]") ||
    get(exercise, "category") ||
    "Bodyweight";

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-4 rounded-3xl border bg-background p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
    >
      <span className="w-5 text-center text-sm font-black text-muted-foreground">
        {index + 1}
      </span>
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

const WorkoutPlanDetailPage = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const { plan: rawPlan, isLoading, isError, refetch } = useWorkoutPlanDetail(
    planId,
    {
      enabled: Boolean(planId),
    },
  );
  const { items: workoutLogs } = useWorkoutLogs({}, { enabled: Boolean(rawPlan) });
  const activatePlanMutation = useActivateWorkoutPlan();
  const deletePlanMutation = useDeleteWorkoutPlan();
  const plan = React.useMemo(
    () => deriveWorkoutPlanMetrics(rawPlan),
    [rawPlan],
  );
  const schedule = Array.isArray(get(plan, "schedule"))
    ? get(plan, "schedule")
    : [];
  const todayName = WEEK_DAYS[new Date().getDay()];
  const todayIndex = findIndex(schedule, (day) => get(day, "day") === todayName);
  const [selectedDayIndex, setSelectedDayIndex] = React.useState(0);
  const [showMobileDayDetail, setShowMobileDayDetail] = React.useState(false);
  const [sessionOpen, setSessionOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [exerciseDrawerOpen, setExerciseDrawerOpen] = React.useState(false);
  const [selectedExercise, setSelectedExercise] = React.useState(null);
  const selectedDay =
    get(schedule, `[${selectedDayIndex}]`) || get(schedule, "[0]");
  const selectedExercises = Array.isArray(get(selectedDay, "exercises"))
    ? get(selectedDay, "exercises")
    : [];
  const generationMeta = get(plan, "generationMeta");
  const benchmarkText = get(generationMeta, "benchmark.oneRepMaxKg")
    ? `${get(generationMeta, "benchmark.oneRepMaxKg")} kg`
    : "-";

  React.useEffect(() => {
    if (todayIndex >= 0) {
      setSelectedDayIndex(todayIndex);
    }
  }, [todayIndex]);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user", title: "Bosh sahifa" },
      { url: "/user/workout", title: "Workout" },
      { url: "/user/workout/plans", title: "Mening rejalarim" },
      {
        url: `/user/workout/plans/${planId}`,
        title: get(plan, "name", "Plan"),
      },
    ]);
  }, [plan, planId, setBreadcrumbs]);

  const handleSelectDay = (index) => {
    setSelectedDayIndex(index);
    setShowMobileDayDetail(true);
  };

  const handleOpenExercise = (exercise) => {
    setSelectedExercise(exercise);
    setExerciseDrawerOpen(true);
  };

  const handleStart = async () => {
    if (!get(plan, "id")) {
      return;
    }

    try {
      if (get(plan, "status") !== "active") {
        await activatePlanMutation.activatePlan(get(plan, "id"), plan);
      }

      setSessionOpen(true);
    } catch (error) {
      toast.error(
        get(error, "response.data.message") ||
          "Rejani boshlashda xatolik yuz berdi",
      );
    }
  };

  const handleDelete = async () => {
    if (!get(plan, "id")) {
      return;
    }

    try {
      await deletePlanMutation.deletePlan(get(plan, "id"));
      toast.success("Workout reja o'chirildi");
      navigate("/user/workout/plans", { replace: true });
    } catch (error) {
      toast.error(
        get(error, "response.data.message") ||
          "Workout rejani o'chirib bo'lmadi",
      );
    }
  };

  if (isLoading && !plan) {
    return <PageLoader />;
  }

  if (isError || !plan) {
    return (
      <PageTransition mode="slide-up">
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
      </PageTransition>
    );
  }

  return (
    <PageTransition mode="slide-up">
      <div className="flex flex-col gap-6">
        <TrackingPageHeader
          title={get(plan, "name", "Workout reja")}
          subtitle={get(plan, "description") || "Workout plan ichki sahifasi."}
          hideTitleOnMobile={showMobileDayDetail}
          actions={
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => navigate(`/user/workout/plans/edit/${get(plan, "id")}`)}
              >
                <PencilIcon data-icon="inline-start" />
                Tahrirlash
              </Button>
              <Button
                variant="outline"
                onClick={() => setDeleteOpen(true)}
                disabled={get(plan, "source") === "coach"}
              >
                <Trash2Icon data-icon="inline-start" />
                O'chirish
              </Button>
              <Button
                onClick={handleStart}
                disabled={activatePlanMutation.isPending}
              >
                <PlayIcon data-icon="inline-start" />
                Boshlash
              </Button>
            </div>
          }
        />

        <TrackingPageLayout
          aside={
            <div className="flex flex-col gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Plan holati</CardTitle>
                  <CardAction>
                    <PlanSourceBadge plan={plan} />
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-2xl bg-muted/40 px-3 py-3">
                      <p className="text-xs text-muted-foreground">Status</p>
                      <p className="mt-1 font-semibold capitalize">
                        {get(plan, "status") || "draft"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-muted/40 px-3 py-3">
                      <p className="text-xs text-muted-foreground">Daraja</p>
                      <p className="mt-1 font-semibold">
                        {get(plan, "difficulty") || "O'rta"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-muted/40 px-3 py-3">
                      <p className="text-xs text-muted-foreground">Kun/hafta</p>
                      <p className="mt-1 font-semibold">
                        {get(plan, "daysPerWeek") || 0}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-muted/40 px-3 py-3">
                      <p className="text-xs text-muted-foreground">Mashqlar</p>
                      <p className="mt-1 font-semibold">
                        {get(plan, "totalExercises") || getTotalExerciseCount(schedule)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {generationMeta ? (
                <Card>
                  <CardHeader>
                    <CardTitle>AI asoslari</CardTitle>
                    <CardDescription>
                      Reja quyidagi ma'lumotlar asosida tuzilgan.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-2 text-sm">
                      <div className="flex justify-between gap-3 rounded-2xl bg-muted/40 px-3 py-2">
                        <span className="text-muted-foreground">Maqsad</span>
                        <span className="font-medium">{get(generationMeta, "goal")}</span>
                      </div>
                      <div className="flex justify-between gap-3 rounded-2xl bg-muted/40 px-3 py-2">
                        <span className="text-muted-foreground">Daraja</span>
                        <span className="font-medium">{get(generationMeta, "level")}</span>
                      </div>
                      <div className="flex justify-between gap-3 rounded-2xl bg-muted/40 px-3 py-2">
                        <span className="text-muted-foreground">1RM</span>
                        <span className="font-medium">{benchmarkText}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          }
          className="lg:grid-cols-[minmax(320px,420px)_1fr]"
        >
          <div
            className={cn(
              "flex flex-col gap-4",
              showMobileDayDetail && "hidden lg:flex",
            )}
          >
            <Card>
              <CardHeader>
                <CardTitle>Plan kunlari</CardTitle>
                <CardDescription>
                  Kerakli kunni tanlang va mashqlar ro'yxatini ko'ring.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {size(schedule) > 0 ? (
                  <div className="flex flex-col gap-3">
                    {map(schedule, (day, index) => (
                      <DayCard
                        key={`${get(day, "day")}-${index}`}
                        day={day}
                        index={index}
                        isSelected={selectedDayIndex === index}
                        isToday={get(day, "day") === todayName}
                        onSelect={() => handleSelectDay(index)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-3xl border border-dashed bg-muted/20 px-5 py-10 text-center">
                    <CalendarDaysIcon className="mx-auto text-muted-foreground" />
                    <p className="mt-3 font-semibold">Schedule hali to'ldirilmagan</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div
            className={cn(
              "flex flex-col gap-4",
              !showMobileDayDetail && "hidden lg:flex",
            )}
          >
            <Card>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="lg:hidden"
                    onClick={() => setShowMobileDayDetail(false)}
                    aria-label="Kunlarga qaytish"
                  >
                    <ArrowLeftIcon />
                  </Button>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-4xl font-black">
                      DAY {selectedDayIndex + 1}
                    </CardTitle>
                    <CardDescription>
                      {get(selectedDay, "day", "Workout kuni")}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">
                    {get(selectedDay, "focus") || "Workout"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-3xl border bg-muted/20 px-4 py-4">
                    <DumbbellIcon className="text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Equipment</p>
                      <p className="font-black">{getDayEquipments(selectedExercises)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-3xl border bg-muted/20 px-4 py-4">
                    <TargetIcon className="text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        1RM {get(generationMeta, "benchmark.exerciseName") || ""}
                      </p>
                      <p className="font-black">{benchmarkText}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{size(selectedExercises)} mashq</CardTitle>
                <CardAction>
                  <Badge variant="outline">
                    <DumbbellIcon />
                    {get(selectedDay, "focus") || "Plan"}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardContent>
                {size(selectedExercises) > 0 ? (
                  <div className="flex flex-col gap-3">
                    {map(selectedExercises, (exercise, index) => (
                      <ExerciseRow
                        key={`${get(exercise, "name")}-${index}`}
                        exercise={exercise}
                        index={index}
                        onOpen={() => handleOpenExercise(exercise)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-3xl border border-dashed bg-muted/20 px-5 py-10 text-center">
                    <p className="font-semibold">Bu kunda mashq yo'q</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Rejani tahrirlab mashqlar qo'shing.
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex-col gap-2 sm:flex-row">
                <Button
                  className="w-full sm:flex-1"
                  onClick={handleStart}
                  disabled={activatePlanMutation.isPending}
                >
                  <PlayIcon data-icon="inline-start" />
                  START
                </Button>
                {get(plan, "source") === "ai" ? (
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => toast.info("Regenerate AI create flow orqali bajariladi")}
                  >
                    <RotateCcwIcon data-icon="inline-start" />
                    Regenerate
                  </Button>
                ) : null}
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => navigate(`/user/workout/plans/edit/${get(plan, "id")}`)}
                >
                  <PencilIcon data-icon="inline-start" />
                  Edit
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TrackingPageLayout>

        <SessionDrawer
          open={sessionOpen}
          onOpenChange={setSessionOpen}
          plan={plan}
          initialDayIdx={selectedDayIndex}
        />

        <WorkoutExerciseDetailDrawer
          open={exerciseDrawerOpen}
          onOpenChange={setExerciseDrawerOpen}
          exercise={selectedExercise}
          logs={workoutLogs}
        />
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Workout rejani o'chirasizmi?</AlertDialogTitle>
            <AlertDialogDescription>
              "{get(plan, "name")}" rejasi butunlay o'chiriladi. Bu amalni ortga
              qaytarib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePlanMutation.isPending}>
              Bekor qilish
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deletePlanMutation.isPending}
              onClick={handleDelete}
            >
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  );
};

export default WorkoutPlanDetailPage;
