import React, { useDeferredValue, useState } from "react";
import {
  Outlet,
  useNavigate,
  useSearchParams,
} from "react-router";
import { useBreadcrumbStore } from "@/store";
import { toast } from "sonner";
import {
  map,
  filter,
  reduce,
  forEach,
  findIndex,
  get,
  isArray,
  max,
  toLower,
  includes,
  orderBy,
} from "lodash";
import PageTransition from "@/components/page-transition";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CalendarDaysIcon,
  CheckIcon,
  ChevronRightIcon,
  DumbbellIcon,
  PencilIcon,
  PlayIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";

import PlansTab from "../plans-tab";
import SessionDrawer from "../session-drawer";
import WorkoutAnalyticsSection from "../workout-analytics-section";
import {
  deriveWorkoutPlanMetrics,
  getExerciseSetCount,
  getExerciseDisplaySummary,
} from "../utils";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
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
import useWorkoutPlan from "@/hooks/app/use-workout-plan";
import {
  useDeleteWorkoutLog,
  useWorkoutLogs,
} from "@/hooks/app/use-workout-logs";
import useWorkoutOverview from "@/hooks/app/use-workout-overview";
import {
  formatWorkoutDistanceMeters,
  formatWorkoutDurationSeconds,
  getWorkoutSetSummary,
  normalizeWorkoutTrackingType,
} from "@/lib/workout-tracking";
import {
  TrackingPageHeader,
  TrackingPageLayout,
} from "@/components/tracking-page-shell";
import DateNav from "@/components/date-nav/index.jsx";

const WEEK_DAYS = [
  "Yakshanba",
  "Dushanba",
  "Seshanba",
  "Chorshanba",
  "Payshanba",
  "Juma",
  "Shanba",
];

const formatDuration = (minutes) => {
  const totalMinutes = Number.parseInt(minutes, 10) || 0;
  if (totalMinutes < 60) return `${totalMinutes} daq`;
  const hours = Math.floor(totalMinutes / 60);
  const remainder = totalMinutes % 60;
  return remainder > 0 ? `${hours} soat ${remainder} daq` : `${hours} soat`;
};

const formatWorkoutDate = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Sana belgilanmagan";
  }

  return new Intl.DateTimeFormat("uz-UZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
};

const getDateKey = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toISOString().split("T")[0];
};

const formatDifficultyTone = (value) => {
  switch (value) {
    case "Yuqori":
      return "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300";
    case "O'rta":
      return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";
    default:
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }
};

const formatExerciseSummary = (exercise) => {
  const completedLogs = Number(get(exercise, "loggedMeta.sessions") ?? 0);

  if (get(exercise, "loggedOnly")) {
    return completedLogs > 0
      ? `${completedLogs} marta log qilingan mashq`
      : "Erkin log sifatida qo'shilgan";
  }

  if (get(exercise, "loggedToday")) {
    return completedLogs > 0
      ? `${getExerciseDisplaySummary(exercise)} • ${completedLogs} marta bajarilgan`
      : `${getExerciseDisplaySummary(exercise)} reja`;
  }

  return getExerciseDisplaySummary(exercise);
};

const formatLoggedSetLabel = (item, fallbackTrackingType) => {
  const trackingType = normalizeWorkoutTrackingType(
    get(item, "trackingType") ?? fallbackTrackingType,
  );
  const parts = getWorkoutSetSummary(item, trackingType);
  return get(parts, "length") > 0 ? parts.join(" • ") : "Ma'lumot yo'q";
};

