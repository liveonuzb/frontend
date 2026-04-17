import React, {
  useState,
  useEffect,
  useCallback,
  useDeferredValue,
} from "react";
import {
  map,
  filter,
  some,
  reduce,
  find,
  findIndex,
  values,
  get,
  isArray,
  max,
  toLower,
  includes,
  trim,
  isNil,
  size,
  isEmpty,
  compact,
  slice,
  join,
} from "lodash";
import { toast } from "sonner";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  CheckIcon,
  PlusIcon,
  XIcon,
  SearchIcon,
  SparklesIcon,
  ChevronLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  TimerIcon,
  DumbbellIcon,
  InfoIcon,
  TargetIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ALL_EXERCISES } from "@/data/exercises.mock";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  NumberField,
  NumberFieldGroup,
  NumberFieldInput,
  NumberFieldDecrement,
  NumberFieldIncrement,
} from "@/components/reui/number-field";

import {
  getTodayKey,
} from "@/hooks/app/use-daily-tracking";
import { useCreateWorkoutLog } from "@/hooks/app/use-workout-logs";
import { useGetQuery } from "@/hooks/api";
import {
  getExerciseRestSeconds,
  getExerciseSetCount,
  normalizeExerciseSets,
} from "./utils";
import {
  createWorkoutSetTemplate,
  getWorkoutExerciseSummary,
  getWorkoutTrackingFields,
  normalizeWorkoutTrackingType,
} from "@/lib/workout-tracking";

// ─── Rest Timer ───────────────────────────────────────────────────────────────
const useRestTimer = (onComplete) => {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running || seconds <= 0) {
      if (running && seconds <= 0) {
        setRunning(false);
        if (!isNil(onComplete)) {
          onComplete();
        }
      }
      return;
    }
    const id = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [running, seconds, onComplete]);

  const start = useCallback((secs) => {
    setSeconds(secs);
    setRunning(true);
  }, []);

  const stop = useCallback(() => {
    setRunning(false);
    setSeconds(0);
  }, []);

  const addTime = useCallback((secs) => {
    setSeconds((s) => s + secs);
  }, []);

  return { seconds, running, start, stop, addTime };
};

const formatTime = (secs) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

