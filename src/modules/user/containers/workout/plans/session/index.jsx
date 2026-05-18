import React from "react";
import {
  get,
  map,
  max,
  reduce,
  size,
  every,
  filter,
  find,
  isArray,
  toNumber,
  trim,
  some,
} from "lodash";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import {
  ArrowLeftIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DumbbellIcon,
  MoreVerticalIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  TimerIcon,
  XIcon,
} from "lucide-react";
import PageLoader from "@/components/page-loader/index.jsx";
import PageTransition from "@/components/page-transition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import {
  NumberField,
  NumberFieldGroup,
  NumberFieldInput,
  NumberFieldDecrement,
  NumberFieldIncrement,
} from "@/components/reui/number-field";
import { getTodayKey } from "@/hooks/app/use-daily-tracking";
import {
  useWorkoutPlanDetail,
  useWorkoutExerciseCategories,
  useWorkoutExercises,
} from "@/hooks/app/use-workout-plans";
import {
  useFinishWorkoutSession,
  useStartWorkoutSession,
  useUpdateWorkoutSessionProgress,
  useWorkoutSessionDraft,
} from "@/hooks/app/use-workout-sessions";
import { cn } from "@/lib/utils";
import {
  createWorkoutSetTemplate,
  getWorkoutTrackingFields,
  normalizeWorkoutTrackingType,
} from "@/lib/workout-tracking";
import {
  deriveWorkoutPlanMetrics,
  getExerciseDisplaySummary,
  getExerciseRestSeconds,
  normalizeExerciseSets,
} from "../../utils";

const parseDayIndex = (value) => {
  const parsed = toNumber(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : -1;
};

const formatTimer = (seconds, { long = false } = {}) => {
  const total = Math.max(0, toNumber(seconds) || 0);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (long || hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const useRestTimer = (onComplete) => {
  const [seconds, setSeconds] = React.useState(0);
  const [running, setRunning] = React.useState(false);
  const [endsAt, setEndsAt] = React.useState(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (!running) {
      return undefined;
    }

    if (seconds <= 0) {
      setRunning(false);
      setEndsAt(null);
      if (typeof onComplete === "function") {
        onComplete();
      }
      return undefined;
    }

    const id = window.setInterval(() => {
      setSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(id);
  }, [onComplete, running, seconds]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const start = React.useCallback((value) => {
    const nextSeconds = Math.max(0, toNumber(value) || 0);
    if (nextSeconds <= 0) {
      setRunning(false);
      setSeconds(0);
      setEndsAt(null);
      return;
    }

    setSeconds(nextSeconds);
    setRunning(true);
    setEndsAt(Date.now() + nextSeconds * 1000);
  }, []);

  const stop = React.useCallback(() => {
    setRunning(false);
    setSeconds(0);
    setEndsAt(null);
  }, []);

  const addTime = React.useCallback((value) => {
    const extraSeconds = Math.max(0, toNumber(value) || 0);
    if (extraSeconds <= 0) {
      return;
    }

    setSeconds((current) => current + extraSeconds);
    setEndsAt((current) => {
      const now = Date.now();
      const base = typeof current === "number" && current > now ? current : now;
      return base + extraSeconds * 1000;
    });
    setRunning(true);
  }, []);

  const restore = React.useCallback(({ seconds: savedSeconds, endsAt: savedEndsAt }) => {
    const parsedEndsAt = savedEndsAt ? new Date(savedEndsAt).getTime() : null;
    const fallbackSeconds = Math.max(0, toNumber(savedSeconds) || 0);
    const remainingSeconds = Number.isFinite(parsedEndsAt)
      ? Math.max(0, Math.ceil((parsedEndsAt - Date.now()) / 1000))
      : fallbackSeconds;

    if (remainingSeconds <= 0) {
      setRunning(false);
      setSeconds(0);
      setEndsAt(null);
      return;
    }

    setRunning(true);
    setSeconds(remainingSeconds);
    setEndsAt(
      Number.isFinite(parsedEndsAt) ? parsedEndsAt : Date.now() + remainingSeconds * 1000,
    );
  }, []);

  return {
    seconds,
    running,
    endsAt,
    start,
    stop,
    addTime,
    restore,
  };
};

const formatLocalTime = (timestamp) =>
  new Intl.DateTimeFormat("uz-UZ", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(timestamp));

const formatDateTimeLocal = (timestamp) => {
  const date = new Date(timestamp);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const getExerciseEquipment = (exercise) =>
  get(exercise, "equipment") ||
  get(exercise, "equipments[0]") ||
  get(exercise, "category") ||
  "Bodyweight";

const buildSessionExercises = (day) =>
  map(get(day, "exercises", []), (exercise, index) => ({
    ...exercise,
    _id: `${get(exercise, "id") || get(exercise, "name")}-${index}`,
    sets: normalizeExerciseSets(exercise),
    skipped: Boolean(get(exercise, "skipped")),
  }));

const normalizeRestoredSessionExercises = (draftExercises = []) =>
  map(draftExercises, (exercise, index) => ({
    ...exercise,
    _id:
      get(exercise, "_id") ||
      `${get(exercise, "id") || get(exercise, "name")}-${index}`,
    sets: normalizeExerciseSets(exercise),
    skipped: Boolean(get(exercise, "skipped")),
  }));

const buildSessionReplacementExercise = (exercise) => ({
  id: get(exercise, "id", null),
  exerciseId: get(exercise, "id", null),
  name: get(exercise, "name"),
  imageUrl: get(exercise, "imageUrl", null),
  equipment:
    get(exercise, "equipments[0]") || get(exercise, "equipment") || get(exercise, "category"),
  category: get(exercise, "category", ""),
  trackingType: normalizeWorkoutTrackingType(get(exercise, "trackingType")),
  defaultSets: get(exercise, "defaultSets", 3),
  defaultReps: get(exercise, "defaultReps", null),
  defaultDurationSeconds: get(exercise, "defaultDurationSeconds", null),
  defaultDistanceMeters: get(exercise, "defaultDistanceMeters", null),
  rest: get(exercise, "defaultRest") || get(exercise, "defaultRestSeconds") || 60,
  sets: normalizeExerciseSets({
    ...exercise,
    sets: Array.from(
      { length: get(exercise, "defaultSets", 3) },
      () => createWorkoutSetTemplate(exercise),
    ),
  }),
  skipped: false,
});

const getSessionDraftStorageKey = (planId, dayIndex) =>
  `liveon:workout-session:${planId}:${dayIndex}`;

const getSessionSummaryStorageKey = (planId, dayIndex) =>
  `liveon:workout-session-summary:${planId}:${dayIndex}`;

const readSessionDraft = (storageKey) => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(storageKey);
    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

const writeSessionDraft = (storageKey, payload) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(payload));
  } catch {
    // Ignore storage quota / serialization issues for draft persistence.
  }
};

const clearSessionDraft = (storageKey) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(storageKey);
};

const writeSessionSummary = (planId, dayIndex, payload) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(
      getSessionSummaryStorageKey(planId, dayIndex),
      JSON.stringify(payload),
    );
  } catch {
    // Ignore storage issues for summary hand-off.
  }
};

