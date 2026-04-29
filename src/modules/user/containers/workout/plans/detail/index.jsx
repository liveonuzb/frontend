import React from "react";
import { findIndex, get, map, size } from "lodash";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import {
  CalendarDaysIcon,
  ChevronRightIcon,
  PencilIcon,
  PlayIcon,
  SparklesIcon,
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
import {
  useActivateWorkoutPlan,
  useDeleteWorkoutPlan,
  useWorkoutPlanDetail,
} from "@/hooks/app/use-workout-plans";
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
  isToday,
  isCompleted,
  isLocked,
  onSelect,
}) => {
  const exerciseCount = size(get(day, "exercises", []));

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center justify-between gap-4 rounded-3xl border bg-card px-5 py-5 text-left shadow-sm transition-all hover:border-primary/40 hover:bg-primary/5",
        isToday && "border-primary/40 bg-primary/10",
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-2xl font-black">Day {index + 1}</p>
          {isToday ? <Badge variant="secondary">Bugun</Badge> : null}
          {isCompleted ? <Badge variant="outline">Bajarilgan</Badge> : null}
          {isLocked ? <Badge variant="outline">Locked</Badge> : null}
        </div>
        <p className="mt-1 truncate text-base font-medium text-muted-foreground">
          {get(day, "focus") || get(day, "day") || "Workout"}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {exerciseCount} mashq
        </p>
      </div>
      <div className="flex items-center gap-3">
        <ChevronRightIcon className="text-muted-foreground" />
      </div>
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
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const startDayIndex = getNextStartableDayIndex(plan);
  const dayProgress = Array.isArray(get(plan, "dayProgress"))
    ? get(plan, "dayProgress")
    : [];
  const generationMeta = get(plan, "generationMeta");
  const benchmarkText = get(generationMeta, "benchmark.oneRepMaxKg")
    ? `${get(generationMeta, "benchmark.oneRepMaxKg")} kg`
    : "-";

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
    navigate(`/user/workout/plans/${planId}/days/${index}`);
  };

  const handleStart = async () => {
    if (!get(plan, "id")) {
      return;
    }

    try {
      if (get(plan, "status") !== "active") {
        await activatePlanMutation.activatePlan(get(plan, "id"), plan);
      }

      navigate(`/user/workout/plans/${planId}/days/${startDayIndex}/session`);
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
          hideTitleOnMobile={false}
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
              {get(plan, "coverImageUrl") ? (
                <Card className="overflow-hidden">
                  <div className="aspect-video bg-muted">
                    <img
                      src={get(plan, "coverImageUrl")}
                      alt={get(plan, "name", "Workout reja")}
                      className="size-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </Card>
              ) : null}

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
          <Card>
            <CardHeader>
              <CardTitle>Plan kunlari</CardTitle>
              <CardDescription>
                Kerakli kunni tanlang va mashqlar ro'yxatini alohida sahifada
                ko'ring.
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
                      isToday={get(day, "day") === todayName}
                      isCompleted={Boolean(get(dayProgress[index], "completed"))}
                      isLocked={isWorkoutDayLocked(plan, index)}
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
        </TrackingPageLayout>

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