const Index = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const {
    plans: persistedWorkoutPlans,
    activePlan: persistedActivePlan,
    templates: readyTemplates,
    startPlan,
    removePlan,
    isRemovingPlan,
  } = useWorkoutPlan();
  const { overview: workoutOverview } = useWorkoutOverview();
  const { deleteLog, isPending: isDeletingWorkoutLog } = useDeleteWorkoutLog();

  const date = React.useMemo(() => {
    const requestedDate = searchParams.get("date");
    if (!requestedDate) {
      return new Date();
    }

    const parsedDate = new Date(`${requestedDate}T00:00:00`);
    return Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  }, [searchParams]);
  const [sessionDrawerOpen, setSessionDrawerOpen] = useState(false);
  const [isPlansDrawerOpen, setIsPlansDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingLogGroup, setDeletingLogGroup] = useState(null);
  const [deletingPlan, setDeletingPlan] = useState(null);
  const [sessionInitialDayIdx, setSessionInitialDayIdx] = useState(0);
  const [expandedExercises, setExpandedExercises] = useState([]);
  const activePlan = React.useMemo(
    () => deriveWorkoutPlanMetrics(persistedActivePlan),
    [persistedActivePlan],
  );
  const workoutPlans = React.useMemo(
    () => map(persistedWorkoutPlans, (plan) => deriveWorkoutPlanMetrics(plan)),
    [persistedWorkoutPlans],
  );

  const deferredSearchQuery = useDeferredValue(toLower(searchQuery.trim()));
  const selectedDayName = WEEK_DAYS[date.getDay()];
  const selectedDayIndex = findIndex(
    get(activePlan, "schedule"),
    (day) => day.day === selectedDayName,
  );
  const selectedDaySchedule =
    selectedDayIndex !== undefined && selectedDayIndex !== -1
      ? get(activePlan, `schedule[${selectedDayIndex}]`)
      : null;

  const selectedDateKey = getDateKey(date);
  const { items: selectedDateLogs = [] } = useWorkoutLogs(
    {
      from: selectedDateKey,
      to: selectedDateKey,
    },
    {
      enabled: Boolean(selectedDateKey),
    },
  );

  const loggedGroups = React.useMemo(() => {
    return orderBy(selectedDateLogs, ["addedAt"], ["desc"]);
  }, [selectedDateLogs]);

  const loggedGroupsByExerciseName = React.useMemo(() => {
    const groupsByName = new Map();

    forEach(loggedGroups, (group) => {
      const existingGroups = groupsByName.get(get(group, "name")) ?? [];
      groupsByName.set(get(group, "name"), [...existingGroups, group]);
    });

    return groupsByName;
  }, [loggedGroups]);

  const loggedExerciseSummaryByName = React.useMemo(() => {
    const summaryMap = new Map();

    forEach(loggedGroups, (group) => {
      const existing = summaryMap.get(get(group, "name"));
      const nextValue = {
        name: get(group, "name"),
        trackingType:
          get(group, "trackingType") ??
          get(existing, "trackingType", "REPS_WEIGHT"),
        reps: max([
          Number(get(existing, "reps", 0)),
          Number(get(group, "reps", 0)),
        ]),
        weight: max([
          Number(get(existing, "weight", 0)),
          Number(get(group, "weight", 0)),
        ]),
        durationSeconds:
          Number(get(existing, "durationSeconds", 0)) +
          Number(get(group, "durationSeconds", 0)),
        distanceMeters:
          Number(get(existing, "distanceMeters", 0)) +
          Number(get(group, "distanceMeters", 0)),
        totalSets:
          Number(get(existing, "totalSets", 0)) +
          Number(get(group, "totalSets", 0)),
        totalDuration:
          Number(get(existing, "totalDuration", 0)) +
          Number(get(group, "totalDuration", 0)),
        totalCalories:
          Number(get(existing, "totalCalories", 0)) +
          Number(get(group, "totalCalories", 0)),
        sessions: Number(get(existing, "sessions", 0)) + 1,
      };
      summaryMap.set(group.name, nextValue);
    });

    return summaryMap;
  }, [loggedGroups]);

  const displayedExercises = React.useMemo(() => {
    const plannedExercises = isArray(get(selectedDaySchedule, "exercises"))
      ? map(get(selectedDaySchedule, "exercises"), (exercise) => ({
          ...exercise,
          loggedToday: loggedGroupsByExerciseName.has(get(exercise, "name")),
          loggedGroups:
            loggedGroupsByExerciseName.get(get(exercise, "name")) ?? [],
          loggedMeta:
            loggedExerciseSummaryByName.get(get(exercise, "name")) ?? null,
        }))
      : [];

    const plannedNames = new Set(
      map(plannedExercises, (exercise) => get(exercise, "name")),
    );
    const additionalLoggedExercises = map(
      filter(
        Array.from(loggedExerciseSummaryByName.values()),
        (exercise) => !plannedNames.has(get(exercise, "name")),
      ),
      (exercise) => ({
        name: get(exercise, "name"),
        trackingType: get(exercise, "trackingType", "REPS_WEIGHT"),
        sets: get(exercise, "totalSets", 1),
        reps: get(exercise, "reps", ""),
        weight: get(exercise, "weight", ""),
        durationSeconds: get(exercise, "durationSeconds", 0),
        distanceMeters: get(exercise, "distanceMeters", 0),
        loggedToday: true,
        loggedOnly: true,
        loggedGroups:
          loggedGroupsByExerciseName.get(get(exercise, "name")) ?? [],
        loggedMeta: exercise,
      }),
    );

    return [...plannedExercises, ...additionalLoggedExercises].toSorted(
      (left, right) => {
        const leftRank = get(left, "loggedOnly")
          ? 2
          : get(left, "loggedToday")
            ? 1
            : 0;
        const rightRank = get(right, "loggedOnly")
          ? 2
          : get(right, "loggedToday")
            ? 1
            : 0;
        return leftRank - rightRank;
      },
    );
  }, [
    loggedExerciseSummaryByName,
    loggedGroupsByExerciseName,
    selectedDaySchedule,
  ]);

  const filteredExercises = React.useMemo(() => {
    const exercises = displayedExercises;

    if (!deferredSearchQuery) {
      return exercises;
    }

    return filter(exercises, (exercise) =>
      includes(toLower(String(get(exercise, "name", ""))), deferredSearchQuery),
    );
  }, [deferredSearchQuery, displayedExercises]);

  const weeklyStats = get(workoutOverview, "weeklyStats");
  const personalRecordCount = get(workoutOverview, "personalRecordCount");
  const focusStats = React.useMemo(
    () => ({
      planned: filter(
        displayedExercises,
        (exercise) => !get(exercise, "loggedOnly"),
      ).length,
      completed: filter(
        displayedExercises,
        (exercise) =>
          get(exercise, "loggedToday") && !get(exercise, "loggedOnly"),
      ).length,
      freeLogs: filter(displayedExercises, (exercise) =>
        get(exercise, "loggedOnly"),
      ).length,
      sessions: get(loggedGroups, "length"),
    }),
    [displayedExercises, get(loggedGroups, "length")],
  );
  const recentWorkoutDays = React.useMemo(
    () => get(workoutOverview, "recentWorkoutDays").slice(0, 4),
    [get(workoutOverview, "recentWorkoutDays")],
  );
  const topPersonalRecords = React.useMemo(
    () => get(workoutOverview, "personalRecords").slice(0, 3),
    [get(workoutOverview, "personalRecords")],
  );
  const completedWorkouts = Number(get(activePlan, "completedWorkouts") ?? 0);
  const remainingWorkouts = max([
    0,
    Number(get(activePlan, "days") ?? 0) -
      Number(get(activePlan, "completedWorkouts") ?? 0),
  ]);
  const selectedDateLabel = formatWorkoutDate(date);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user", title: "Bosh sahifa" },
      { url: "/user/workout", title: "Mashg'ulot" },
    ]);
  }, [setBreadcrumbs]);

  React.useEffect(() => {
    const availableExercises = new Set(
      map(displayedExercises, (exercise) => get(exercise, "name")),
    );
    setExpandedExercises((current) => {
      const persisted = filter(current, (exerciseName) =>
        availableExercises.has(exerciseName),
      );

      if (get(persisted, "length") > 0) {
        return persisted;
      }

      const defaultExpanded = map(
        filter(
          displayedExercises,
          (exercise) => !get(exercise, "loggedToday"),
        ).slice(0, 1),
        (exercise) => get(exercise, "name"),
      );

      if (get(defaultExpanded, "length") > 0) {
        return defaultExpanded;
      }

      return map(
        filter(displayedExercises, (exercise) =>
          get(exercise, "loggedToday"),
        ).slice(0, 1),
        (exercise) => get(exercise, "name"),
      );
    });
  }, [displayedExercises]);

  const workoutSearch = searchParams.toString();
  const preservedWorkoutSearch = workoutSearch ? `?${workoutSearch}` : "";

  const handleDateChange = React.useCallback(
    (nextDate) => {
      const nextParams = new URLSearchParams(searchParams);
      const nextDateKey = getDateKey(nextDate);

      if (nextDateKey) {
        nextParams.set("date", nextDateKey);
      } else {
        nextParams.delete("date");
      }

      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const navigateToWorkoutChild = React.useCallback(
    (pathname, state) => {
      navigate(
        {
          pathname,
          search: preservedWorkoutSearch,
        },
        state ? { state } : undefined,
      );
    },
    [navigate, preservedWorkoutSearch],
  );

  const handleStartPlan = async (plan) => {
    try {
      await startPlan(plan);
      toast.success(`"${get(plan, "name")}" rejasi boshlandi`);
      setIsPlansDrawerOpen(false);
      return true;
    } catch (error) {
      toast.error(
        get(error, "response.data.message") ||
          "Rejani boshlashda xatolik yuz berdi",
      );
      return false;
    }
  };

  const handleStartSession = () => {
    if (!activePlan) {
      setIsPlansDrawerOpen(true);
      return;
    }

    setSessionInitialDayIdx(
      selectedDayIndex !== -1 && selectedDayIndex !== undefined
        ? selectedDayIndex
        : 0,
    );
    setSessionDrawerOpen(true);
  };

  const handleQuickLog = (exercise = null) => {
    navigateToWorkoutChild("/user/workout/logs/create", {
      initialExercise: exercise,
    });
  };

  const handleEditLogGroup = (group) => {
    navigateToWorkoutChild(`/user/workout/logs/edit/${get(group, "groupKey")}`);
  };

  const handleDeleteLogGroup = async () => {
    const logGroupId = get(deletingLogGroup, "groupKey") || get(deletingLogGroup, "id");

    if (!logGroupId) {
      return;
    }

    try {
      await deleteLog(logGroupId, { date: selectedDateKey });
      toast.success("Workout log o'chirildi");
      setDeletingLogGroup(null);
    } catch (error) {
      toast.error("Workout logni o'chirishda xatolik yuz berdi");
    }
  };

  const handleOpenPlanBuilder = (plan) => {
    const isPersistedPlan = Boolean(get(plan, "id"));

    navigateToWorkoutChild(
      isPersistedPlan
        ? `/user/workout/plans/edit/${get(plan, "id")}`
        : "/user/workout/plans/create",
      plan ? { initialPlan: plan } : undefined,
    );
  };

  const handleOpenPlanActions = (plan) => {
    if (!get(plan, "id")) {
      return;
    }

    setIsPlansDrawerOpen(false);
    navigateToWorkoutChild(`/user/workout/plans/edit/${get(plan, "id")}`);
  };

  const handleRequestDeletePlan = (plan) => {
    setDeletingPlan(plan);
  };

  const handleDeletePlan = async () => {
    if (!deletingPlan?.id) {
      return;
    }

    try {
      await removePlan(deletingPlan.id);
      toast.success("Workout reja o'chirildi");
      setDeletingPlan(null);
      setIsPlansDrawerOpen(false);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Workout rejani o'chirib bo'lmadi",
      );
    }
  };

  return (
    <PageTransition mode="slide-up">
      <div className="flex flex-col gap-6">
        <div className={"flex md:justify-end"}>
          <DateNav
            date={date}
            onChange={handleDateChange}
            format={"short"}
            className={
              "shadow md:shadow-none flex-1 md:flex-none rounded-2xl flex justify-between"
            }
          />
        </div>
        {workoutPlans.length > 0 ? (
          <div
            role="button"
            tabIndex={0}
            onClick={() => setIsPlansDrawerOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setIsPlansDrawerOpen(true);
              }
            }}
            className="rounded-[2rem] border p-4 sm:p-5 transition-colors hover:bg-accent/40"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Mening rejalarim
                </p>
                <h3 className="mt-1 truncate text-base font-black">
                  {activePlan?.name || "Reja tanlang"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {workoutPlans.length} ta reja •{" "}
                  {activePlan?.status === "active"
                    ? "Faol reja"
                    : "Saqlangan reja"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {activePlan?.status === "active" ? (
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-green-500/10">
                    <CheckIcon className="size-5 text-green-500" />
                  </div>
                ) : (
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-500/10">
                    <div className="size-2.5 rounded-full bg-amber-500" />
                  </div>
                )}
                <ChevronRightIcon className="size-5 text-muted-foreground" />
              </div>
            </div>
          </div>
        ) : (
          <div
            role="button"
            tabIndex={0}
            onClick={() => setIsPlansDrawerOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setIsPlansDrawerOpen(true);
              }
            }}
            className="rounded-[2rem] border border-dashed p-5 transition-colors hover:bg-accent/30"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Mening rejalarim
                </p>
                <h3 className="mt-1 text-base font-black">
                  Workout rejasi yo'q
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tayyor shablon tanlang yoki maxsus reja yarating
                </p>
              </div>
              <ChevronRightIcon className="size-5 shrink-0 text-muted-foreground" />
            </div>
          </div>
        )}

        <TrackingPageLayout
          aside={
            <div className="space-y-6">
              <section className="rounded-[28px] border bg-card p-5 shadow-sm sm:p-6">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Bugungi xulosa
                  </p>
                  <h2 className="mt-2 text-xl font-black tracking-tight">
                    {activePlan
                      ? get(activePlan, "name")
                      : "Mashg'ulot rejasini tanlang"}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {activePlan
                      ? get(activePlan, "description") ||
                        `${selectedDateLabel} uchun workout ritmi shu reja bilan boshqariladi.`
                      : "Tayyor shablon tanlang yoki o'zingiz uchun maxsus workout plan tuzing."}
                  </p>
                </div>

                {activePlan ? (
                  <div className="mt-5 space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {get(activePlan, "difficulty") ? (
                        <Badge
                          variant="outline"
                          className={formatDifficultyTone(
                            get(activePlan, "difficulty"),
                          )}
                        >
                          {get(activePlan, "difficulty")}
                        </Badge>
                      ) : null}
                      {get(activePlan, "daysPerWeek") ? (
                        <Badge variant="outline">
                          {get(activePlan, "daysPerWeek")} kun / hafta
                        </Badge>
                      ) : null}
                      {get(activePlan, "days") ? (
                        <Badge variant="outline">
                          {get(activePlan, "days")} kunlik plan
                        </Badge>
                      ) : null}
                    </div>

                    <div className="rounded-[24px] border border-border/60 bg-muted/20 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            Progress
                          </p>
                          <p className="mt-2 text-2xl font-black tracking-tight">
                            {get(activePlan, "progress") ?? 0}%
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-right">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                              Bajarilgan
                            </p>
                            <p className="mt-1 text-lg font-bold">
                              {completedWorkouts}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                              Qolgan
                            </p>
                            <p className="mt-1 text-lg font-bold">
                              {remainingWorkouts}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-primary/10">
                        <div
                          className="h-full rounded-full bg-primary transition-[width]"
                          style={{
                            width: `${max([0, Math.min(100, get(activePlan, "progress") ?? 0)])}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-[22px] border border-border/60 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          7 kun
                        </p>
                        <p className="mt-2 text-xl font-black">
                          {weeklyStats.count}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          mashq kuni
                        </p>
                      </div>
                      <div className="rounded-[22px] border border-border/60 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Hajm
                        </p>
                        <p className="mt-2 text-xl font-black">
                          {formatDuration(weeklyStats.duration)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          jami vaqt
                        </p>
                      </div>
                      <div className="rounded-[22px] border border-border/60 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Kaloriya
                        </p>
                        <p className="mt-2 text-xl font-black">
                          {weeklyStats.calories}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          kcal sarf
                        </p>
                      </div>
                      <div className="rounded-[22px] border border-border/60 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          PR
                        </p>
                        <p className="mt-2 text-xl font-black">
                          {personalRecordCount}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          rekord
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      <Button onClick={handleStartSession}>
                        <PlayIcon className="mr-2 size-4" aria-hidden="true" />
                        Sessiyani boshlash
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleQuickLog(null)}
                      >
                        <PlusIcon className="mr-2 size-4" aria-hidden="true" />
                        Tezkor log
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 rounded-[24px] border border-dashed bg-muted/20 p-5">
                    <p className="text-sm font-medium">
                      Hozircha faol plan yo&apos;q.
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Rejalar draweridan tayyor shablon tanlang yoki maxsus reja
                      yarating.
                    </p>
                    <div className="mt-5 grid grid-cols-1 gap-2">
                      <Button onClick={() => setIsPlansDrawerOpen(true)}>
                        Reja tanlash
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleQuickLog()}
                      >
                        Tezkor log
                      </Button>
                    </div>
                  </div>
                )}
              </section>
            </div>
          }
        >
          <section className="rounded-[28px] border bg-card p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 border-b border-border/60 pb-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Bugungi mashqlar
                  </p>
                  <h2 className="mt-2 text-xl font-black tracking-tight">
                    {selectedDaySchedule
                      ? get(selectedDaySchedule, "focus") ||
                        get(selectedDaySchedule, "day")
                      : get(selectedDateLogs, "length") > 0
                        ? "Bugungi log qilingan mashqlar"
                        : activePlan
                          ? `${selectedDayName} dam olish kuni`
                          : "Bugungi mashg'ulot hali tanlanmagan"}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedDateLabel}
                  </p>
                </div>

                {selectedDaySchedule ? (
                  <Badge
                    variant="outline"
                    className="w-fit border-primary/20 bg-primary/10 text-primary"
                  >
                    {get(filteredExercises, "length")} mashq
                  </Badge>
                ) : get(selectedDateLogs, "length") > 0 ? (
                  <Badge
                    variant="outline"
                    className="w-fit border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  >
                    {get(selectedDateLogs, "length")} mashq log qilingan
                  </Badge>
                ) : null}
              </div>

              {get(displayedExercises, "length") > 0 ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      {get(focusStats, "planned")} reja mashq
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    >
                      {get(focusStats, "completed")} bajarilgan
                    </Badge>
                    {get(focusStats, "freeLogs") > 0 ? (
                      <Badge variant="outline">
                        {get(focusStats, "freeLogs")} erkin log
                      </Badge>
                    ) : null}
                    {get(focusStats, "sessions") > 0 ? (
                      <Badge variant="outline">
                        {get(focusStats, "sessions")} sessiya
                      </Badge>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative flex-1">
                      <Label htmlFor="workout-search" className="sr-only">
                        Mashq qidirish
                      </Label>
                      <SearchIcon
                        className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <Input
                        id="workout-search"
                        name="workoutSearch"
                        autoComplete="off"
                        placeholder="Mashq qidiring…"
                        className="pl-9"
                        value={searchQuery}
                        onChange={(event) =>
                          setSearchQuery(get(event, "target.value"))
                        }
                      />
                    </div>
                    <div className="flex gap-2">
                      {activePlan ? (
                        <Button variant="outline" onClick={handleStartSession}>
                          <PlayIcon
                            className="mr-2 size-4"
                            aria-hidden="true"
                          />
                          Sessiya
                        </Button>
                      ) : null}
                      <Button
                        variant="outline"
                        onClick={() => handleQuickLog()}
                      >
                        <PlusIcon className="mr-2 size-4" aria-hidden="true" />
                        Log
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="pt-5">
              {!activePlan && get(selectedDateLogs, "length") === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed bg-muted/20 px-6 py-14 text-center">
                  <DumbbellIcon
                    className="mb-4 size-12 text-muted-foreground/30"
                    aria-hidden="true"
                  />
                  <h3 className="text-lg font-bold">Faol reja yo&apos;q</h3>
                  <p className="mt-2 max-w-md text-sm text-muted-foreground">
                    Mashg&apos;ulot sahifasi to&apos;liq ishlashi uchun avval
                    reja tanlang yoki maxsus reja yarating.
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-3">
                    <Button onClick={() => setIsPlansDrawerOpen(true)}>
                      Reja Tanlash
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleOpenPlanBuilder(null)}
                    >
                      Maxsus Reja
                    </Button>
                  </div>
                </div>
              ) : get(displayedExercises, "length") > 0 ? (
                get(filteredExercises, "length") > 0 ? (
                  <div className="space-y-3">
                    <Accordion
                      type="multiple"
                      value={expandedExercises}
                      onValueChange={setExpandedExercises}
                      className="space-y-3 overflow-visible rounded-none border-0 bg-transparent"
                    >
                      {map(filteredExercises, (exercise, index) => (
                        <AccordionItem
                          key={get(exercise, "name")}
                          value={get(exercise, "name")}
                          className="overflow-hidden rounded-[22px] border border-border/60 bg-background not-last:border-b-0 data-open:bg-primary/[0.03]"
                        >
                          <AccordionTrigger className="gap-3 px-4 py-3.5 hover:no-underline">
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <span className="text-sm font-black">
                                  {index + 1}
                                </span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex min-w-0 flex-wrap items-center gap-2">
                                  <p className="truncate text-base font-bold">
                                    {get(exercise, "name")}
                                  </p>
                                  {get(exercise, "loggedToday") ? (
                                    <Badge
                                      variant="outline"
                                      className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                    >
                                      {get(exercise, "loggedOnly")
                                        ? "Log qilingan"
                                        : "Bajarilgan"}
                                    </Badge>
                                  ) : null}
                                </div>
                                <p className="mt-1 truncate text-xs text-muted-foreground">
                                  {formatExerciseSummary(exercise)}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                                  <span className="rounded-full border px-2 py-0.5">
                                    {get(exercise, "loggedMeta.totalSets") ||
                                      getExerciseSetCount(exercise)}{" "}
                                    set
                                  </span>
                                  {get(exercise, "loggedMeta.weight") ? (
                                    <span className="rounded-full border px-2 py-0.5">
                                      {get(exercise, "loggedMeta.weight")} kg
                                    </span>
                                  ) : null}
                                  {get(
                                    exercise,
                                    "loggedMeta.durationSeconds",
                                  ) ? (
                                    <span className="rounded-full border px-2 py-0.5">
                                      {formatWorkoutDurationSeconds(
                                        get(
                                          exercise,
                                          "loggedMeta.durationSeconds",
                                        ),
                                      )}
                                    </span>
                                  ) : null}
                                  {get(
                                    exercise,
                                    "loggedMeta.distanceMeters",
                                  ) ? (
                                    <span className="rounded-full border px-2 py-0.5">
                                      {formatWorkoutDistanceMeters(
                                        get(
                                          exercise,
                                          "loggedMeta.distanceMeters",
                                        ),
                                      )}
                                    </span>
                                  ) : null}
                                  {get(exercise, "rest") ? (
                                    <span className="rounded-full border px-2 py-0.5">
                                      {get(exercise, "rest")}s dam
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          </AccordionTrigger>

                          <AccordionContent className="pt-0">
                            <div className="space-y-3 border-t border-border/60 pt-4">
                              {!get(exercise, "loggedOnly") ? (
                                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                  <span className="rounded-full border border-border/60 bg-muted/20 px-2 py-1">
                                    Reja: {getExerciseDisplaySummary(exercise)}
                                  </span>
                                  {get(exercise, "rest") ? (
                                    <span className="rounded-full border border-border/60 bg-muted/20 px-2 py-1">
                                      {get(exercise, "rest")}s dam
                                    </span>
                                  ) : null}
                                </div>
                              ) : null}

                              {get(exercise, "loggedGroups.length") ? (
                                <div className="overflow-hidden rounded-2xl border border-border/60">
                                  {map(
                                    get(exercise, "loggedGroups"),
                                    (group, groupIndex) => (
                                      <div
                                        key={get(group, "groupKey")}
                                        className="border-b border-border/60 p-3 last:border-b-0"
                                      >
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                              <p className="text-sm font-semibold">
                                                {groupIndex + 1}-marta
                                                bajarilgan
                                              </p>
                                              <span className="rounded-full border bg-muted/20 px-2 py-1 text-[11px] text-muted-foreground">
                                                {get(group, "items.length")} set
                                              </span>
                                              {get(group, "durationSeconds") ? (
                                                <span className="rounded-full border bg-muted/20 px-2 py-1 text-[11px] text-muted-foreground">
                                                  {formatWorkoutDurationSeconds(
                                                    get(
                                                      group,
                                                      "durationSeconds",
                                                    ),
                                                  )}
                                                </span>
                                              ) : null}
                                              {get(group, "distanceMeters") ? (
                                                <span className="rounded-full border bg-muted/20 px-2 py-1 text-[11px] text-muted-foreground">
                                                  {formatWorkoutDistanceMeters(
                                                    get(
                                                      group,
                                                      "distanceMeters",
                                                    ),
                                                  )}
                                                </span>
                                              ) : null}
                                            </div>
                                            {get(group, "sessionName") &&
                                            get(group, "sessionName") !==
                                              "Alohida mashq" ? (
                                              <p className="mt-1 text-xs text-muted-foreground">
                                                {get(group, "sessionName")}
                                              </p>
                                            ) : null}
                                          </div>

                                          <div className="flex items-center gap-2">
                                            <Button
                                              variant="outline"
                                              size="icon"
                                              aria-label={`${get(group, "name")} logini tahrirlash`}
                                              onClick={() =>
                                                handleEditLogGroup(group)
                                              }
                                            >
                                              <PencilIcon
                                                className="size-4"
                                                aria-hidden="true"
                                              />
                                            </Button>
                                            <Button
                                              variant="outline"
                                              size="icon"
                                              aria-label={`${get(group, "name")} logini o'chirish`}
                                              onClick={() =>
                                                setDeletingLogGroup(group)
                                              }
                                            >
                                              <Trash2Icon
                                                className="size-4"
                                                aria-hidden="true"
                                              />
                                            </Button>
                                          </div>
                                        </div>

                                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                          {map(
                                            get(group, "items"),
                                            (item, itemIndex) => (
                                              <span
                                                key={get(item, "id")}
                                                className="rounded-full border border-border/60 bg-background px-2 py-1"
                                              >
                                                {itemIndex + 1}-set •{" "}
                                                {formatLoggedSetLabel(
                                                  item,
                                                  get(group, "trackingType"),
                                                )}
                                              </span>
                                            ),
                                          )}
                                        </div>
                                      </div>
                                    ),
                                  )}
                                </div>
                              ) : (
                                <div className="rounded-2xl border border-dashed bg-muted/20 px-4 py-5 text-sm text-muted-foreground">
                                  Hali bu mashq bo&apos;yicha log saqlanmagan.
                                </div>
                              )}

                              <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => handleQuickLog(exercise)}
                              >
                                <PlusIcon
                                  className="mr-2 size-4"
                                  aria-hidden="true"
                                />
                                {get(exercise, "loggedGroups.length")
                                  ? "Yana log qo'shish"
                                  : "Log qilish"}
                              </Button>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleQuickLog()}
                    >
                      <PlusIcon className="mr-2 size-4" aria-hidden="true" />
                      Mashq Qo&apos;shish
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed bg-muted/20 px-6 py-12 text-center">
                    <SearchIcon
                      className="mb-4 size-10 text-muted-foreground/30"
                      aria-hidden="true"
                    />
                    <h3 className="text-lg font-bold">Mashq topilmadi</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Qidiruv bo&apos;yicha mashq chiqmadi. So&apos;rovni
                      qisqartiring yoki yangi mashq qo&apos;shing.
                    </p>
                    <div className="mt-5 flex flex-wrap justify-center gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setSearchQuery("")}
                      >
                        Qidiruvni Tozalash
                      </Button>
                      <Button onClick={() => handleQuickLog()}>
                        <PlusIcon className="mr-2 size-4" aria-hidden="true" />
                        Mashq Qo&apos;shish
                      </Button>
                    </div>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed bg-muted/20 px-6 py-14 text-center">
                  <CalendarDaysIcon
                    className="mb-4 size-12 text-muted-foreground/30"
                    aria-hidden="true"
                  />
                  <h3 className="text-lg font-bold">{selectedDayName}</h3>
                  <p className="mt-2 max-w-md text-sm text-muted-foreground">
                    Bu kun uchun rejalashtirilgan mashg&apos;ulot yo&apos;q.
                    Agar xohlasangiz, bugunni erkin sessiya sifatida log
                    qilishingiz mumkin.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-5"
                    onClick={() => handleQuickLog()}
                  >
                    Tezkor Sessiya Qo&apos;shish
                  </Button>
                </div>
              )}
            </div>
          </section>
          <WorkoutAnalyticsSection
            weeklyStats={weeklyStats}
            personalRecordCount={personalRecordCount}
            recentWorkoutDays={recentWorkoutDays}
            topPersonalRecords={topPersonalRecords}
          />
        </TrackingPageLayout>
      </div>

      <Drawer
        open={isPlansDrawerOpen}
        onOpenChange={setIsPlansDrawerOpen}
        direction="bottom"
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Mening rejalarim</DrawerTitle>
            <DrawerDescription>
              Mashg&apos;ulot rejasini tanlang yoki yangisini yarating
            </DrawerDescription>
          </DrawerHeader>
          <PlansTab
            plans={workoutPlans}
            templates={readyTemplates}
            activePlan={activePlan}
            onDeletePlan={handleRequestDeletePlan}
            onEditPlan={handleOpenPlanActions}
            onStartPlan={handleStartPlan}
            onOpenPlanBuilder={handleOpenPlanBuilder}
            onStartSession={() => {
              setIsPlansDrawerOpen(false);
              handleStartSession();
            }}
            isRemovingPlan={isRemovingPlan}
          />
        </DrawerContent>
      </Drawer>

      <SessionDrawer
        open={sessionDrawerOpen}
        onOpenChange={setSessionDrawerOpen}
        plan={activePlan}
        initialDayIdx={sessionInitialDayIdx}
        dateKey={selectedDateKey}
      />

      <Outlet />

      <AlertDialog
        open={Boolean(deletingLogGroup)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingLogGroup(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Workout logni o&apos;chirasizmi?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deletingLogGroup?.name
                ? `"${deletingLogGroup.name}" bo'yicha saqlangan barcha set loglari o'chiriladi.`
                : "Tanlangan workout log o'chiriladi."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingWorkoutLog}>
              Bekor qilish
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeletingWorkoutLog}
              onClick={handleDeleteLogGroup}
            >
              O&apos;chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(deletingPlan)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingPlan(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Workout rejani o&apos;chirasizmi?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deletingPlan?.name
                ? `"${deletingPlan.name}" rejasi butunlay o'chiriladi. Bu amalni ortga qaytarib bo'lmaydi.`
                : "Tanlangan workout reja butunlay o'chiriladi."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemovingPlan}>
              Bekor qilish
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isRemovingPlan}
              onClick={handleDeletePlan}
            >
              O&apos;chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  );
};

export default Index;