const toTimestamp = (value) => {
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
};

const getSetValue = (set, key) => {
  const value = toNumber(get(set, key) || 0);
  return Number.isFinite(value) ? value : 0;
};

const getCompletedSetEntries = (exercises) =>
  exercises.flatMap((exercise) =>
    filter(map(get(exercise, "sets", []), (set, setIndex) =>
      get(set, "done")
        ? {
            exerciseKey: get(exercise, "_id"),
            exerciseName: get(exercise, "name"),
            exerciseId: get(exercise, "id", null),
            imageUrl: get(exercise, "imageUrl", null),
            trackingType: normalizeWorkoutTrackingType(get(exercise, "trackingType")),
            setIndex,
            reps: getSetValue(set, "reps"),
            weight: getSetValue(set, "weight"),
            durationSeconds: getSetValue(set, "durationSeconds"),
            distanceMeters: getSetValue(set, "distanceMeters"),
          }
        : null,
    ), Boolean),
  );

const toExerciseCatalogId = (exercise) => {
  const candidate = toNumber(get(exercise, "exerciseId") ?? get(exercise, "id"));
  return Number.isInteger(candidate) && candidate > 0 ? candidate : undefined;
};

const SessionDurationDrawer = ({
  open,
  onOpenChange,
  elapsed,
  sessionStartTime,
  onSave,
}) => {
  const [mode, setMode] = React.useState("auto");
  const [startValue, setStartValue] = React.useState("");
  const [endValue, setEndValue] = React.useState("");

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (!open) return;
    setMode("auto");
    setStartValue(formatDateTimeLocal(sessionStartTime));
    setEndValue(formatDateTimeLocal(sessionStartTime + elapsed * 1000));
  }, [elapsed, open, sessionStartTime]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const startMs = new Date(startValue).getTime();
  const endMs = new Date(endValue).getTime();
  const manualDuration =
    Number.isFinite(startMs) && Number.isFinite(endMs)
      ? Math.max(0, Math.floor((endMs - startMs) / 1000))
      : 0;

  const handleSave = () => {
    if (mode === "manual") {
      if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
        toast.error("Boshlanish va tugash vaqtini tekshiring");
        return;
      }

      onSave({ startMs, endMs });
    }

    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-md">
        <DrawerHeader className="px-6 pb-2 pt-5">
          <div className="flex items-start justify-between gap-4">
            <DrawerTitle className="text-2xl font-black">Duration</DrawerTitle>
            <p className="text-2xl font-black tabular-nums text-primary">
              {formatTimer(mode === "manual" ? manualDuration : elapsed, {
                long: true,
              })}
            </p>
          </div>
        </DrawerHeader>
        <DrawerBody className="space-y-5 px-6 pb-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-3xl border border-primary/25 bg-primary p-4 text-primary-foreground shadow-sm">
              <p className="text-sm font-semibold text-primary-foreground/80">Start</p>
              <p className="mt-2 text-xl font-black tabular-nums">
                {formatLocalTime(mode === "manual" && Number.isFinite(startMs) ? startMs : sessionStartTime)}
              </p>
              <p className="mt-1 text-sm font-medium text-primary-foreground/80">
                Bugun
              </p>
            </div>
            <div className="rounded-3xl border bg-muted/50 p-4">
              <p className="text-sm font-semibold text-muted-foreground">End</p>
              <p className="mt-2 text-xl font-black tabular-nums">
                {formatLocalTime(
                  mode === "manual" && Number.isFinite(endMs)
                    ? endMs
                    : sessionStartTime + elapsed * 1000,
                )}
              </p>
              <p className="mt-1 text-sm font-medium text-muted-foreground">Bugun</p>
            </div>
          </div>

          <div className="rounded-3xl border bg-muted/30 p-4">
            <p className="text-base font-black">Start time</p>
            <div className="mt-4 grid grid-cols-2 overflow-hidden rounded-2xl border bg-background">
              <button
                type="button"
                className={cn(
                  "flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold",
                  mode === "auto" && "bg-primary/10 text-primary",
                )}
                onClick={() => setMode("auto")}
              >
                <CheckIcon className={cn("size-4", mode !== "auto" && "opacity-30")} />
                Auto
              </button>
              <button
                type="button"
                className={cn(
                  "flex items-center justify-center gap-2 border-l px-4 py-3 text-sm font-bold",
                  mode === "manual" && "bg-primary/10 text-primary",
                )}
                onClick={() => setMode("manual")}
              >
                Manual
              </button>
            </div>
          </div>

          {mode === "manual" ? (
            <div className="grid gap-3">
              <label className="space-y-1.5">
                <span className="text-sm font-semibold">Boshlanish vaqti</span>
                <Input
                  type="datetime-local"
                  value={startValue}
                  onChange={(event) => setStartValue(event.target.value)}
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-semibold">Tugash vaqti</span>
                <Input
                  type="datetime-local"
                  value={endValue}
                  onChange={(event) => setEndValue(event.target.value)}
                />
              </label>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed bg-muted/20 px-5 py-8 text-center">
              <p className="text-base font-black text-muted-foreground">
                Manual tanlasangiz vaqtni o'zgartira olasiz
              </p>
            </div>
          )}
        </DrawerBody>
        <DrawerFooter className="grid grid-cols-2 gap-3 px-6 pb-6">
          <Button variant="secondary" size="lg" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button size="lg" onClick={handleSave}>
            Saqlash
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

