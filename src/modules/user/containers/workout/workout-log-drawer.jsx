import React, { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  filter,
  get,
  includes,
  map,
  max,
  reduce,
  size,
  some,
  toLower,
  trim,
} from "lodash";
import { toast } from "sonner";
import {
  ChevronLeft,
  DumbbellIcon,
  LoaderCircleIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useGetQuery } from "@/hooks/api";
import { ALL_EXERCISES } from "@/data/exercises.mock";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { getTodayKey } from "@/hooks/app/use-daily-tracking";
import { normalizeExerciseSets } from "./utils";
import {
  createWorkoutSetTemplate,
  getWorkoutExerciseSummary,
  getWorkoutTrackingFields,
  normalizeWorkoutTrackingType,
} from "@/lib/workout-tracking";

const mapInitialExercise = (initialLog) =>
  initialLog
    ? {
        id: get(initialLog, "exerciseId", null),
        name: get(initialLog, "name"),
        imageUrl: get(initialLog, "imageUrl", null),
        groupLabel: get(initialLog, "sessionName", null),
        trackingType: get(initialLog, "trackingType", "REPS_WEIGHT"),
      }
    : null;

const mapInitialSets = (initialLog) =>
  map(get(initialLog, "items", []), (item) => ({
    reps: get(item, "reps") !== undefined ? String(get(item, "reps")) : "",
    weight:
      get(item, "weight") !== undefined && get(item, "weight") !== null
        ? String(get(item, "weight"))
        : "",
    durationSeconds:
      get(item, "durationSeconds") !== undefined &&
      get(item, "durationSeconds") !== null
        ? String(get(item, "durationSeconds"))
        : "",
    distanceMeters:
      get(item, "distanceMeters") !== undefined &&
      get(item, "distanceMeters") !== null
        ? String(get(item, "distanceMeters"))
        : "",
  }));

const buildExerciseCatalog = (exercisesData) => {
  if (size(get(exercisesData, "data")) > 0) {
    return map(get(exercisesData, "data"), (exercise) => ({
      ...exercise,
      sets: [
        {
          done: false,
          reps: get(exercise, "defaultReps", 10),
          durationSeconds: get(exercise, "defaultDurationSeconds", 0),
          distanceMeters: get(exercise, "defaultDistanceMeters", 0),
          weight: 0,
        },
      ],
    }));
  }

  return map(ALL_EXERCISES, (exercise, index) => ({
    id: get(exercise, "id") || `mock-${index}`,
    name: get(exercise, "name"),
    category:
      get(exercise, "groupLabel") || get(exercise, "category") || "General",
    imageUrl: get(exercise, "imageUrl") || null,
    emoji: get(exercise, "emoji") || "🏋️",
    trackingType: get(exercise, "trackingType") || "REPS_WEIGHT",
    defaultSets: get(exercise, "defaultSets") || 3,
    defaultReps: get(exercise, "defaultReps") ?? 10,
    defaultDurationSeconds: get(exercise, "defaultDurationSeconds") ?? 0,
    defaultDistanceMeters: get(exercise, "defaultDistanceMeters") ?? 0,
    defaultRest:
      get(exercise, "defaultRest") || get(exercise, "defaultRestSeconds") || 60,
    defaultRestSeconds:
      get(exercise, "defaultRestSeconds") || get(exercise, "defaultRest") || 60,
    groupLabel:
      get(exercise, "groupLabel") || get(exercise, "category") || "General",
  }));
};

const buildWorkoutLogPayload = ({
  dateKey,
  initialLog,
  selectedExercise,
  selectedTrackingType,
  sets,
  trackingFields,
}) => {
  const validSets = filter(sets, (set) =>
    some(
      trackingFields,
      (field) => Number(get(set, get(field, "key")) ?? 0) > 0,
    ),
  );

  if (validSets.length === 0) {
    return null;
  }

  const totalDurationSeconds = reduce(
    validSets,
    (sum, set) => sum + (parseInt(get(set, "durationSeconds"), 10) || 0),
    0,
  );
  const durationMinutes =
    totalDurationSeconds > 0
      ? max([1, Math.round(totalDurationSeconds / 60)])
      : validSets.length * 2;
  const burnedCalories = validSets.length * 10;
  let remainingDuration = durationMinutes;
  let remainingCalories = burnedCalories;

  return {
    date: dateKey || getTodayKey(),
    source: get(initialLog, "source") || "quick-log",
    name: get(selectedExercise, "name"),
    exerciseId: get(selectedExercise, "id", null) || undefined,
    sessionName: get(initialLog, "sessionName") || "Alohida mashq",
    trackingType: selectedTrackingType,
    imageUrl: get(selectedExercise, "imageUrl", null) || undefined,
    entries: map(validSets, (set, index) => {
      if (index === validSets.length - 1) {
        return {
          sets: 1,
          reps: parseInt(get(set, "reps"), 10) || 0,
          weight: parseFloat(get(set, "weight")) || 0,
          durationSeconds: parseInt(get(set, "durationSeconds"), 10) || 0,
          distanceMeters: parseInt(get(set, "distanceMeters"), 10) || 0,
          durationMinutes: remainingDuration,
          burnedCalories: remainingCalories,
        };
      }

      const itemDuration = max([
        0,
        Math.round(durationMinutes / max([1, validSets.length])),
      ]);
      const itemCalories = max([
        0,
        Math.round(burnedCalories / max([1, validSets.length])),
      ]);
      remainingDuration -= itemDuration;
      remainingCalories -= itemCalories;

      return {
        sets: 1,
        reps: parseInt(get(set, "reps"), 10) || 0,
        weight: parseFloat(get(set, "weight")) || 0,
        durationSeconds: parseInt(get(set, "durationSeconds"), 10) || 0,
        distanceMeters: parseInt(get(set, "distanceMeters"), 10) || 0,
        durationMinutes: itemDuration,
        burnedCalories: itemCalories,
      };
    }),
  };
};

