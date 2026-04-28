import React from "react";
import { findIndex, get, map } from "lodash";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import {
  CalendarDaysIcon,
  DumbbellIcon,
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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useActivateWorkoutPlan,
  useDeleteWorkoutPlan,
  useWorkoutPlanDetail,
} from "@/hooks/app/use-workout-plans";
import { useBreadcrumbStore } from "@/store";
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
  const [selectedDayIndex, setSelectedDayIndex] = React.useState(0);
  const [sessionOpen, setSessionOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const selectedDay = get(schedule, `[${selectedDayIndex}]`) || get(schedule, "[0]");
  const selectedExercises = Array.isArray(get(selectedDay, "exercises"))
    ? get(selectedDay, "exercises")
    : [];
  const generationMeta = get(plan, "generationMeta");

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
                        {get(plan, "totalExercises") || 0}
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
                        <span className="font-medium">
                          {get(generationMeta, "benchmark.oneRepMaxKg", "-")} kg
                        </span>
                      </div>
                      <div className="rounded-2xl bg-muted/40 px-3 py-2">
                        <p className="text-muted-foreground">Logic</p>
                        <p className="mt-1 font-medium">
                          Siz tanlagan jihozlar + 1RM + maqsad asosida.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          }
        >
          <Card>
            <CardHeader>
              <CardTitle>Plan kunlari</CardTitle>
              <CardDescription>
                Bugungi kun avtomatik ajratiladi, kerakli kunni tanlang.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {get(schedule, "length") > 0 ? (
                <Tabs
                  value={String(selectedDayIndex)}
                  onValueChange={(value) => setSelectedDayIndex(Number(value))}
                >
                  <TabsList className="w-full justify-start overflow-x-auto">
                    {map(schedule, (day, index) => (
                      <TabsTrigger key={`${get(day, "day")}-${index}`} value={String(index)}>
                        {get(day, "day") === todayName ? "Bugun" : `Day ${index + 1}`}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              ) : (
                <div className="rounded-2xl border border-dashed bg-muted/20 px-5 py-8 text-center">
                  <CalendarDaysIcon className="mx-auto size-10 text-muted-foreground/40" />
                  <p className="mt-3 font-semibold">Schedule hali to'ldirilmagan</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{get(selectedDay, "day", "Workout kuni")}</CardTitle>
              <CardDescription>
                {get(selectedDay, "focus") || "Mashqlar ro'yxati"}
              </CardDescription>
              <CardAction>
                <Badge variant="outline">
                  <DumbbellIcon />
                  {get(selectedExercises, "length", 0)} mashq
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              {get(selectedExercises, "length") > 0 ? (
                <div className="flex flex-col gap-3">
                  {map(selectedExercises, (exercise, index) => (
                    <div
                      key={`${get(exercise, "name")}-${index}`}
                      className="flex items-center gap-3 rounded-2xl border bg-background p-3"
                    >
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-sm font-black text-primary">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">
                          {get(exercise, "name")}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {getExerciseDisplaySummary(exercise)}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {getExerciseSetCount(exercise)} set
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed bg-muted/20 px-5 py-8 text-center">
                  <p className="font-semibold">Bu kunda mashq yo'q</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Rejani tahrirlab mashqlar qo'shing.
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="gap-2">
              <Button onClick={handleStart} disabled={activatePlanMutation.isPending}>
                <PlayIcon data-icon="inline-start" />
                Sessiyani boshlash
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/user/workout/plans/edit/${get(plan, "id")}`)}
              >
                Tahrirlash
              </Button>
            </CardFooter>
          </Card>

          <Separator />
        </TrackingPageLayout>

        <SessionDrawer
          open={sessionOpen}
          onOpenChange={setSessionOpen}
          plan={plan}
          initialDayIdx={selectedDayIndex}
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
