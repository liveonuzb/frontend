import React from "react";
import { useTranslation } from "react-i18next";
import filter from "lodash/filter";
import get from "lodash/get";
import includes from "lodash/includes";
import isArray from "lodash/isArray";
import isEqual from "lodash/isEqual";
import isFunction from "lodash/isFunction";
import map from "lodash/map";
import take from "lodash/take";
import toLower from "lodash/toLower";
import toNumber from "lodash/toNumber";
import trim from "lodash/trim";
import uniqBy from "lodash/uniqBy";
import {
  Grid2X2Icon,
  ListIcon,
  PlayIcon,
  PlusIcon,
  RefreshCwIcon,
  RouteIcon,
  SaveIcon,
  SearchIcon,
  StarIcon,
} from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import PageLoader from "@/components/page-loader/index.jsx";
import PageTransition from "@/components/page-transition";
import { TrackingPageHeader } from "@/components/tracking-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useWorkoutLogs } from "@/hooks/app/use-workout-logs";
import {
  useCreateCustomWorkoutExercise,
  useWorkoutCatalog,
  useWorkoutExerciseCategories,
  useWorkoutExercises,
} from "@/hooks/app/use-workout-plans";
import { useStartRunningSession } from "@/hooks/app/use-running-sessions";
import {
  useFavoriteActions,
  useFavorites,
} from "@/hooks/app/use-favorites";
import { useBreadcrumbStore } from "@/store";
import WorkoutExerciseDetailDrawer from "../workout-exercise-detail-drawer.jsx";
import WorkoutMediaFallback from "../workout-media-fallback.jsx";
import { cn } from "@/lib/utils";

const EXERCISE_PAGE_SIZE = 50;
const EXERCISE_SORT_OPTIONS = ["popular", "name", "recent"];
const DIFFICULTY_DOTS = [1, 2, 3];
const TRACKING_TYPES = [
  "REPS_WEIGHT",
  "REPS_ONLY",
  "DURATION_ONLY",
  "DISTANCE_ONLY",
  "DURATION_DISTANCE",
];

const defaultCustomExerciseForm = {
  name: "",
  description: "",
  trackingType: "REPS_WEIGHT",
  defaultSets: "3",
  defaultReps: "12",
  defaultDurationSeconds: "",
  defaultDistanceMeters: "",
  defaultRestSeconds: "60",
  equipment: "",
  targetMuscles: "",
  bodyParts: "",
  instructions: "",
  imageUrl: "",
  videoUrl: "",
  visibility: "private",
};

const splitList = (value) =>
  filter(
    map(String(value || "").split(/[,\n]/), (item) => trim(item)),
    Boolean,
  );

const toOptionalNumber = (value) => {
  const next = toNumber(value);

  return Number.isFinite(next) && next >= 0 ? next : undefined;
};

const getExerciseDifficultyScore = (value) => {
  const normalized = toLower(String(value || ""));

  if (
    includes(normalized, "advanced") ||
    includes(normalized, "прод") ||
    includes(normalized, "qiyin")
  ) {
    return 3;
  }

  if (
    includes(normalized, "intermediate") ||
    includes(normalized, "сред") ||
    includes(normalized, "o'rta") ||
    includes(normalized, "орта")
  ) {
    return 2;
  }

  return 1;
};

const useDebouncedValue = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [delay, value]);

  return debouncedValue;
};