export default function WorkoutLogDrawer({
  open = true,
  onOpenChange,
  initialExercise = null,
  initialLog = null,
  dateKey,
  onSave,
  isSubmitting = false,
}) {
  const [step, setStep] = useState(
    initialExercise || initialLog ? "log" : "select",
  );
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(toLower(trim(search)));
  const [selectedExercise, setSelectedExercise] = useState(
    initialExercise || mapInitialExercise(initialLog),
  );
  const [sets, setSets] = useState([]);

  const selectedTrackingType = normalizeWorkoutTrackingType(
    get(selectedExercise, "trackingType"),
  );
  const trackingFields = getWorkoutTrackingFields(selectedTrackingType);
  const setGridClass =
    trackingFields.length === 1
      ? "grid grid-cols-[36px_1fr_40px] items-center gap-3 rounded-2xl border bg-background p-3 sm:grid-cols-[44px_1fr_48px]"
      : "grid grid-cols-[36px_1fr_1fr_40px] items-center gap-3 rounded-2xl border bg-background p-3 sm:grid-cols-[44px_1fr_1fr_48px]";

  const { data: exercisesData, isLoading: isExercisesLoading } = useGetQuery({
    url: "/coach/exercises",
    queryProps: {
      queryKey: ["workout-exercises", "library"],
      enabled: open,
    },
  });

  const exerciseCatalog = useMemo(
    () => buildExerciseCatalog(exercisesData),
    [exercisesData],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    if (initialLog) {
      setSelectedExercise(mapInitialExercise(initialLog));
      setStep("log");
      setSets(mapInitialSets(initialLog));
      return;
    }

    if (initialExercise) {
      setSelectedExercise(initialExercise);
      setStep("log");
      setSets(normalizeExerciseSets(initialExercise));
      return;
    }

    setSelectedExercise(null);
    setStep("select");
    setSearch("");
    setSets([]);
  }, [initialExercise, initialLog, open]);

  const filteredExercises = useMemo(
    () =>
      filter(exerciseCatalog, (exercise) =>
        includes(
          toLower(String(get(exercise, "name", ""))),
          deferredSearch,
        ),
      ),
    [deferredSearch, exerciseCatalog],
  );

  const handleSelect = (exercise) => {
    setSelectedExercise(exercise);
    const nextSet = createWorkoutSetTemplate(exercise);
    setSets([
      {
        reps: String(get(nextSet, "reps") || ""),
        weight: String(get(nextSet, "weight") || ""),
        durationSeconds: String(get(nextSet, "durationSeconds") || ""),
        distanceMeters: String(get(nextSet, "distanceMeters") || ""),
      },
    ]);
    setStep("log");
  };

  const updateSet = (index, field, value) => {
    const stringValue =
      value !== undefined && value !== null && !Number.isNaN(value)
        ? String(value)
        : "";

    setSets((current) =>
      map(current, (set, currentIndex) =>
        currentIndex === index ? { ...set, [field]: stringValue } : set,
      ),
    );
  };

  const addSet = () => {
    const previousSet = get(sets, [size(sets) - 1]) || null;
    const newSet = {
      done: false,
      reps: get(previousSet, "reps", get(selectedExercise, "defaultReps", 10)),
      weight: get(previousSet, "weight", 0),
      durationSeconds: get(
        previousSet,
        "durationSeconds",
        get(selectedExercise, "defaultDurationSeconds", 0),
      ),
      distanceMeters: get(
        previousSet,
        "distanceMeters",
        get(selectedExercise, "defaultDistanceMeters", 0),
      ),
    };

    setSets((current) => [
      ...current,
      {
        reps: String(get(newSet, "reps") || ""),
        weight: String(get(newSet, "weight") || ""),
        durationSeconds: String(get(newSet, "durationSeconds") || ""),
        distanceMeters: String(get(newSet, "distanceMeters") || ""),
      },
    ]);
  };

  const removeSet = (index) => {
    setSets((current) => filter(current, (_, currentIndex) => currentIndex !== index));
  };

  const handleSave = async () => {
    const payload = buildWorkoutLogPayload({
      dateKey,
      initialLog,
      selectedExercise,
      selectedTrackingType,
      sets,
      trackingFields,
    });

    if (!payload) {
      toast.error("Kamida 1 ta to'g'ri set kiriting");
      return;
    }

    try {
      await onSave(payload);
    } catch (error) {
      toast.error(
        get(error, "response.data.message") ||
          "Mashq logini saqlashda xatolik yuz berdi",
      );
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-md">
        <div className="relative">
          {step === "log" && !initialExercise && !initialLog ? (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setStep("select")}
              className="absolute left-4 top-4"
            >
              <ChevronLeft className="size-4" />
            </Button>
          ) : null}
          <DrawerHeader>
            <DrawerTitle>
              {initialLog
                ? "Logni tahrirlash"
                : get(selectedExercise, "name")
                  ? get(selectedExercise, "name")
                  : "Tezkor log"}
            </DrawerTitle>
            <DrawerDescription>
              {step === "select"
                ? "Mashqni tanlang va setlarni kiriting"
                : "Setlar bo'yicha mashq logini to'ldiring"}
            </DrawerDescription>
            {step === "select" ? (
              <InputGroup>
                <InputGroupInput
                  placeholder="Mashq qidirish..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <InputGroupAddon>
                  <SearchIcon />
                </InputGroupAddon>
                <InputGroupAddon align="inline-end">
                  {filteredExercises.length} results
                </InputGroupAddon>
              </InputGroup>
            ) : null}
          </DrawerHeader>
        </div>

        <DrawerBody>
          <div className="space-y-4">
            {step === "select" ? (
              isExercisesLoading ? (
                <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
                  <LoaderCircleIcon className="size-5 animate-spin" />
                  Mashqlar yuklanmoqda...
                </div>
              ) : (
                <div className="space-y-3">
                  {map(filteredExercises, (exercise) => (
                    <button
                      key={get(exercise, "id") || get(exercise, "name")}
                      type="button"
                      onClick={() => handleSelect(exercise)}
                      className="flex w-full items-center gap-4 rounded-2xl border bg-background p-4 text-left"
                    >
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border bg-muted/40">
                        <DumbbellIcon className="size-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">
                          {get(exercise, "name")}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {get(exercise, "groupLabel") ||
                            get(exercise, "category") ||
                            "General"}{" "}
                          · {getWorkoutExerciseSummary(exercise)}
                        </p>
                      </div>
                      <PlusIcon className="size-5 text-muted-foreground" />
                    </button>
                  ))}

                  {!filteredExercises.length ? (
                    <div className="flex min-h-32 items-center justify-center rounded-2xl border border-dashed px-4 text-sm text-muted-foreground">
                      Mashq topilmadi
                    </div>
                  ) : null}
                </div>
              )
            ) : (
              <div className="space-y-4">
                <div
                  className={
                    trackingFields.length === 1
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

                {map(sets, (set, index) => (
                  <div key={index} className={setGridClass}>
                    <div className="flex justify-center">
                      <span className="rounded-xl border px-2 py-1 text-sm font-semibold text-muted-foreground">
                        {index + 1}
                      </span>
                    </div>

                    {map(trackingFields, (field) => (
                      <NumberField
                        key={get(field, "key")}
                        value={Number(get(set, get(field, "key"))) || undefined}
                        onValueChange={(value) =>
                          updateSet(index, get(field, "key"), value)
                        }
                        min={get(field, "min")}
                        step={get(field, "step")}
                      >
                        <NumberFieldGroup>
                          <NumberFieldDecrement />
                          <NumberFieldInput
                            placeholder={get(field, "placeholder")}
                          />
                          <NumberFieldIncrement />
                        </NumberFieldGroup>
                      </NumberField>
                    ))}

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeSet(index)}
                      disabled={sets.length === 1}
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  </div>
                ))}

                <Button variant="outline" className="w-full" onClick={addSet}>
                  <PlusIcon className="mr-2 size-4" />
                  Yana set qo'shish
                </Button>
              </div>
            )}
          </div>
        </DrawerBody>

        <DrawerFooter>
          {step === "log" ? (
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? (
                <LoaderCircleIcon className="mr-2 size-4 animate-spin" />
              ) : null}
              {initialLog ? "Saqlash" : "Logni saqlash"}
            </Button>
          ) : null}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Bekor qilish
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