// ─── Exercise Card (right panel) ─────────────────────────────────────────────
const ExerciseCard = ({
  exercise,
  exerciseDetails,
  onSetComplete,
  onRemove,
  onProgressChange,
}) => {
  const [sets, setSets] = useState(() => normalizeExerciseSets(exercise));

  const [isExpanded, setIsExpanded] = useState(true);
  const details = exerciseDetails || null;
  const trackingType = normalizeWorkoutTrackingType(
    get(exercise, "trackingType"),
  );
  const trackingFields = getWorkoutTrackingFields(trackingType);
  const setGridClass =
    size(trackingFields) === 1
      ? "grid grid-cols-[36px_1fr_40px] items-center gap-3 rounded-2xl border bg-background p-3 sm:grid-cols-[44px_1fr_48px]"
      : "grid grid-cols-[36px_1fr_1fr_40px] items-center gap-3 rounded-2xl border bg-background p-3 sm:grid-cols-[44px_1fr_1fr_48px]";

  useEffect(() => {
    setSets(normalizeExerciseSets(exercise));
  }, [exercise]);

  const updateSet = (i, field, value) => {
    // NumberField passes a number, we can store it directly or as string
    const valStr =
      value !== undefined && value !== null && !isNaN(value)
        ? String(value)
        : "";
    setSets((prev) =>
      map(prev, (s, idx) => (idx === i ? { ...s, [field]: valStr } : s)),
    );
  };

  const markDone = (i) => {
    const isDone = get(sets, `[${i}].done`);
    const newSets = map(sets, (s, idx) =>
      idx === i ? { ...s, done: !isDone } : s,
    );
    setSets(newSets);

    if (!isDone) {
      if (!isNil(onSetComplete)) {
        onSetComplete({
          exerciseKey: get(exercise, "_id"),
          exerciseName: get(exercise, "name"),
          exerciseId: get(exercise, "id", null),
          imageUrl: get(exercise, "imageUrl", null),
          trackingType,
          setIndex: i,
          done: true,
          reps: parseInt(get(newSets, `[${i}].reps`)) || 0,
          weight: parseFloat(get(newSets, `[${i}].weight`)) || 0,
          durationSeconds: parseInt(get(newSets, `[${i}].durationSeconds`)) || 0,
          distanceMeters: parseInt(get(newSets, `[${i}].distanceMeters`)) || 0,
          rest: getExerciseRestSeconds(exercise),
        });
      }
    } else {
      if (!isNil(onSetComplete)) {
        onSetComplete({
          exerciseKey: get(exercise, "_id"),
          exerciseName: get(exercise, "name"),
          exerciseId: get(exercise, "id", null),
          imageUrl: get(exercise, "imageUrl", null),
          trackingType,
          setIndex: i,
          done: false,
          reps: parseInt(get(newSets, `[${i}].reps`)) || 0,
          weight: parseFloat(get(newSets, `[${i}].weight`)) || 0,
          durationSeconds: parseInt(get(newSets, `[${i}].durationSeconds`)) || 0,
          distanceMeters: parseInt(get(newSets, `[${i}].distanceMeters`)) || 0,
          rest: getExerciseRestSeconds(exercise),
        });
      }
    }

    const doneCount = get(
      filter(newSets, (s) => get(s, "done")),
      "length",
    );
    if (!isNil(onProgressChange)) {
      onProgressChange(get(exercise, "_id"), doneCount, size(newSets));
    }
  };

  const addSet = () => {
    const nextTemplate = createWorkoutSetTemplate(
      exercise,
      get(sets, [size(sets) - 1]),
    );
    const newSets = [
      ...sets,
      {
        reps: String(nextTemplate.reps || ""),
        weight: String(nextTemplate.weight || ""),
        durationSeconds: String(nextTemplate.durationSeconds || ""),
        distanceMeters: String(nextTemplate.distanceMeters || ""),
        done: false,
      },
    ];
    setSets(newSets);
    if (!isNil(onProgressChange)) {
      onProgressChange(
        get(exercise, "_id"),
        get(filter(newSets, (s) => get(s, "done")), "length"),
        size(newSets),
      );
    }
    setIsExpanded(true); // expand when adding a set
  };

  const removeSet = (i) => {
    const newSets = filter(sets, (_, j) => j !== i);
    setSets(newSets);
    if (!isNil(onProgressChange)) {
      onProgressChange(
        get(exercise, "_id"),
        get(filter(newSets, (s) => get(s, "done")), "length"),
        size(newSets),
      );
    }
    setIsExpanded(true); // expand when adding a set
  };

  const doneCount = get(
    filter(sets, (s) => get(s, "done")),
    "length",
  );
  const isAllDone =
    doneCount === get(sets, "length") && get(sets, "length") > 0;

  return (
    <Card
      className={cn(
        "mb-4 overflow-hidden rounded-2xl border bg-background transition-all",
        isAllDone && "border-primary/30 bg-primary/[0.03]",
      )}
    >
      <div
        className="flex cursor-pointer select-none items-start justify-between gap-3 border-b p-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-2xl border bg-muted/20 text-primary",
              isAllDone && "border-primary/20 bg-primary/10",
            )}
          >
            {isAllDone ? (
              <CheckIcon className="size-5" />
            ) : (
              <DumbbellIcon className="size-5" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-bold">
                {get(exercise, "name")}
              </h3>
              <Badge variant="outline">
                {doneCount}/{get(sets, "length")} set
              </Badge>

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <InfoIcon className="size-3.5 text-muted-foreground" />
                  </Button>
                </DialogTrigger>
                <DialogContent
                  className="sm:max-w-md max-h-[90vh] overflow-y-auto rounded-3xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DialogHeader>
                    <DialogTitle className="text-xl font-black">
                      {get(exercise, "name")}
                    </DialogTitle>
                    <DialogDescription>
                      Mashqni to'g'ri bajarish bo'yicha ko'rsatma
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 pt-4">
                    {get(details, "imageUrl") ? (
                      <div className="aspect-video w-full bg-muted rounded-2xl overflow-hidden border shadow-inner">
                        <img
                          src={get(details, "imageUrl")}
                          alt={get(exercise, "name")}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video w-full bg-muted rounded-2xl border-dashed border-2 flex items-center justify-center text-muted-foreground flex-col">
                        <SparklesIcon className="size-8 mb-2 opacity-50" />
                        <p className="text-sm font-medium">Mashq rasmi yo'q</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-primary/5 p-3 rounded-2xl border border-primary/10">
                        <h4 className="font-black text-[10px] uppercase tracking-widest text-primary mb-2">
                          Asosiy muskullar
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {size(get(details, "targetMuscles")) > 0
                            ? map(get(details, "targetMuscles"), (m) => (
                                <Badge
                                  key={m}
                                  variant="secondary"
                                  className="text-[10px] bg-background border-primary/20"
                                >
                                  {m}
                                </Badge>
                              ))
                            : "—"}
                        </div>
                      </div>
                      <div className="bg-muted/30 p-3 rounded-2xl border border-border/50">
                        <h4 className="font-black text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                          Inventar
                        </h4>
                        <div className="flex flex-col gap-3">
                          {size(get(details, "equipmentImages")) > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {map(
                                get(details, "equipmentImages"),
                                (img, idx) => (
                                  <div
                                    key={idx}
                                    className="size-10 rounded-lg border bg-background overflow-hidden shadow-sm"
                                  >
                                    <img
                                      src={get(img, "url")}
                                      alt="equipment"
                                      className="size-full object-cover"
                                    />
                                  </div>
                                ),
                              )}
                            </div>
                          )}
                          <span className="text-xs font-bold">
                            {join(get(details, "equipments", []), ", ") || "—"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                            <TargetIcon className="size-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-0.5">
                              Maqsadli mushaklar
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {map(get(details, "targetMuscles", []), (muscle) => (
                                <Badge
                                  key={muscle}
                                  variant="secondary"
                                  className="h-5 px-1.5 text-[9px] font-bold uppercase"
                                >
                                  {muscle}
                                </Badge>
                              ))}
                              {isEmpty(get(details, "targetMuscles")) && (
                                <span className="text-xs font-bold text-foreground/40">
                                  Noma'lum
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {size(get(details, "equipmentImages")) > 0 && (
                          <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
                            {map(get(details, "equipmentImages"), (img, idx) => (
                              <div
                                key={idx}
                                className="relative size-20 shrink-0 overflow-hidden rounded-2xl border bg-muted/20"
                              >
                                <img
                                  src={get(img, "url")}
                                  alt="equipment"
                                  className="size-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                            <DumbbellIcon className="size-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-0.5">
                              Jihozlar
                            </p>
                            <p className="text-xs font-bold text-foreground">
                              {join(get(details, "equipments", []), ", ") || "Zarur emas"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-black text-sm flex items-center gap-2 text-foreground">
                          <span className="flex size-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <CheckIcon className="size-3.5" />
                          </span>
                          Bajarish texnikasi
                        </h4>
                        <div className="space-y-3 pl-1">
                          {size(get(details, "instructions")) > 0 ? (
                            map(get(details, "instructions"), (step, idx) => (
                              <div key={idx} className="flex gap-4 text-xs leading-relaxed">
                                <span className="font-black text-primary/40 tabular-nums shrink-0">
                                  {idx + 1}.
                                </span>
                                <p className="text-muted-foreground font-medium">
                                  {step}
                                </p>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-muted-foreground italic pl-8">
                              Yo'riqnoma mavjud emas
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              <span>{getWorkoutExerciseSummary(exercise)}</span>
              {get(exercise, "rest") ? (
                <span>• {get(exercise, "rest")}s dam</span>
              ) : null}
              {!isExpanded && doneCount > 0 && (
                <span className="rounded-full border bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                  {doneCount} yakunlangan
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              if (!isNil(onRemove)) {
                onRemove(get(exercise, "_id"));
              }
            }}
          >
            <XIcon className="size-5" />
          </Button>
          <div className="rounded-full p-1 text-muted-foreground">
            {isExpanded ? (
              <ChevronUpIcon className="size-5" />
            ) : (
              <ChevronDownIcon className="size-5" />
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4 p-4 pt-3">
          <div
            className={
              get(trackingFields, "length") === 1
                ? "grid grid-cols-[36px_1fr_40px] gap-3 border-b pb-2 sm:grid-cols-[44px_1fr_48px]"
                : "grid grid-cols-[36px_1fr_1fr_40px] gap-3 border-b pb-2 sm:grid-cols-[44px_1fr_1fr_48px]"
            }
          >
            <span className="text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Set
            </span>
            {map(trackingFields, (field) => (
              <span
                key={get(field, "key")}
                className="text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {get(field, "label")}
              </span>
            ))}
            <span />
          </div>

          {map(sets, (set, i) => (
            <div
              key={i}
              className={cn(
                setGridClass,
                get(set, "done") ? "border-primary/30 bg-primary/[0.04]" : "",
              )}
            >
              <div className="flex justify-center">
                <span
                  className={cn(
                    "rounded-xl border px-2 py-1 text-sm font-semibold",
                    get(set, "done")
                      ? "border-primary/20 bg-primary/10 text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  {i + 1}
                </span>
              </div>

              {map(trackingFields, (field) => (
                <NumberField
                  key={get(field, "key")}
                  value={Number(get(set, get(field, "key"))) || undefined}
                  onValueChange={(val) => updateSet(i, get(field, "key"), val)}
                  disabled={get(set, "done")}
                  min={get(field, "min")}
                  step={get(field, "step")}
                >
                  <NumberFieldGroup>
                    <NumberFieldDecrement />
                    <NumberFieldInput placeholder={get(field, "placeholder")} />
                    <NumberFieldIncrement />
                  </NumberFieldGroup>
                </NumberField>
              ))}

              <Button
                size="icon"
                variant={get(set, "done") ? "default" : "outline"}
                onClick={() => markDone(i)}
              >
                <CheckIcon
                  className={cn("size-4", get(set, "done") ? "" : "opacity-60")}
                />
              </Button>
            </div>
          ))}

          <div>
            <Button variant="outline" className="w-full" onClick={addSet}>
              <PlusIcon className="mr-2 size-4" />
              Yana set qo'shish
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SessionDrawer({
  open,
  onOpenChange,
  plan,
  initialDayIdx = 0,
  dateKey,
}) {
  const { createLog, isPending: isSavingSession } = useCreateWorkoutLog();
  const scheduleSource = isArray(get(plan, "schedule")) ? plan.schedule : [];
  const schedule = React.useMemo(() => {
    const scheduledDays = filter(
      scheduleSource,
      (day) => isArray(get(day, "exercises")) && size(get(day, "exercises")) > 0,
    );
    return size(scheduledDays) > 0 ? scheduledDays : scheduleSource;
  }, [scheduleSource]);
  const [selectedDayIdx, setSelectedDayIdx] = useState(initialDayIdx);
  const [dayExercises, setDayExercises] = useState({});
  const [completedSets, setCompletedSets] = useState({});
  const [elapsed, setElapsed] = useState(0);
  const [startTime, setStartTime] = useState(() => Date.now());
  const [progressData, setProgressData] = useState({}); // { exId: { done, total } }

  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const deferredSearch = useDeferredValue(toLower(trim(search)));

  const { data: exercisesData, isLoading: isLoadingExercises } = useGetQuery({
    url: "/coach/exercises",
    params: deferredSearch ? { search: deferredSearch } : undefined,
    queryProps: {
      queryKey: ["workout-exercises", "session-library", deferredSearch],
      enabled: isAddingExercise,
    },
  });

  const exerciseCatalog = React.useMemo(() => {
    if (
      isArray(get(exercisesData, "data")) &&
      size(get(exercisesData, "data")) > 0
    ) {
      return map(exercisesData.data, (exercise) => ({
        ...exercise,
        group: exercise.category || exercise.groupLabel || "General",
        groupLabel: exercise.category || exercise.groupLabel || "General",
        targetMuscles: isArray(exercise.targetMuscles)
          ? exercise.targetMuscles
          : [],
        equipments: isArray(exercise.equipments) ? exercise.equipments : [],
        instructions: isArray(exercise.instructions)
          ? exercise.instructions
          : [],
        equipmentImages: isArray(exercise.equipmentImages)
          ? exercise.equipmentImages
          : [],
      }));
    }

    return map(ALL_EXERCISES, (exercise, index) => ({
      id: exercise.id || `mock-${index}`,
      name: exercise.name,
      category: exercise.groupLabel || exercise.category || "General",
      group:
        exercise.group || exercise.groupLabel || exercise.category || "General",
      groupLabel: exercise.groupLabel || exercise.category || "General",
      imageUrl: exercise.imageUrl || null,
      emoji: exercise.emoji || "🏋️",
      trackingType: exercise.trackingType || "REPS_WEIGHT",
      defaultSets: exercise.defaultSets || 3,
      defaultReps: get(exercise, "defaultReps", 10),
      defaultDurationSeconds: get(exercise, "defaultDurationSeconds", 0),
      defaultDistanceMeters: get(exercise, "defaultDistanceMeters", 0),
      defaultRest: exercise.defaultRest || exercise.defaultRestSeconds || 60,
      defaultRestSeconds:
        exercise.defaultRestSeconds || exercise.defaultRest || 60,
      targetMuscles: isArray(exercise.targetMuscles)
        ? exercise.targetMuscles
        : [],
      equipments: isArray(exercise.equipments) ? exercise.equipments : [],
      instructions: isArray(exercise.instructions) ? exercise.instructions : [],
      equipmentImages: isArray(exercise.equipmentImages)
        ? exercise.equipmentImages
        : exercise.equipmentImageUrl
          ? [{ url: exercise.equipmentImageUrl }]
          : [],
    }));
  }, [get(exercisesData, "data")]);

  const restTimer = useRestTimer(() => {
    toast.success("Dam olish vaqti tugadi! Keyingi setga tayyorlaning 💪", {
      duration: 4000,
    });
    try {
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    } catch (e) {}
  });

  // Initialize exercises
  useEffect(() => {
    if (!open) return;
    const initial = {};
    const prog = {};
    schedule.forEach((day, idx) => {
      initial[idx] = map(get(day, "exercises") || [], (ex) => {
        const matchedExercise = find(
          exerciseCatalog,
          (item) =>
            toLower(String(item.name || "")) === toLower(String(ex.name || "")),
        );
        const id = `${ex.name}-${idx}-${Date.now()}`;
        prog[id] = { done: 0, total: getExerciseSetCount(ex) };
        return {
          ...ex,
          id: get(matchedExercise, "id") || get(ex, "id", null),
          name: get(matchedExercise, "name") || get(ex, "name"),
          imageUrl: get(matchedExercise, "imageUrl") || get(ex, "imageUrl", null),
          trackingType:
            get(matchedExercise, "trackingType") ||
            get(ex, "trackingType") ||
            "REPS_WEIGHT",
          defaultSets:
            get(matchedExercise, "defaultSets") ||
            get(ex, "defaultSets") ||
            3,
          defaultReps: get(matchedExercise, "defaultReps", get(ex, "defaultReps", null)),
          defaultDurationSeconds:
            get(matchedExercise, "defaultDurationSeconds") ||
            get(ex, "defaultDurationSeconds") ||
            null,
          defaultDistanceMeters:
            get(matchedExercise, "defaultDistanceMeters") ||
            get(ex, "defaultDistanceMeters") ||
            null,
          defaultRestSeconds:
            get(matchedExercise, "defaultRestSeconds") ||
            get(ex, "defaultRestSeconds") ||
            null,
          category: get(matchedExercise, "category", ""),
          group: get(matchedExercise, "group", ""),
          groupLabel:
            get(matchedExercise, "groupLabel") ||
            get(matchedExercise, "category") ||
            get(ex, "groupLabel") ||
            get(ex, "category") ||
            "Boshqa",
          targetMuscles: get(matchedExercise, "targetMuscles", []),
          equipments: get(matchedExercise, "equipments", []),
          instructions: get(matchedExercise, "instructions", []),
          equipmentImages: get(matchedExercise, "equipmentImages", []),
          _id: id,
        };
      });
    });
    setDayExercises(initial);
    setProgressData(prog);
    const requestedDayName = get(scheduleSource, `[${initialDayIdx}].day`);
    const matchedDayIdx = requestedDayName
      ? findIndex(schedule, (day) => get(day, "day") === requestedDayName)
      : initialDayIdx;
    setSelectedDayIdx(
      matchedDayIdx >= 0 && matchedDayIdx < get(schedule, "length")
        ? matchedDayIdx
        : 0,
    );
    setElapsed(0);
    setStartTime(Date.now());
    setCompletedSets({});
    setIsAddingExercise(false);
    restTimer.stop();
  }, [exerciseCatalog, open, plan, initialDayIdx, schedule, scheduleSource]);

  // Elapsed timer
  useEffect(() => {
    if (!open) return;
    const id = setInterval(
      () => setElapsed(Math.floor((Date.now() - startTime) / 1000)),
      1000,
    );
    return () => clearInterval(id);
  }, [open, startTime]);

  const currentExercises = dayExercises[selectedDayIdx] || [];
  const currentDay = schedule[selectedDayIdx];

  const totalCurrentSets = reduce(
    currentExercises,
    (acc, ex) =>
      acc + (get(progressData, `[${ex._id}].total`) || getExerciseSetCount(ex)),
    0,
  );
  const doneCurrentSets = reduce(
    currentExercises,
    (acc, ex) => acc + (get(progressData, `[${ex._id}].done`) || 0),
    0,
  );
  const overallProgress =
    totalCurrentSets > 0 ? (doneCurrentSets / totalCurrentSets) * 100 : 0;

  // Library logic
  const allMuscleGroups = React.useMemo(() => {
    const groups = Array.from(
      new Set(
        filter(
          map(
            exerciseCatalog,
            (exercise) =>
              exercise.groupLabel || exercise.category || exercise.group || "",
          ),
          Boolean,
        ),
      ),
    );

    return [
      { id: "all", label: "Barchasi" },
      ...map(groups, (group) => ({
        id: group,
        label: group,
      })),
    ];
  }, [exerciseCatalog]);

  const libraryExercises = React.useMemo(
    () =>
      map(exerciseCatalog, (exercise) => ({
        ...exercise,
        group:
          exercise.group ||
          exercise.category ||
          exercise.groupLabel ||
          "General",
        groupLabel: exercise.groupLabel || exercise.category || "General",
      })),
    [exerciseCatalog],
  );

  const filteredLibrary = filter(libraryExercises, (ex) => {
    const matchGroup = selectedGroup === "all" || ex.group === selectedGroup;
    const matchSearch =
      !deferredSearch || includes(toLower(ex.name), deferredSearch);
    return matchGroup && matchSearch;
  });

  const addedNames = new Set(map(currentExercises, (e) => get(e, "name")));
  const exerciseCatalogByName = React.useMemo(
    () =>
      new Map(
        map(exerciseCatalog, (exercise) => [
          toLower(String(exercise.name || "")),
          exercise,
        ]),
      ),
    [exerciseCatalog],
  );
  const completedExerciseCount = get(
    filter(currentExercises, (exercise) => {
      const exerciseProgress = get(progressData, get(exercise, "_id"));
      return (
        get(exerciseProgress, "total", 0) > 0 &&
        get(exerciseProgress, "done") === get(exerciseProgress, "total")
      );
    }),
    "length",
  );

  const handleAddFromLibrary = (exercise) => {
    const _id = `${get(exercise, "name")}-${Date.now()}`;
    const trackingType = normalizeWorkoutTrackingType(
      get(exercise, "trackingType"),
    );
    const defaultSets = max([1, Number(get(exercise, "defaultSets") || 1)]);
    const newEx = {
      id: get(exercise, "id", null),
      name: get(exercise, "name"),
      defaultSets: get(exercise, "defaultSets", null),
      defaultReps: get(exercise, "defaultReps", null),
      defaultDurationSeconds: get(exercise, "defaultDurationSeconds", null),
      defaultDistanceMeters: get(exercise, "defaultDistanceMeters", null),
      defaultRestSeconds:
        get(exercise, "defaultRestSeconds") || get(exercise, "defaultRest") || 60,
      imageUrl: get(exercise, "imageUrl", null),
      category: get(exercise, "category", ""),
      group: get(exercise, "group", ""),
      groupLabel:
        get(exercise, "groupLabel") || get(exercise, "category") || "",
      targetMuscles: get(exercise, "targetMuscles", []),
      equipments: get(exercise, "equipments", []),
      instructions: get(exercise, "instructions", []),
      equipmentImages: get(exercise, "equipmentImages", []),
      trackingType,
      sets: Array.from({ length: defaultSets }, () =>
        createWorkoutSetTemplate(exercise),
      ),
      rest:
        get(exercise, "defaultRest") ||
        get(exercise, "defaultRestSeconds") ||
        60,
      _id,
    };
    setDayExercises((prev) => ({
      ...prev,
      [selectedDayIdx]: [...(prev[selectedDayIdx] || []), newEx],
    }));
    setProgressData((prev) => ({
      ...prev,
      [_id]: { done: 0, total: getExerciseSetCount(newEx) },
    }));
    toast.success(`${get(exercise, "name")} qo'shildi`);
  };

  const handleRemoveExercise = (exerciseId) => {
    setDayExercises((prev) => ({
      ...prev,
      [selectedDayIdx]: filter(
        prev[selectedDayIdx] || [],
        (exercise) => get(exercise, "_id") !== exerciseId,
      ),
    }));
  };

  const handleSetComplete = useCallback(
    ({
      exerciseKey,
      exerciseName,
      exerciseId,
      imageUrl,
      setIndex,
      done,
      reps,
      weight,
      durationSeconds,
      distanceMeters,
      trackingType,
      rest,
    }) => {
      const setKey = `${exerciseKey}:${setIndex}`;
      setCompletedSets((prev) => {
        if (!done) {
          const next = { ...prev };
          delete next[setKey];
          return next;
        }

        return {
          ...prev,
          [setKey]: {
            exerciseKey,
            exerciseName,
            exerciseId,
            imageUrl,
            setIndex,
            reps,
            weight,
            durationSeconds,
            distanceMeters,
            trackingType,
          },
        };
      });
      if (done) {
        restTimer.start(rest);
      }
    },
    [restTimer],
  );

  const handleProgressChange = useCallback((exId, done, total) => {
    setProgressData((prev) => ({ ...prev, [exId]: { done, total } }));
  }, []);

  const handleFinish = async () => {
    const durationMinutes = max([1, Math.round(elapsed / 60)]);
    const estimatedCalories = Math.round(durationMinutes * 6.5);
    const effectiveDateKey = dateKey || getTodayKey();
    const completedSetEntries = Object.values(completedSets);

    if (get(completedSetEntries, "length") === 0) {
      toast.error("Kamida 1 ta setni bajarilgan deb belgilang");
      return;
    }

    const exerciseLogs = currentExercises.flatMap((exercise) => {
      const completedExerciseSets = filter(
        completedSetEntries,
        (set) => get(set, "exerciseKey") === get(exercise, "_id"),
      );

      if (completedExerciseSets.length === 0) {
        return [];
      }

      return [
        {
          date: effectiveDateKey,
          source: "session",
          name: get(exercise, "name"),
          exerciseId:
            get(completedExerciseSets, "[0].exerciseId") ??
            get(exercise, "id") ??
            undefined,
          sessionName:
            get(plan, "name") ||
            get(currentDay, "focus") ||
            "Mashg'ulot sessiyasi",
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
            reps: Number(get(set, "reps") || 0),
            weight: Number(get(set, "weight") || 0),
            durationSeconds: Number(get(set, "durationSeconds") || 0),
            distanceMeters: Number(get(set, "distanceMeters") || 0),
          })),
        },
      ];
    });

    const totalTrackedDurationSeconds = exerciseLogs.reduce(
      (sum, item) =>
        sum +
        reduce(
          get(item, "entries", []),
          (entrySum, entry) =>
            entrySum + Number(get(entry, "durationSeconds") || 0),
          0,
        ),
      0,
    );
    let remainingDuration = durationMinutes;
    let remainingCalories = estimatedCalories;
    const workoutLogs = map(exerciseLogs, (item, index) => {
      const trackedDurationSeconds = reduce(
        get(item, "entries", []),
        (sum, entry) => sum + Number(get(entry, "durationSeconds") || 0),
        0,
      );
      const explicitDurationMinutes =
        trackedDurationSeconds > 0
          ? max([1, Math.round(trackedDurationSeconds / 60)])
          : 0;

      if (index === get(exerciseLogs, "length") - 1) {
        return {
          ...item,
          entries: map(get(item, "entries", []), (entry, entryIndex, entries) => ({
            ...entry,
            durationMinutes:
              entryIndex === entries.length - 1
                ? explicitDurationMinutes ||
                  (totalTrackedDurationSeconds > 0 ? 0 : remainingDuration)
                : 0,
            burnedCalories:
              entryIndex === entries.length - 1 ? remainingCalories : 0,
          })),
        };
      }

      const ratio = 1 / max([1, get(exerciseLogs, "length")]);
      const itemDuration = Math.min(
        remainingDuration,
        max([0, Math.round(durationMinutes * ratio)]),
      );
      const itemCalories = Math.min(
        remainingCalories,
        max([0, Math.round(estimatedCalories * ratio)]),
      );
      remainingDuration -= itemDuration;
      remainingCalories -= itemCalories;

      return {
        ...item,
        entries: map(get(item, "entries", []), (entry, entryIndex, entries) => ({
          ...entry,
          durationMinutes:
            entryIndex === entries.length - 1
              ? explicitDurationMinutes ||
                (totalTrackedDurationSeconds > 0 ? 0 : itemDuration)
              : 0,
          burnedCalories:
            entryIndex === entries.length - 1 ? itemCalories : 0,
        })),
      };
    });

    try {
      for (const workoutLog of workoutLogs) {
        await createLog(workoutLog);
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(
        get(error, "response.data.message") ||
          "Mashg'ulot logini saqlashda xatolik yuz berdi",
      );
      return;
    }

    toast.success(`Mashg'ulot yakunlandi! 🎉`, {
      description: `${durationMinutes} daqiqada ${estimatedCalories} kcal yoqdingiz. Ma'lumotlar saqlandi.`,
    });
  };

  // ─── Right Panel ────────────────────────────────────────────────────────
  const MainPanel = (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      {isAddingExercise ? (
        <div className="space-y-4">
          <div className="mb-6 flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsAddingExercise(false)}
            >
              <ChevronLeftIcon className="size-6" />
            </Button>
            <div className="relative flex-1">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
              <Input
                placeholder="Mashq qidirish..."
                className="pl-12"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div
            className="flex items-center gap-2 overflow-x-auto pb-2 -mx-2 px-2"
            style={{ scrollbarWidth: "none" }}
          >
            {map(allMuscleGroups, (g) => (
              <button
                key={g}
                onClick={() => setSelectedGroup(g)}
                className={cn(
                  "shrink-0 rounded-xl border px-4 py-2 text-xs font-bold transition-all active:scale-95",
                  selectedGroup === g
                    ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:bg-primary/5",
                )}
              >
                {get(MODERN_MUSCLE_GROUPS, [g]) || g}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {map(filteredLibrary, (ex) => (
              <button
                key={get(ex, "id")}
                onClick={() => handleAddFromLibrary(ex)}
                className="group flex w-full items-center gap-4 rounded-2xl border bg-background p-3 text-left transition-all hover:border-primary/50 hover:bg-primary/5 active:scale-[0.98]"
              >
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border bg-muted/40">
                  <DumbbellIcon className="size-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{ex.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {ex.groupLabel || ex.category || "General"} ·{" "}
                    {getWorkoutExerciseSummary(ex)}
                  </p>
                </div>
                {addedNames.has(ex.name) ? (
                  <Badge variant="outline">Qo'shilgan</Badge>
                ) : (
                  <PlusIcon className="size-5 text-muted-foreground" />
                )}
              </button>
            ))}
            {size(filteredLibrary) === 0 && (
              <p className="text-center text-muted-foreground py-10">
                Hech narsa topilmadi
              </p>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border bg-card p-4">
            <div className="flex-1">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Jarayon
                </span>
                <span className="text-sm font-black text-primary">
                  {Math.round(overallProgress)}%
                </span>
              </div>
              <Progress
                value={overallProgress}
                className="h-3 rounded-full bg-muted"
              />
            </div>
            <div className="mt-4 flex items-end justify-between gap-3">
              <p className="text-3xl font-black">
                {doneCurrentSets}
                <span className="text-xl text-muted-foreground font-medium">
                  /{totalCurrentSets}
                </span>
              </p>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Setlar
              </p>
            </div>
          </div>

          {size(currentExercises) === 0 ? (
            <div className="rounded-2xl border border-dashed px-6 py-16 text-center">
              <div className="size-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-5">
                <DumbbellIcon className="size-10 text-muted-foreground/50" />
              </div>
              <h3 className="font-bold text-xl mb-2">Mashqlar yo'q</h3>
              <p className="text-muted-foreground text-base max-w-sm mx-auto mb-8">
                Sizda bu kun uchun mashqlar belgilanmagan. Kutubxonadan kerakli
                mashqlarni qo&apos;lda tanlang.
              </p>
              <div className="flex justify-center">
                <Button
                  onClick={() => setIsAddingExercise(true)}
                  variant="outline"
                >
                  <SearchIcon className="size-5 mr-2" /> Mashq izlash
                </Button>
              </div>
            </div>
          ) : (
            <>
              {map(currentExercises, (ex) => (
                <ExerciseCard
                  key={get(ex, "_id")}
                  exercise={ex}
                  exerciseDetails={
                    exerciseCatalogByName.get(toLower(String(ex.name || ""))) ||
                    ex
                  }
                  onSetComplete={handleSetComplete}
                  onRemove={handleRemoveExercise}
                  onProgressChange={handleProgressChange}
                />
              ))}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsAddingExercise(true)}
              >
                <PlusIcon className="mr-2 size-4" />
                Boshqa mashq qo'shish
              </Button>
            </>
          )}
        </>
      )}
    </div>
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-md">
        <DrawerHeader className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <DrawerTitle className="text-xl font-bold">
                {get(currentDay, "day")}
              </DrawerTitle>
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <TimerIcon className="size-3" />
                <span>{formatTime(elapsed)}</span>
                <span className="opacity-30">|</span>
                <Badge variant="secondary" className="h-4 px-1.5 text-[9px]">
                  {doneCurrentSets}/{totalCurrentSets} Sets
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-muted"
              onClick={() => onOpenChange(false)}
            >
              <XIcon className="size-5" />
            </Button>
          </div>
        </DrawerHeader>

        <DrawerBody className="space-y-6 px-6 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between text-sm font-bold">
              <span className="text-muted-foreground">Sessiya natijasi</span>
              <span className="text-primary">{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-2 rounded-full" />
          </div>
          {get(schedule, "length") > 1 ? (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {map(schedule, (day, index) => {
                const isActive = index === selectedDayIdx;
                const exercisesCount = size(get(day, "exercises"));
                return (
                  <button
                    key={`${get(day, "day")}-${index}`}
                    type="button"
                    onClick={() => {
                      setSelectedDayIdx(index);
                      setIsAddingExercise(false);
                    }}
                    className={cn(
                      "shrink-0 rounded-full border px-3 py-2 text-left transition-colors",
                      isActive
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/60 bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                    )}
                  >
                    <p className="text-xs font-black">{get(day, "day")}</p>
                    <p className="max-w-32 truncate text-[11px]">
                      {get(day, "focus") || "Erkin kun"}
                    </p>
                  </button>
                );
              })}
            </div>
          ) : null}

          <div
            className={cn(
              "overflow-hidden transition-all duration-500 ease-in-out",
              get(restTimer, "running")
                ? "max-h-24 opacity-100"
                : "max-h-0 opacity-0",
            )}
          >
            <div className="bg-primary rounded-xl p-4 flex items-center justify-between shadow-lg shadow-primary/20 text-primary-foreground">
              <div className="flex items-center gap-4">
                <div className="bg-background/20 p-3 rounded-xl backdrop-blur-sm">
                  <TimerIcon className="size-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-primary-foreground/80 uppercase tracking-widest mb-0.5">
                    Dam olish vaqti
                  </p>
                  <p className="text-3xl font-black tabular-nums leading-none tracking-tight">
                    {formatTime(get(restTimer, "seconds"))}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => restTimer.addTime(15)}
                >
                  +15s
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={restTimer.stop}
                >
                  <XIcon className="size-5" />
                </Button>
              </div>
            </div>
          </div>
          {MainPanel}
        </DrawerBody>

        <DrawerFooter className="px-6 py-4 flex flex-col gap-3">
          <Button
            variant="outline"
            className="w-full"
            size="lg"
            onClick={() => setIsAddingExercise((current) => !current)}
          >
            {isAddingExercise ? (
              <>
                <ChevronLeftIcon className="mr-2 size-4" />
                Sessiyaga qaytish
              </>
            ) : (
              <>
                <PlusIcon className="mr-2 size-4" />
                Mashq qo'shish
              </>
            )}
          </Button>
          <Button
            className="w-full"
            size="lg"
            onClick={handleFinish}
            disabled={isSavingSession}
          >
            Mashg'ulotni yakunlash
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