const CustomExerciseDrawer = ({ open, onOpenChange, onSubmit, isPending }) => {
  const { t } = useTranslation();
  const [form, setForm] = React.useState(defaultCustomExerciseForm);

  React.useEffect(() => {
    if (open) {
      setForm(defaultCustomExerciseForm);
    }
  }, [open]);

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!trim(form.name)) {
      toast.error(t("user.workout.exerciseLibrary.custom.validation.name"));
      return;
    }

    await onSubmit({
      name: trim(form.name),
      description: trim(form.description),
      trackingType: form.trackingType,
      defaultSets: toOptionalNumber(form.defaultSets) || 3,
      defaultReps: toOptionalNumber(form.defaultReps),
      defaultDurationSeconds: toOptionalNumber(form.defaultDurationSeconds),
      defaultDistanceMeters: toOptionalNumber(form.defaultDistanceMeters),
      defaultRestSeconds: toOptionalNumber(form.defaultRestSeconds) || 60,
      equipment: trim(form.equipment),
      equipments: splitList(form.equipment),
      targetMuscles: splitList(form.targetMuscles),
      bodyParts: splitList(form.bodyParts),
      instructions: splitList(form.instructions),
      imageUrl: trim(form.imageUrl),
      videoUrl: trim(form.videoUrl),
      visibility: form.visibility,
    });
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DrawerHeader className="px-6 py-5 text-left">
            <DrawerTitle className="text-xl font-black">
              {t("user.workout.exerciseLibrary.custom.title")}
            </DrawerTitle>
            <DrawerDescription>
              {t("user.workout.exerciseLibrary.custom.description")}
            </DrawerDescription>
          </DrawerHeader>

          <DrawerBody className="px-6">
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="custom-exercise-name">
                  {t("user.workout.exerciseLibrary.custom.name")}
                </FieldLabel>
                <Input
                  id="custom-exercise-name"
                  value={form.name}
                  onChange={(event) => setField("name", event.target.value)}
                  disabled={isPending}
                  maxLength={120}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="custom-exercise-description">
                  {t("user.workout.exerciseLibrary.custom.notes")}
                </FieldLabel>
                <Textarea
                  id="custom-exercise-description"
                  value={form.description}
                  onChange={(event) =>
                    setField("description", event.target.value)
                  }
                  disabled={isPending}
                  rows={3}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>
                    {t("user.workout.exerciseLibrary.custom.trackingType")}
                  </FieldLabel>
                  <Select
                    value={form.trackingType}
                    onValueChange={(value) => setField("trackingType", value)}
                    disabled={isPending}
                  >
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {map(TRACKING_TYPES, (type) => (
                        <SelectItem key={type} value={type}>
                          {type.replaceAll("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel>
                    {t("user.workout.exerciseLibrary.custom.visibility")}
                  </FieldLabel>
                  <Select
                    value={form.visibility}
                    onValueChange={(value) => setField("visibility", value)}
                    disabled={isPending}
                  >
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">
                        {t("user.workout.exerciseLibrary.custom.private")}
                      </SelectItem>
                      <SelectItem value="public_requested">
                        {t("user.workout.exerciseLibrary.custom.requestPublic")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field>
                  <FieldLabel htmlFor="custom-exercise-sets">
                    {t("user.workout.exerciseLibrary.custom.sets")}
                  </FieldLabel>
                  <Input
                    id="custom-exercise-sets"
                    type="number"
                    min="1"
                    max="20"
                    value={form.defaultSets}
                    onChange={(event) =>
                      setField("defaultSets", event.target.value)
                    }
                    disabled={isPending}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="custom-exercise-reps">
                    {t("user.workout.exerciseLibrary.custom.reps")}
                  </FieldLabel>
                  <Input
                    id="custom-exercise-reps"
                    type="number"
                    min="0"
                    value={form.defaultReps}
                    onChange={(event) =>
                      setField("defaultReps", event.target.value)
                    }
                    disabled={isPending}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="custom-exercise-rest">
                    {t("user.workout.exerciseLibrary.custom.rest")}
                  </FieldLabel>
                  <Input
                    id="custom-exercise-rest"
                    type="number"
                    min="0"
                    max="3600"
                    value={form.defaultRestSeconds}
                    onChange={(event) =>
                      setField("defaultRestSeconds", event.target.value)
                    }
                    disabled={isPending}
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="custom-exercise-duration">
                    {t("user.workout.exerciseLibrary.custom.duration")}
                  </FieldLabel>
                  <Input
                    id="custom-exercise-duration"
                    type="number"
                    min="0"
                    value={form.defaultDurationSeconds}
                    onChange={(event) =>
                      setField("defaultDurationSeconds", event.target.value)
                    }
                    disabled={isPending}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="custom-exercise-distance">
                    {t("user.workout.exerciseLibrary.custom.distance")}
                  </FieldLabel>
                  <Input
                    id="custom-exercise-distance"
                    type="number"
                    min="0"
                    value={form.defaultDistanceMeters}
                    onChange={(event) =>
                      setField("defaultDistanceMeters", event.target.value)
                    }
                    disabled={isPending}
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="custom-exercise-equipment">
                  {t("user.workout.exerciseLibrary.custom.equipment")}
                </FieldLabel>
                <Input
                  id="custom-exercise-equipment"
                  value={form.equipment}
                  onChange={(event) => setField("equipment", event.target.value)}
                  disabled={isPending}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="custom-exercise-muscles">
                  {t("user.workout.exerciseLibrary.custom.muscles")}
                </FieldLabel>
                <Input
                  id="custom-exercise-muscles"
                  value={form.targetMuscles}
                  onChange={(event) =>
                    setField("targetMuscles", event.target.value)
                  }
                  disabled={isPending}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="custom-exercise-body-parts">
                  {t("user.workout.exerciseLibrary.custom.bodyParts")}
                </FieldLabel>
                <Input
                  id="custom-exercise-body-parts"
                  value={form.bodyParts}
                  onChange={(event) =>
                    setField("bodyParts", event.target.value)
                  }
                  disabled={isPending}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="custom-exercise-instructions">
                  {t("user.workout.exerciseLibrary.custom.instructions")}
                </FieldLabel>
                <Textarea
                  id="custom-exercise-instructions"
                  value={form.instructions}
                  onChange={(event) =>
                    setField("instructions", event.target.value)
                  }
                  disabled={isPending}
                  rows={4}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="custom-exercise-image">
                  {t("user.workout.exerciseLibrary.custom.imageUrl")}
                </FieldLabel>
                <Input
                  id="custom-exercise-image"
                  value={form.imageUrl}
                  onChange={(event) => setField("imageUrl", event.target.value)}
                  disabled={isPending}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="custom-exercise-video">
                  {t("user.workout.exerciseLibrary.custom.videoUrl")}
                </FieldLabel>
                <Input
                  id="custom-exercise-video"
                  value={form.videoUrl}
                  onChange={(event) => setField("videoUrl", event.target.value)}
                  disabled={isPending}
                />
              </Field>
            </FieldGroup>
          </DrawerBody>

          <DrawerFooter className="px-6 py-4 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-2xl"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              {t("user.workout.exerciseLibrary.custom.cancel")}
            </Button>
            <Button type="submit" className="h-11 rounded-2xl" disabled={isPending}>
              <SaveIcon className="size-4" />
              {isPending
                ? t("user.workout.exerciseLibrary.custom.saving")
                : t("user.workout.exerciseLibrary.custom.save")}
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
};

const RunningToolsPanel = ({
  onStartRun,
  onSetQuery,
  isStartingRun,
  t,
}) => {
  const tools = [
    {
      key: "cardio",
      title: t("user.workout.exerciseLibrary.runningTools.cardio.title"),
      description: t("user.workout.exerciseLibrary.runningTools.cardio.description"),
      icon: RouteIcon,
      onClick: () => onSetQuery("cardio"),
    },
    {
      key: "start-run",
      title: t("user.workout.exerciseLibrary.runningTools.start.title"),
      description: t("user.workout.exerciseLibrary.runningTools.start.description"),
      icon: PlayIcon,
      onClick: onStartRun,
      primary: true,
      disabled: isStartingRun,
    },
    {
      key: "intervals",
      title: t("user.workout.exerciseLibrary.runningTools.intervals.title"),
      description: t("user.workout.exerciseLibrary.runningTools.intervals.description"),
      icon: RefreshCwIcon,
      onClick: () => onSetQuery("interval"),
    },
    {
      key: "warmup",
      title: t("user.workout.exerciseLibrary.runningTools.warmup.title"),
      description: t("user.workout.exerciseLibrary.runningTools.warmup.description"),
      icon: SearchIcon,
      onClick: () => onSetQuery("warmup"),
    },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {map(tools, (tool) => {
        const Icon = tool.icon;

        return (
          <button
            key={tool.key}
            type="button"
            disabled={tool.disabled}
            onClick={tool.onClick}
            className={cn(
              "group flex min-h-28 items-center gap-4 rounded-[1.75rem] border bg-card/80 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-60",
              tool.primary && "border-primary/25 bg-primary/5",
            )}
          >
            <span
              className={cn(
                "grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary",
                tool.primary && "bg-primary text-primary-foreground",
              )}
            >
              <Icon className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-black">{tool.title}</span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                {tool.description}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
};

const WorkoutExercisesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const [query, setQuery] = React.useState("");
  const debouncedQuery = useDebouncedValue(query);
  const normalizedDebouncedQuery = React.useMemo(
    () => trim(debouncedQuery),
    [debouncedQuery],
  );
  const [categoryId, setCategoryId] = React.useState(null);
  const [equipmentId, setEquipmentId] = React.useState(null);
  const [muscleId, setMuscleId] = React.useState(null);
  const [sort, setSort] = React.useState("popular");
  const [viewMode, setViewMode] = React.useState("list");
  const [exerciseCursor, setExerciseCursor] = React.useState(null);
  const [pagedExercises, setPagedExercises] = React.useState([]);
  const [selectedExercise, setSelectedExercise] = React.useState(null);
  const [customDrawerOpen, setCustomDrawerOpen] = React.useState(false);
  const createCustomExerciseMutation = useCreateCustomWorkoutExercise();
  const {
    startRunningSession,
    isPending: isStartingRun,
  } = useStartRunningSession();
  const { favoriteIds } = useFavorites("EXERCISE");
  const { toggleFavorite, isPendingFor } = useFavoriteActions("EXERCISE");
  const { catalog } = useWorkoutCatalog();
  const {
    categories,
    isLoading: isCategoriesLoading,
    isError: isCategoriesError,
    refetch: refetchCategories,
  } = useWorkoutExerciseCategories();
  const {
    exercises,
    meta: exerciseMeta,
    isLoading: isExercisesLoading,
    isError: isExercisesError,
    refetch: refetchExercises,
  } = useWorkoutExercises({
    categoryId,
    equipmentId,
    muscleId,
    query: normalizedDebouncedQuery,
    limit: EXERCISE_PAGE_SIZE,
    cursor: exerciseCursor,
    sort,
  });
  const { items: logs } = useWorkoutLogs({}, { enabled: Boolean(selectedExercise) });

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user", title: t("user.dashboard.title") },
      { url: "/user/workout/overview", title: t("user.workout.title") },
      {
        url: "/user/workout/exercises",
        title: t("user.workout.exerciseLibrary.breadcrumb"),
      },
    ]);
  }, [setBreadcrumbs, t]);

  React.useEffect(() => {
    setExerciseCursor(null);
    setPagedExercises([]);
  }, [categoryId, equipmentId, muscleId, normalizedDebouncedQuery, sort]);

  React.useEffect(() => {
    if (isExercisesLoading || isExercisesError) {
      return;
    }

    setPagedExercises((current) => {
      const nextExercises = exerciseCursor
        ? uniqBy([...current, ...exercises], "id")
        : exercises;

      return isEqual(current, nextExercises) ? current : nextExercises;
    });
  }, [
    categoryId,
    equipmentId,
    exerciseCursor,
    exercises,
    isExercisesError,
    isExercisesLoading,
    muscleId,
    normalizedDebouncedQuery,
    sort,
  ]);

  const visibleExercises = React.useMemo(() => {
    const normalizedQuery = toLower(trim(query));

    return filter(pagedExercises, (exercise) => {
      if (!normalizedQuery) {
        return true;
      }

      return includes(toLower(String(get(exercise, "name", ""))), normalizedQuery);
    });
  }, [pagedExercises, query]);

  if (isCategoriesLoading || (isExercisesLoading && pagedExercises.length === 0)) {
    return <PageLoader />;
  }

  const handleRetry = () => {
    if (isFunction(refetchCategories)) {
      refetchCategories();
    }

    if (isFunction(refetchExercises)) {
      refetchExercises();
    }
  };
  const hasActiveFilter =
    Boolean(categoryId) ||
    Boolean(equipmentId) ||
    Boolean(muscleId) ||
    Boolean(trim(query));
  const resetFilters = () => {
    setQuery("");
    setCategoryId(null);
    setEquipmentId(null);
    setMuscleId(null);
  };
  const handleRunningToolQuery = (value) => {
    setQuery(value);
    setCategoryId(null);
    setEquipmentId(null);
    setMuscleId(null);
  };
  const handleStartRun = async () => {
    try {
      const session = await startRunningSession({ source: "exercise-library" });
      const workoutSessionId = get(session, "workoutSessionId", get(session, "id"));

      if (workoutSessionId) {
        navigate(`/user/workout/running/live/${workoutSessionId}`);
        return;
      }

      navigate("/user/workout/history");
    } catch (error) {
      toast.error(
        get(error, "response.data.message") ||
          t("user.workout.exerciseLibrary.runningTools.startError"),
      );
    }
  };
  const handleCreateCustomExercise = async (payload) => {
    try {
      await createCustomExerciseMutation.createExercise(payload);
      setExerciseCursor(null);
      setPagedExercises([]);
      setCustomDrawerOpen(false);
      toast.success(t("user.workout.exerciseLibrary.custom.created"));
    } catch (error) {
      toast.error(
        get(
          error,
          "response.data.message",
          t("user.workout.exerciseLibrary.custom.createError"),
        ),
      );
    }
  };

  if (isCategoriesError || isExercisesError) {
    return (
      <PageTransition mode="fade">
        <div className="flex flex-col gap-6 pb-4">
          <TrackingPageHeader
            title={t("user.workout.exerciseLibrary.title")}
            subtitle={t("user.workout.exerciseLibrary.subtitle")}
            hideTitleOnMobile={false}
          />

          <Card className="rounded-[1.75rem] border-destructive/30 bg-destructive/5 py-6">
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <h2 className="text-base font-black">
                  {t("user.workout.exerciseLibrary.errorTitle")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t("user.workout.exerciseLibrary.errorDescription")}
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                className="self-start rounded-2xl sm:self-auto"
                onClick={handleRetry}
              >
                <RefreshCwIcon className="size-4" />
                {t("user.workout.exerciseLibrary.retry")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition mode="fade">
      <div className="flex flex-col gap-6 pb-4">
        <TrackingPageHeader
          title={t("user.workout.exerciseLibrary.title")}
          subtitle={t("user.workout.exerciseLibrary.subtitle")}
          hideTitleOnMobile={false}
          actions={
            <Button
              type="button"
              className="h-11 rounded-2xl"
              onClick={() => setCustomDrawerOpen(true)}
            >
              <PlusIcon className="size-4" />
              {t("user.workout.exerciseLibrary.custom.action")}
            </Button>
          }
        />

        <RunningToolsPanel
          onStartRun={handleStartRun}
          onSetQuery={handleRunningToolQuery}
          isStartingRun={isStartingRun}
          t={t}
        />

        <div className="flex flex-col gap-3">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("user.workout.exerciseLibrary.searchPlaceholder")}
              className="h-12 rounded-2xl pl-11"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="sr-only" htmlFor="exercise-sort">
              {t("user.workout.exerciseLibrary.sortLabel")}
            </label>
            <select
              id="exercise-sort"
              aria-label={t("user.workout.exerciseLibrary.sortLabel")}
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="h-11 rounded-2xl border border-input bg-card px-4 text-sm font-semibold text-foreground shadow-sm outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40 sm:w-64"
            >
              {map(EXERCISE_SORT_OPTIONS, (option) => (
                <option key={option} value={option}>
                  {t(`user.workout.exerciseLibrary.sortOptions.${option}`)}
                </option>
              ))}
            </select>

            <div
              className="inline-flex w-fit rounded-2xl border bg-card p-1 shadow-sm"
              aria-label={t("user.workout.exerciseLibrary.viewMode")}
            >
              <Button
                type="button"
                variant={viewMode === "list" ? "default" : "ghost"}
                className="h-9 rounded-xl px-3"
                aria-pressed={viewMode === "list"}
                onClick={() => setViewMode("list")}
              >
                <ListIcon className="size-4" />
                {t("user.workout.exerciseLibrary.viewList")}
              </Button>
              <Button
                type="button"
                variant={viewMode === "grid" ? "default" : "ghost"}
                className="h-9 rounded-xl px-3"
                aria-pressed={viewMode === "grid"}
                onClick={() => setViewMode("grid")}
              >
                <Grid2X2Icon className="size-4" />
                {t("user.workout.exerciseLibrary.viewGrid")}
              </Button>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            <Button
              type="button"
              variant={categoryId === null ? "default" : "outline"}
              className="shrink-0 rounded-2xl"
              onClick={() => setCategoryId(null)}
            >
              {t("user.workout.exerciseLibrary.all")}
            </Button>
            {map(categories, (category) => (
              <Button
                key={category.id}
                type="button"
                variant={categoryId === category.id ? "default" : "outline"}
                className="shrink-0 rounded-2xl"
                onClick={() => setCategoryId(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {map(get(catalog, "equipments", []), (equipment) => (
              <Button
                key={equipment.id}
                type="button"
                variant={equipmentId === equipment.id ? "default" : "outline"}
                className="shrink-0 rounded-2xl"
                onClick={() =>
                  setEquipmentId((current) =>
                    current === equipment.id ? null : equipment.id,
                  )
                }
              >
                {equipment.name}
              </Button>
            ))}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {map(get(catalog, "muscles", []), (muscle) => (
              <Button
                key={muscle.id}
                type="button"
                variant={muscleId === muscle.id ? "default" : "outline"}
                className="shrink-0 rounded-2xl"
                onClick={() =>
                  setMuscleId((current) =>
                    current === muscle.id ? null : muscle.id,
                  )
                }
              >
                {muscle.name}
              </Button>
            ))}
          </div>

          {hasActiveFilter ? (
            <Button
              type="button"
              variant="ghost"
              className="h-10 self-start rounded-2xl px-4"
              onClick={resetFilters}
            >
              {t("user.workout.exerciseLibrary.resetFilters")}
            </Button>
          ) : null}
        </div>

        <div
          data-testid="exercise-results"
          data-view-mode={viewMode}
          className={cn(
            "grid gap-3",
            viewMode === "grid" && "md:grid-cols-2 xl:grid-cols-3",
          )}
        >
          {map(visibleExercises, (exercise) => {
            const equipments = isArray(get(exercise, "equipments"))
              ? get(exercise, "equipments")
              : [];
            const targetMuscles = isArray(get(exercise, "targetMuscles"))
              ? get(exercise, "targetMuscles")
              : [];
            const favoriteEntityId = String(get(exercise, "id", ""));
            const isFavorite = favoriteIds.has(favoriteEntityId);
            const isFavoritePending = isPendingFor(favoriteEntityId);
            const difficulty = trim(
              String(
                get(
                  exercise,
                  "difficulty",
                  get(
                    exercise,
                    "level",
                    t("user.workout.exerciseLibrary.difficultyAny"),
                  ),
                ) || t("user.workout.exerciseLibrary.difficultyAny"),
              ),
            );
            const difficultyScore = getExerciseDifficultyScore(difficulty);

            return (
              <Card
                key={exercise.id}
                role="button"
                tabIndex={0}
                aria-label={`${t("user.workout.exerciseLibrary.openDetails")}: ${exercise.name}`}
                onClick={() => setSelectedExercise(exercise)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedExercise(exercise);
                  }
                }}
                className="overflow-hidden rounded-[1.75rem] border py-6 transition-colors hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <CardContent
                  className={cn(
                    "flex gap-4 p-4",
                    viewMode === "grid"
                      ? "h-full flex-col items-stretch"
                      : "items-center",
                  )}
                >
                  <div
                    className={cn(
                      "shrink-0 overflow-hidden rounded-2xl bg-muted",
                      viewMode === "grid" ? "aspect-[4/3] w-full" : "size-20",
                    )}
                  >
                      <WorkoutMediaFallback
                        src={exercise.imageUrl}
                        alt={exercise.name}
                        variant="exercise"
                        label={t("user.workout.exerciseLibrary.missingImage")}
                      />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-black">
                          {exercise.name}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {exercise.category ||
                            t("user.workout.exerciseLibrary.exerciseFallback")}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "size-9 rounded-full border bg-card/80 text-muted-foreground hover:text-primary",
                            isFavorite && "border-primary/25 text-primary",
                          )}
                          aria-label={`${t(
                            isFavorite
                              ? "user.workout.exerciseLibrary.removeFavorite"
                              : "user.workout.exerciseLibrary.addFavorite",
                          )}: ${exercise.name}`}
                          disabled={!favoriteEntityId || isFavoritePending}
                          onKeyDown={(event) => event.stopPropagation()}
                          onClick={async (event) => {
                            event.stopPropagation();

                            try {
                              await toggleFavorite(favoriteEntityId, isFavorite);
                            } catch (error) {
                              toast.error(
                                get(
                                  error,
                                  "response.data.message",
                                  t("user.workout.exerciseLibrary.favoriteError"),
                                ),
                              );
                            }
                          }}
                        >
                          <StarIcon
                            className={cn(
                              "size-4",
                              isFavorite && "fill-current",
                            )}
                          />
                        </Button>
                        <Badge variant="secondary" className="rounded-full">
                          {get(exercise, "isCustom")
                            ? t("user.workout.exerciseLibrary.custom.badge")
                            : exercise.trackingType?.replaceAll("_", " ") ||
                              t("user.workout.exerciseLibrary.trackingFallback")}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {map(take(equipments, 2), (item) => (
                        <Badge
                          key={`${exercise.id}-eq-${item}`}
                          variant="outline"
                          className="rounded-full"
                        >
                          {item}
                        </Badge>
                      ))}
                      {map(take(targetMuscles, 2), (item) => (
                        <Badge
                          key={`${exercise.id}-muscle-${item}`}
                          variant="outline"
                          className="rounded-full"
                        >
                          {item}
                        </Badge>
                      ))}
                    </div>

                    <div
                      className="mt-3 flex items-center gap-2 text-xs font-semibold text-muted-foreground"
                      aria-label={`${t(
                        "user.workout.exerciseLibrary.difficulty",
                      )}: ${difficulty}`}
                    >
                      <span>
                        {t("user.workout.exerciseLibrary.difficulty")}:{" "}
                        {difficulty}
                      </span>
                      <span className="flex gap-1" aria-hidden="true">
                        {map(DIFFICULTY_DOTS, (dot) => (
                          <span
                            key={`${exercise.id}-difficulty-${dot}`}
                            className={cn(
                              "size-1.5 rounded-full",
                              dot <= difficultyScore
                                ? "bg-primary"
                                : "bg-muted-foreground/25",
                            )}
                          />
                        ))}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {visibleExercises.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed p-6 text-sm text-muted-foreground">
              {t("user.workout.exerciseLibrary.empty")}
            </div>
          ) : null}

          {get(exerciseMeta, "hasMore") ? (
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-2xl"
              disabled={isExercisesLoading || !get(exerciseMeta, "nextCursor")}
              onClick={() => setExerciseCursor(get(exerciseMeta, "nextCursor"))}
            >
              {isExercisesLoading
                ? t("user.workout.exerciseLibrary.loadingMore")
                : t("user.workout.exerciseLibrary.loadMore")}
            </Button>
          ) : null}
        </div>
      </div>
      <WorkoutExerciseDetailDrawer
        open={Boolean(selectedExercise)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedExercise(null);
          }
        }}
        exercise={selectedExercise}
        logs={logs}
      />
      <CustomExerciseDrawer
        open={customDrawerOpen}
        onOpenChange={setCustomDrawerOpen}
        onSubmit={handleCreateCustomExercise}
        isPending={createCustomExerciseMutation.isPending}
      />
    </PageTransition>
  );
};

export default WorkoutExercisesPage;