const SessionExerciseCard = ({
  exercise,
  expanded,
  onToggle,
  onUpdateSet,
  onToggleSet,
  onAddSet,
  onOpenActions,
}) => {
  const sets = get(exercise, "sets", []);
  const doneCount = filter(sets, (set) => get(set, "done")).length;
  const trackingType = normalizeWorkoutTrackingType(get(exercise, "trackingType"));
  const fields = getWorkoutTrackingFields(trackingType);
  const hasImage = Boolean(get(exercise, "imageUrl"));

  return (
    <Card className="overflow-hidden rounded-3xl border-0 bg-card shadow-sm ring-1 ring-border">
      <div className="flex items-start gap-3 px-4 py-4">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-start gap-3 text-left"
          onClick={onToggle}
        >
          <span className="mt-1 flex size-8 shrink-0 items-center justify-center text-muted-foreground">
            {expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
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
              <DumbbellIcon className="text-primary" />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-black leading-tight">
              {get(exercise, "name")} · {getExerciseEquipment(exercise)}
            </span>
            <span className="mt-1 block text-base font-medium text-muted-foreground">
              {get(exercise, "skipped") ? "Skipped" : `${doneCount}/${size(sets)} Done`}
            </span>
          </span>
        </button>
        <button
          type="button"
          className="mt-2 text-muted-foreground"
          onClick={onOpenActions}
          aria-label={`${get(exercise, "name")} actions`}
        >
          <MoreVerticalIcon className="size-5" />
        </button>
      </div>
      {expanded && !get(exercise, "skipped") ? (
        <div className="space-y-3 px-4 pb-4">
          {map(sets, (set, setIndex) => (
            <div
              key={setIndex}
              className={cn(
                "grid items-center gap-3 rounded-3xl bg-muted/40 p-3",
                size(fields) === 1
                  ? "grid-cols-[32px_32px_1fr]"
                  : "grid-cols-[32px_32px_1fr_1fr]",
              )}
            >
              <button
                type="button"
                onClick={() => onToggleSet(setIndex)}
                className={cn(
                  "flex size-7 items-center justify-center rounded-full border bg-background",
                  get(set, "done") && "border-primary bg-primary text-primary-foreground",
                )}
                aria-label={`Set ${setIndex + 1}`}
              >
                {get(set, "done") ? <CheckIcon className="size-4" /> : null}
              </button>
              <span className="text-center text-lg font-black">{setIndex + 1}</span>
              {map(fields, (field) => (
                <div
                  key={get(field, "key")}
                  className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-2xl bg-background px-2 py-1.5"
                >
                  <NumberField
                    value={toNumber(get(set, get(field, "key"))) || undefined}
                    onValueChange={(value) =>
                      onUpdateSet(setIndex, get(field, "key"), value)
                    }
                    min={get(field, "min")}
                    step={get(field, "step")}
                  >
                    <NumberFieldGroup className="border-0 bg-transparent shadow-none">
                      <NumberFieldDecrement className="hidden" />
                      <NumberFieldInput className="h-9 text-center text-xl font-black" />
                      <NumberFieldIncrement className="hidden" />
                    </NumberFieldGroup>
                  </NumberField>
                  <span className="text-sm font-black uppercase">
                    {get(field, "key") === "weight"
                      ? "KG"
                      : get(field, "key") === "reps"
                        ? "Reps"
                        : get(field, "key") === "durationSeconds"
                          ? "Sec"
                          : "M"}
                  </span>
                </div>
              ))}
            </div>
          ))}

          <Button
            variant="secondary"
            size="lg"
            className="w-full rounded-3xl"
            onClick={onAddSet}
          >
            <PlusIcon data-icon="inline-start" />
            Add a set
          </Button>
        </div>
      ) : null}
    </Card>
  );
};

const WorkoutPlanSessionPage = () => {
  const { planId, dayIndex: dayIndexParam } = useParams();
  const navigate = useNavigate();
  const dayIndex = parseDayIndex(dayIndexParam);
  const { plan: rawPlan, isLoading, isError, refetch } = useWorkoutPlanDetail(
    planId,
    { enabled: Boolean(planId) },
  );
  const { finishSession, isPending: isSavingSession } = useFinishWorkoutSession();
  const { categories: workoutCategories } = useWorkoutExerciseCategories({
    enabled: Boolean(planId),
  });
  const { draft: remoteDraft } = useWorkoutSessionDraft(planId, dayIndex, {
    enabled: Boolean(planId) && dayIndex >= 0,
  });
  const { startSession } = useStartWorkoutSession();
  const [exerciseActionsId, setExerciseActionsId] = React.useState(null);
  const [replaceDrawerOpen, setReplaceDrawerOpen] = React.useState(false);
  const [replaceSearch, setReplaceSearch] = React.useState("");
  const [replaceCategory, setReplaceCategory] = React.useState(null);
  const { exercises: replacementExercises } = useWorkoutExercises(
    {
      categoryId: replaceCategory || undefined,
      query: trim(replaceSearch) || undefined,
    },
    {
      enabled: Boolean(planId) && replaceDrawerOpen,
    },
  );
  const {
    updateProgress: updateWorkoutSessionProgress,
    isPending: isUpdatingWorkoutSessionProgress,
  } = useUpdateWorkoutSessionProgress();
  const plan = React.useMemo(() => deriveWorkoutPlanMetrics(rawPlan), [rawPlan]);
  const schedule = isArray(get(plan, "schedule")) ? get(plan, "schedule") : [];
  const selectedDay = dayIndex >= 0 ? get(schedule, `[${dayIndex}]`) : null;
  const sessionDraftStorageKey = React.useMemo(
    () => getSessionDraftStorageKey(planId, dayIndex),
    [dayIndex, planId],
  );
  const [exercises, setExercises] = React.useState([]);
  const [expandedExerciseId, setExpandedExerciseId] = React.useState(null);
  const [timerStartedAt, setTimerStartedAt] = React.useState(() => Date.now());
  const [sessionStartTime, setSessionStartTime] = React.useState(() => Date.now());
  const [elapsed, setElapsed] = React.useState(0);
  const [durationDrawerOpen, setDurationDrawerOpen] = React.useState(false);
  const [serverSessionId, setServerSessionId] = React.useState(null);
  const [remoteDraftPersistenceEnabled, setRemoteDraftPersistenceEnabled] =
    React.useState(true);
  const restoredDraftRef = React.useRef(null);
  const startRequestKeyRef = React.useRef(null);
  const failedStartRequestKeyRef = React.useRef(null);
  const restTimer = useRestTimer(() => {
    toast.success("Dam olish vaqti tugadi", {
      description: "Keyingi setga tayyorlaning.",
    });
  });

  /*
   * Session restore/start effects initialize local workout draft state from
   * persisted local/remote session snapshots.
   */
  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (!selectedDay) return;
    const localDraft = readSessionDraft(sessionDraftStorageKey);
    const localSavedAt = toNumber(get(localDraft, "savedAt")) || 0;
    const remoteSavedAt = toTimestamp(get(remoteDraft, "lastSyncedAt")) || 0;
    const draft =
      remoteSavedAt > localSavedAt
        ? {
            ...remoteDraft,
            dayIndex,
            elapsed: get(remoteDraft, "elapsedSeconds", 0),
            savedAt: remoteSavedAt,
          }
        : localDraft;
    const draftExercises = isArray(get(draft, "exercises"))
      ? get(draft, "exercises")
      : null;
    const shouldRestore =
      get(draft, "planId") === planId &&
      get(draft, "dayIndex") === dayIndex &&
      size(draftExercises) > 0;

    if (shouldRestore) {
      const restoredExercises = normalizeRestoredSessionExercises(draftExercises);
      const restoredServerSessionId = get(draft, "id") || null;
      setServerSessionId(restoredServerSessionId);
      setRemoteDraftPersistenceEnabled(Boolean(restoredServerSessionId));
      const restoredElapsed = Math.max(0, toNumber(get(draft, "elapsed")) || 0);
      const restoredStartTime =
        toNumber(get(draft, "sessionStartTime")) || Date.now() - restoredElapsed * 1000;

      setExercises(restoredExercises);
      setExpandedExerciseId(
        get(draft, "expandedExerciseId") || get(restoredExercises, "[0]._id", null),
      );
      setSessionStartTime(restoredStartTime);
      setTimerStartedAt(Date.now() - restoredElapsed * 1000);
      setElapsed(restoredElapsed);
      restTimer.restore({
        seconds: get(draft, "restSecondsRemaining", 0),
        endsAt: get(draft, "restEndsAt", null),
      });

      if (restoredDraftRef.current !== sessionDraftStorageKey) {
        restoredDraftRef.current = sessionDraftStorageKey;
        toast.info("Oldingi workout sessiyasi tiklandi");
      }

      return;
    }

    const initialExercises = buildSessionExercises(selectedDay);
    setExercises(initialExercises);
    setExpandedExerciseId(get(initialExercises, "[0]._id", null));
    const now = Date.now();
    setTimerStartedAt(now);
    setSessionStartTime(now);
    setElapsed(0);
    const remoteSessionId = get(remoteDraft, "id") || null;
    setServerSessionId(remoteSessionId);
    setRemoteDraftPersistenceEnabled(Boolean(remoteSessionId) || !remoteDraft);
    restTimer.stop();
    restoredDraftRef.current = null;
    clearSessionDraft(sessionDraftStorageKey);
  }, [
    dayIndex,
    planId,
    remoteDraft,
    restTimer.restore,
    restTimer.stop,
    selectedDay,
    sessionDraftStorageKey,
  ]);

  React.useEffect(() => {
    if (!selectedDay || !planId || dayIndex < 0) {
      return;
    }

    const requestKey = `${planId}:${dayIndex}`;
    if (get(remoteDraft, "id")) {
      setServerSessionId(get(remoteDraft, "id"));
      setRemoteDraftPersistenceEnabled(true);
      startRequestKeyRef.current = requestKey;
      failedStartRequestKeyRef.current = null;
      return;
    }

    if (startRequestKeyRef.current === requestKey) {
      return;
    }

    if (failedStartRequestKeyRef.current === requestKey) {
      return;
    }

    startRequestKeyRef.current = requestKey;
    Promise.resolve(startSession(planId, dayIndex))
      .then((draft) => {
        if (get(draft, "id")) {
          setServerSessionId(get(draft, "id"));
          setRemoteDraftPersistenceEnabled(true);
        } else {
          setRemoteDraftPersistenceEnabled(false);
        }
        failedStartRequestKeyRef.current = null;
      })
      .catch(() => {
        failedStartRequestKeyRef.current = requestKey;
        setRemoteDraftPersistenceEnabled(false);
      });
  }, [dayIndex, planId, remoteDraft, selectedDay, startSession]);
  /* eslint-enable react-hooks/set-state-in-effect */

  React.useEffect(() => {
    const id = setInterval(
      () => setElapsed(Math.floor((Date.now() - timerStartedAt) / 1000)),
      1000,
    );
    return () => clearInterval(id);
  }, [timerStartedAt]);

  React.useEffect(() => {
    if (!selectedDay || size(exercises) === 0) {
      return undefined;
    }

    const persistDraft = () => {
      const payload = {
        planId,
        dayIndex,
        dayKey:
          get(selectedDay, "day") ||
          get(selectedDay, "focus") ||
          `Day ${dayIndex + 1}`,
        sessionStartTime,
        elapsed,
        expandedExerciseId,
        restSecondsRemaining: restTimer.seconds,
        restEndsAt: restTimer.endsAt ? new Date(restTimer.endsAt).toISOString() : null,
        exercises,
        savedAt: Date.now(),
      };

      writeSessionDraft(sessionDraftStorageKey, payload);
      if (
        remoteDraftPersistenceEnabled &&
        serverSessionId &&
        !isUpdatingWorkoutSessionProgress
      ) {
        Promise.resolve(
          updateWorkoutSessionProgress(serverSessionId, {
            planDayKey: payload.dayKey,
            sessionStartTime: new Date(sessionStartTime).toISOString(),
            elapsedSeconds: elapsed,
            expandedExerciseId,
            restSecondsRemaining: restTimer.seconds,
            restEndsAt: restTimer.endsAt ? new Date(restTimer.endsAt).toISOString() : null,
            exercises,
          }),
        )
          .then((draft) => {
            if (get(draft, "id")) {
              setServerSessionId(get(draft, "id"));
              setRemoteDraftPersistenceEnabled(true);
            } else {
              setRemoteDraftPersistenceEnabled(false);
            }
          })
          .catch(() => {
            setRemoteDraftPersistenceEnabled(false);
          });
      }
    };

    persistDraft();
    const persistInterval = window.setInterval(persistDraft, 5000);
    window.addEventListener("beforeunload", persistDraft);

    return () => {
      window.clearInterval(persistInterval);
      window.removeEventListener("beforeunload", persistDraft);
    };
  }, [
    dayIndex,
    elapsed,
    exercises,
    expandedExerciseId,
    isUpdatingWorkoutSessionProgress,
    planId,
    remoteDraftPersistenceEnabled,
    selectedDay,
    serverSessionId,
    sessionDraftStorageKey,
    sessionStartTime,
    updateWorkoutSessionProgress,
    restTimer.endsAt,
    restTimer.seconds,
  ]);

  const totalSets = reduce(
    exercises,
    (total, exercise) =>
      get(exercise, "skipped") ? total : total + size(get(exercise, "sets", [])),
    0,
  );
  const doneSets = reduce(
    exercises,
    (total, exercise) =>
      get(exercise, "skipped")
        ? total
        : total + filter(get(exercise, "sets", []), (set) => get(set, "done")).length,
    0,
  );
  const allDone = totalSets > 0 && doneSets === totalSets;
  const focus = get(selectedDay, "focus") || get(selectedDay, "day") || get(plan, "name");
  const selectedExercise = find(exercises, (exercise) => get(exercise, "_id") === expandedExerciseId);
  const actionExercise = find(exercises, (exercise) => get(exercise, "_id") === exerciseActionsId);

  const updateSet = (exerciseId, setIndex, field, value) => {
    setExercises((current) =>
      map(current, (exercise) =>
        get(exercise, "_id") === exerciseId
          ? {
              ...exercise,
              sets: map(get(exercise, "sets", []), (set, index) =>
                index === setIndex
                  ? { ...set, [field]: value === undefined ? "" : String(value) }
                  : set,
              ),
            }
          : exercise,
      ),
    );
  };

  const toggleSet = (exerciseId, setIndex) => {
    let shouldStartRest = false;
    let restSeconds = 0;

    setExercises((current) =>
      map(current, (exercise) => {
        if (get(exercise, "_id") !== exerciseId) {
          return exercise;
        }

        restSeconds = getExerciseRestSeconds(exercise);

        return {
          ...exercise,
          sets: map(get(exercise, "sets", []), (set, index) =>
            index === setIndex
              ? (() => {
                  const nextDone = !get(set, "done");
                  if (nextDone) {
                    shouldStartRest = true;
                  }

                  return { ...set, done: nextDone };
                })()
              : set,
          ),
        };
      }),
    );

    if (shouldStartRest && restSeconds > 0) {
      restTimer.start(restSeconds);
    }
  };

  const addSet = (exerciseId) => {
    setExercises((current) =>
      map(current, (exercise) => {
        if (get(exercise, "_id") !== exerciseId) return exercise;
        const sets = get(exercise, "sets", []);
        const nextSet = createWorkoutSetTemplate(exercise, sets[size(sets) - 1]);

        return {
          ...exercise,
          sets: [
            ...sets,
            {
              reps: String(nextSet.reps || ""),
              weight: String(nextSet.weight || ""),
              durationSeconds: String(nextSet.durationSeconds || ""),
              distanceMeters: String(nextSet.distanceMeters || ""),
              done: false,
            },
          ],
        };
      }),
    );
  };

  const skipExercise = (exerciseId) => {
    setExercises((current) =>
      map(current, (exercise) =>
        get(exercise, "_id") === exerciseId
          ? {
              ...exercise,
              skipped: !get(exercise, "skipped"),
              sets: map(get(exercise, "sets", []), (set) => ({
                ...set,
                done: false,
              })),
            }
          : exercise,
      ),
    );
    restTimer.stop();
    setExerciseActionsId(null);
    toast.success(
      get(actionExercise, "skipped")
        ? "Mashq qayta faollashtirildi"
        : "Mashq skip qilindi",
    );
  };

  const replaceExercise = (replacement) => {
    if (!exerciseActionsId) {
      return;
    }

    setExercises((current) =>
      map(current, (exercise) =>
        get(exercise, "_id") === exerciseActionsId
          ? {
              ...buildSessionReplacementExercise(replacement),
              _id: get(exercise, "_id"),
            }
          : exercise,
      ),
    );
    setExpandedExerciseId(exerciseActionsId);
    setReplaceDrawerOpen(false);
    setExerciseActionsId(null);
    setReplaceSearch("");
    setReplaceCategory(null);
    restTimer.stop();
    toast.success("Mashq almashtirildi");
  };

  const toggleAllForExpanded = () => {
    if (!selectedExercise || get(selectedExercise, "skipped")) return;
    const sets = get(selectedExercise, "sets", []);
    const shouldComplete = !every(sets, (set) => get(set, "done"));

    setExercises((current) =>
      map(current, (exercise) =>
        get(exercise, "_id") === get(selectedExercise, "_id")
          ? {
              ...exercise,
              sets: map(get(exercise, "sets", []), (set) => ({
                ...set,
                done: shouldComplete,
              })),
            }
          : exercise,
      ),
    );

    if (shouldComplete) {
      const restSeconds = getExerciseRestSeconds(selectedExercise);
      if (restSeconds > 0) {
        restTimer.start(restSeconds);
      }
    }
  };

  const logNextSet = () => {
    if (allDone) {
      handleFinish();
      return;
    }

    let nextExerciseId = null;
    let nextSetIndex = -1;

    for (const exercise of exercises) {
      if (get(exercise, "skipped")) {
        continue;
      }
      const index = get(exercise, "sets", []).findIndex((set) => !get(set, "done"));
      if (index >= 0) {
        nextExerciseId = get(exercise, "_id");
        nextSetIndex = index;
        break;
      }
    }

    if (!nextExerciseId || nextSetIndex < 0) return;
    setExpandedExerciseId(nextExerciseId);
    toggleSet(nextExerciseId, nextSetIndex);
  };

  const handleDurationSave = ({ startMs, endMs }) => {
    const manualSeconds = Math.floor((endMs - startMs) / 1000);
    setSessionStartTime(startMs);
    setTimerStartedAt(Date.now() - manualSeconds * 1000);
    setElapsed(manualSeconds);
  };

  const handleFinish = async () => {
    const completedSetEntries = getCompletedSetEntries(exercises);

    if (size(completedSetEntries) === 0) {
      toast.error("Kamida 1 ta setni bajarilgan deb belgilang");
      return;
    }

    const durationMinutes = max([1, Math.round(elapsed / 60)]);
    const estimatedCalories = Math.round(durationMinutes * 6.5);
    const totalVolumeKg = reduce(
      completedSetEntries,
      (total, set) => total + toNumber(get(set, "reps") || 0) * toNumber(get(set, "weight") || 0),
      0,
    );
    const completedExerciseCount = filter(exercises, (exercise) =>
      !get(exercise, "skipped") && some(get(exercise, "sets", []), (set) => get(set, "done"))).length;
    const exerciseSummaries = filter(map(exercises, (exercise) => {
        if (get(exercise, "skipped")) {
          return null;
        }

        const completedSets = filter(
          completedSetEntries,
          (set) => get(set, "exerciseKey") === get(exercise, "_id"),
        );

        if (size(completedSets) === 0) {
          return null;
        }

        return {
          exerciseKey: get(exercise, "_id"),
          exerciseName: get(exercise, "name"),
          completedSets: size(completedSets),
          totalReps: reduce(completedSets, (total, set) => total + toNumber(get(set, "reps") || 0), 0),
          totalVolumeKg: reduce(completedSets, (total, set) =>
            total +
            toNumber(get(set, "reps") || 0) * toNumber(get(set, "weight") || 0), 0),
          distanceMeters: reduce(
            completedSets,
            (total, set) => total + toNumber(get(set, "distanceMeters") || 0),
            0,
          ),
        };
      }), Boolean);
    const exerciseLogs = exercises.flatMap((exercise) => {
      if (get(exercise, "skipped")) return [];

      const completedExerciseSets = filter(
        completedSetEntries,
        (set) => get(set, "exerciseKey") === get(exercise, "_id"),
      );

      if (size(completedExerciseSets) === 0) return [];

      return [
        {
          date: getTodayKey(),
          source: "session",
          name: get(exercise, "name"),
          exerciseId:
            get(completedExerciseSets, "[0].exerciseId") ??
            get(exercise, "id") ??
            undefined,
          planId: get(plan, "id") ?? undefined,
          planDayIndex: dayIndex,
          planDayKey:
            get(selectedDay, "day") ||
            get(selectedDay, "focus") ||
            `Day ${dayIndex + 1}`,
          sessionName:
            get(plan, "name") || get(selectedDay, "focus") || "Mashg'ulot sessiyasi",
          trackingType:
            get(completedExerciseSets, "[0].trackingType") ??
            get(exercise, "trackingType") ??
            "REPS_WEIGHT",
          imageUrl:
            get(completedExerciseSets, "[0].imageUrl") ??
            get(exercise, "imageUrl") ??
            undefined,
          entries: map(completedExerciseSets, (set) => ({
            sets: 1,
            reps: toNumber(get(set, "reps") || 0),
            weight: toNumber(get(set, "weight") || 0),
            durationSeconds: toNumber(get(set, "durationSeconds") || 0),
            distanceMeters: toNumber(get(set, "distanceMeters") || 0),
          })),
        },
      ];
    });

    const sessionExercises = map(exercises, (exercise, exerciseIndex) => {
      const completedExerciseSets = filter(
        completedSetEntries,
        (set) => get(set, "exerciseKey") === get(exercise, "_id"),
      );

      return {
        exerciseKey: get(exercise, "_id"),
        exerciseCatalogId: toExerciseCatalogId(exercise),
        exerciseName: get(exercise, "name"),
        equipment: getExerciseEquipment(exercise),
        trackingType:
          get(completedExerciseSets, "[0].trackingType") ??
          get(exercise, "trackingType") ??
          "REPS_WEIGHT",
        imageUrl:
          get(completedExerciseSets, "[0].imageUrl") ??
          get(exercise, "imageUrl") ??
          undefined,
        orderIndex: exerciseIndex,
        skipped: Boolean(get(exercise, "skipped")),
        completedSets: size(completedExerciseSets),
        totalSets: size(get(exercise, "sets", [])),
        totalReps: reduce(
          completedExerciseSets,
          (total, set) => total + toNumber(get(set, "reps") || 0),
          0,
        ),
        totalVolumeKg: reduce(completedExerciseSets, (total, set) =>
          total +
          toNumber(get(set, "reps") || 0) * toNumber(get(set, "weight") || 0), 0),
        distanceMeters: reduce(
          completedExerciseSets,
          (total, set) => total + toNumber(get(set, "distanceMeters") || 0),
          0,
        ),
        restSeconds: getExerciseRestSeconds(exercise),
        sets: map(get(exercise, "sets", []), (set, setIndex) => ({
          setIndex,
          reps: toNumber(get(set, "reps") || 0),
          weight: toNumber(get(set, "weight") || 0),
          durationSeconds: toNumber(get(set, "durationSeconds") || 0),
          distanceMeters: toNumber(get(set, "distanceMeters") || 0),
          restSeconds: getExerciseRestSeconds(exercise),
          completed: Boolean(get(set, "done")),
          skipped: Boolean(get(exercise, "skipped")),
          completedAt: get(set, "done") ? new Date().toISOString() : null,
        })),
      };
    });

    let remainingDuration = durationMinutes;
    let remainingCalories = estimatedCalories;
    const logs = map(exerciseLogs, (item, index) => {
      if (index === size(exerciseLogs) - 1) {
        return {
          ...item,
          entries: map(get(item, "entries", []), (entry, entryIndex, entries) => ({
            ...entry,
            durationMinutes: entryIndex === size(entries) - 1 ? remainingDuration : 0,
            burnedCalories: entryIndex === size(entries) - 1 ? remainingCalories : 0,
          })),
        };
      }

      const itemDuration = Math.min(
        remainingDuration,
        max([0, Math.round(durationMinutes / max([1, size(exerciseLogs)]))]),
      );
      const itemCalories = Math.min(
        remainingCalories,
        max([0, Math.round(estimatedCalories / max([1, size(exerciseLogs)]))]),
      );
      remainingDuration -= itemDuration;
      remainingCalories -= itemCalories;

      return {
        ...item,
        entries: map(get(item, "entries", []), (entry, entryIndex, entries) => ({
          ...entry,
          durationMinutes: entryIndex === size(entries) - 1 ? itemDuration : 0,
          burnedCalories: entryIndex === size(entries) - 1 ? itemCalories : 0,
        })),
      };
    });

    try {
      await finishSession(planId, dayIndex, {
        planName: get(plan, "name") || "Workout plan",
        focus,
        startedAt: new Date(sessionStartTime).toISOString(),
        endedAt: new Date(sessionStartTime + elapsed * 1000).toISOString(),
        durationSeconds: elapsed,
        estimatedCalories,
        totalVolumeKg,
        totalSets,
        completedSets: size(completedSetEntries),
        exerciseCount: size(exercises),
        completedExerciseCount,
        exerciseSummaries,
        sessionExercises,
        logs,
      });
      restTimer.stop();
      clearSessionDraft(sessionDraftStorageKey);
      const summaryPayload = {
        planId,
        dayIndex,
        planName: get(plan, "name") || "Workout plan",
        focus,
        durationMinutes,
        estimatedCalories,
        totalSets,
        completedSets: size(completedSetEntries),
        exerciseCount: size(exercises),
        completedExerciseCount,
        totalVolumeKg,
        exerciseSummaries,
        completedAt: new Date().toISOString(),
      };
      writeSessionSummary(planId, dayIndex, summaryPayload);
      toast.success("Mashg'ulot yakunlandi", {
        description: `${durationMinutes} daqiqa, ${estimatedCalories} kcal.`,
      });
      navigate(`/user/workout/plans/${planId}/days/${dayIndex}/session/summary`, {
        replace: true,
        state: {
          summary: summaryPayload,
        },
      });
    } catch (error) {
      toast.error(
        get(error, "response.data.message") ||
          "Mashg'ulot logini saqlashda xatolik yuz berdi",
      );
    }
  };

  if (isLoading && !plan) {
    return <PageLoader />;
  }

  if (isError || !plan) {
    return (
      <PageTransition mode="slide-up">
        <div className="relative mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col bg-muted/30 md:rounded-[2rem] md:ring-1 md:ring-border">
          <header className="flex items-start gap-3 border-b bg-background/95 px-4 py-4 backdrop-blur md:rounded-t-[2rem]">
            <Button
              variant="ghost"
              size="icon"
              className="mt-1 rounded-full"
              onClick={() => navigate(`/user/workout/plans/${planId}/days/${dayIndex}`)}
              aria-label="Ortga"
            >
              <ArrowLeftIcon />
            </Button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold">
                Day {dayIndex + 1}-Workout session
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Reja ma'lumotlari yuklanmadi
              </p>
            </div>
          </header>
          <main className="flex flex-1 flex-col px-3 py-4">
            <Card>
              <CardHeader>
                <CardTitle>Workout reja topilmadi</CardTitle>
                <CardDescription>Reja o'chirilgan yoki sizda unga ruxsat yo'q.</CardDescription>
              </CardHeader>
              <CardFooter className="gap-2">
                <Button onClick={() => refetch()}>Qayta urinish</Button>
                <Button variant="outline" onClick={() => navigate("/user/workout/plans")}>
                  Rejalarga qaytish
                </Button>
              </CardFooter>
            </Card>
          </main>
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
            <CardDescription>Tanlangan kun bu reja schedule ro'yxatida mavjud emas.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" onClick={() => navigate(`/user/workout/plans/${planId}`)}>
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
      <div className="relative mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col bg-muted/30 pb-24 md:rounded-[2rem] md:ring-1 md:ring-border">
        <header className="sticky top-0 z-20 flex items-start gap-3 border-b bg-background/95 px-4 py-4 backdrop-blur md:rounded-t-[2rem]">
          <Button
            variant="ghost"
            size="icon"
            className="mt-1 rounded-full"
            onClick={() => navigate(`/user/workout/plans/${planId}/days/${dayIndex}`)}
            aria-label="Ortga"
          >
            <ArrowLeftIcon />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold">
              Day {dayIndex + 1}-{focus}
            </p>
            <div className="mt-0.5 flex items-center gap-2">
              <p className="text-4xl font-black tabular-nums leading-none">
                {formatTimer(elapsed)}
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full text-muted-foreground"
                onClick={() => setDurationDrawerOpen(true)}
                aria-label="Duration edit"
              >
                <PencilIcon className="size-4" />
              </Button>
            </div>
          </div>
          <Badge variant="secondary" className="mt-2">
            {doneSets}/{totalSets}
          </Badge>
        </header>

        <main className="flex flex-1 flex-col gap-3 px-3 py-4">
          {size(exercises) > 0 ? (
            map(exercises, (exercise) => (
              <SessionExerciseCard
                key={get(exercise, "_id")}
                exercise={exercise}
                expanded={expandedExerciseId === get(exercise, "_id")}
                onToggle={() =>
                  setExpandedExerciseId((current) =>
                    current === get(exercise, "_id") ? null : get(exercise, "_id"),
                  )
                }
                onUpdateSet={(setIndex, field, value) =>
                  updateSet(get(exercise, "_id"), setIndex, field, value)
                }
                onToggleSet={(setIndex) => toggleSet(get(exercise, "_id"), setIndex)}
                onAddSet={() => addSet(get(exercise, "_id"))}
                onOpenActions={() => setExerciseActionsId(get(exercise, "_id"))}
              />
            ))
          ) : (
            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle>Mashqlar yo'q</CardTitle>
                <CardDescription>
                  Bu workout kuni uchun avval rejaga mashqlar qo'shing.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </main>

        <div
          className={cn(
            "pointer-events-none fixed inset-x-0 bottom-20 z-30 px-4 transition-all duration-300 md:absolute md:bottom-[5.75rem]",
            restTimer.running
              ? "translate-y-0 opacity-100"
              : "translate-y-3 opacity-0",
          )}
        >
          <div className="pointer-events-auto mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-3xl border bg-background px-4 py-3 shadow-lg ring-1 ring-border">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <TimerIcon className="size-5" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                  Dam olish vaqti
                </p>
                <p className="text-2xl font-black tabular-nums">
                  {formatTimer(restTimer.seconds)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                className="rounded-2xl font-black"
                onClick={() => restTimer.addTime(15)}
              >
                +15s
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-2xl"
                onClick={restTimer.stop}
                aria-label="Rest timer stop"
              >
                <XIcon className="size-5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 px-4 py-3 backdrop-blur md:absolute md:rounded-b-[2rem]">
          <div className="mx-auto grid max-w-3xl grid-cols-[76px_1fr] gap-3">
            <Button
              variant="secondary"
              className="h-14 flex-col gap-0 rounded-2xl text-xs font-black"
              onClick={toggleAllForExpanded}
              disabled={!selectedExercise || get(selectedExercise, "skipped")}
            >
              <CheckIcon className="size-5" />
              ALL
            </Button>
            <Button
              className="h-14 rounded-2xl text-base font-black"
              onClick={logNextSet}
              disabled={isSavingSession || size(exercises) === 0}
            >
              {allDone ? "MASHG'ULOTNI YAKUNLASH" : "LOG NEXT SET"}
            </Button>
          </div>
        </div>

        <SessionDurationDrawer
          open={durationDrawerOpen}
          onOpenChange={setDurationDrawerOpen}
          elapsed={elapsed}
          sessionStartTime={sessionStartTime}
          onSave={handleDurationSave}
        />

        <Drawer
          open={Boolean(exerciseActionsId) && !replaceDrawerOpen}
          onOpenChange={(open) => {
            if (!open) {
              setExerciseActionsId(null);
            }
          }}
          direction="bottom"
        >
          <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-md">
            <DrawerHeader className="px-6 pb-3 pt-5">
              <DrawerTitle className="text-xl font-black">
                {get(actionExercise, "name") || "Mashq"}
              </DrawerTitle>
            </DrawerHeader>
            <DrawerBody className="space-y-3 px-6 pb-2">
              <Button
                variant="secondary"
                size="lg"
                className="w-full justify-start rounded-3xl"
                onClick={() => skipExercise(exerciseActionsId)}
              >
                {get(actionExercise, "skipped") ? "Skip bekor qilish" : "Mashqni skip qilish"}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="w-full justify-start rounded-3xl"
                onClick={() => setReplaceDrawerOpen(true)}
              >
                Mashqni almashtirish
              </Button>
            </DrawerBody>
            <DrawerFooter className="px-6 pb-6">
              <Button variant="outline" size="lg" onClick={() => setExerciseActionsId(null)}>
                Yopish
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        <Drawer
          open={replaceDrawerOpen}
          onOpenChange={(open) => {
            setReplaceDrawerOpen(open);
            if (!open) {
              setReplaceSearch("");
              setReplaceCategory(null);
            }
          }}
          direction="bottom"
        >
          <DrawerContent className="mx-auto flex max-h-[85dvh] data-[vaul-drawer-direction=bottom]:md:max-w-lg">
            <DrawerHeader className="px-6 pb-3 pt-5">
              <DrawerTitle className="text-xl font-black">Mashqni almashtirish</DrawerTitle>
            </DrawerHeader>
            <DrawerBody className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-6 pb-2">
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={replaceSearch}
                  onChange={(event) => setReplaceSearch(event.target.value)}
                  placeholder="Mashq qidirish..."
                  className="rounded-2xl pl-10"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                <Button
                  type="button"
                  variant={!replaceCategory ? "default" : "secondary"}
                  className="rounded-full"
                  onClick={() => setReplaceCategory(null)}
                >
                  Barchasi
                </Button>
                {map(workoutCategories, (category) => (
                  <Button
                    key={get(category, "id")}
                    type="button"
                    variant={replaceCategory === get(category, "id") ? "default" : "secondary"}
                    className="rounded-full"
                    onClick={() => setReplaceCategory(get(category, "id"))}
                  >
                    {get(category, "name")}
                  </Button>
                ))}
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="space-y-2 pb-2">
                  {map(replacementExercises, (exercise) => (
                    <button
                      key={get(exercise, "id")}
                      type="button"
                      onClick={() => replaceExercise(exercise)}
                      className="flex w-full items-center gap-3 rounded-3xl border bg-background px-4 py-3 text-left shadow-sm transition hover:border-primary/40 hover:bg-primary/5"
                    >
                      <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted/40">
                        {get(exercise, "imageUrl") ? (
                          <img
                            src={get(exercise, "imageUrl")}
                            alt={get(exercise, "name")}
                            className="size-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <DumbbellIcon className="text-primary" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-base font-black">
                          {get(exercise, "name")}
                        </span>
                        <span className="block truncate text-sm text-muted-foreground">
                          {get(exercise, "category") || get(exercise, "equipments[0]") || "General"}
                        </span>
                      </span>
                    </button>
                  ))}
                  {size(replacementExercises) === 0 ? (
                    <Card className="rounded-3xl">
                      <CardHeader>
                        <CardTitle>Mos mashq topilmadi</CardTitle>
                        <CardDescription>
                          Qidiruv yoki kategoriya filtrini o'zgartirib ko'ring.
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ) : null}
                </div>
              </div>
            </DrawerBody>
            <DrawerFooter className="px-6 pb-6">
              <Button variant="outline" size="lg" onClick={() => setReplaceDrawerOpen(false)}>
                Bekor qilish
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    </PageTransition>
  );
};

export default WorkoutPlanSessionPage;
