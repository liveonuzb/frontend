import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useDeferredValue,
} from "react";
import { useTranslation } from "react-i18next";
import {
  map,
  filter,
  find,
  get,
  size,
  some,
  fromPairs,
  values,
  flatMap,
} from "lodash";
import useIsMobile from "@/hooks/utils/use-mobile.js";
import { cn } from "@/lib/utils.js";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
} from "@/components/ui/drawer.jsx";
import {
  useWorkoutExerciseCategories,
  useWorkoutExercises,
} from "@/hooks/app/use-workout-plans.js";

// Extracted components
import BuilderHeader from "./builder-header.jsx";
import BuilderFooter from "./builder-footer.jsx";
import BuilderDesktopView from "./builder-desktop-view.jsx";
import BuilderMobileView from "./builder-mobile-view.jsx";
import BuilderMobileLibrary from "./builder-mobile-library.jsx";
import BuilderMetaDrawer from "./builder-meta-drawer.jsx";

// Utils
import {
  buildExerciseItem,
  buildNumberedDaySkeleton,
  buildWeekDaySkeleton,
  initFromPlan,
  buildSavePlan,
  filterExercises,
} from "./builder-utils.js";

const WorkoutPlanBuilder = ({
  open,
  onOpenChange,
  initialPlan,
  initialData,
  onSave,
  onClose,
  fullscreen = false,
  lockWeekDays = false,
  isSaving = false,
  submitLabel = null,
  title = null,
  description = null,
  metaName = null,
  metaDescription = null,
  onMetaSave = null,
  asPage = false,
}) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const planSource = initialPlan || initialData || null;
  const isActive = asPage || open;

  // Plan meta state
  const [planName, setPlanName] = useState("");
  const [planDescription, setPlanDescription] = useState("");

  // Training days & exercises
  const [trainDays, setTrainDays] = useState([]);
  const [exercisesByDay, setExercisesByDay] = useState({});

  // Selected day (for mobile view & day pills scroll)
  const [selectedDayId, setSelectedDayId] = useState(null);

  // Library state
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    () => window.innerWidth >= 768,
  );
  const deferredSearch = useDeferredValue(search.trim());
  const {
    categories: workoutCategories,
    isLoading: isCategoriesLoading,
  } = useWorkoutExerciseCategories({ enabled: isActive });
  const categories = useMemo(
    () => [
      "all",
      ...map(workoutCategories, (category) => get(category, "name")).filter(
        Boolean,
      ),
    ],
    [workoutCategories],
  );
  const selectedCategory = useMemo(
    () =>
      selectedGroup === "all"
        ? null
        : find(
            workoutCategories,
            (category) => get(category, "name") === selectedGroup,
          ),
    [selectedGroup, workoutCategories],
  );
  const { exercises: libraryExercises } = useWorkoutExercises(
    {
      categoryId: get(selectedCategory, "id"),
      query: deferredSearch,
    },
    {
      enabled: isActive && !isCategoriesLoading,
    },
  );

  // Mobile exercise library drawer
  const [mobileLibraryOpen, setMobileLibraryOpen] = useState(false);
  const [metaDrawerOpen, setMetaDrawerOpen] = useState(false);

  // ─── Initialize from plan ──────────────────────────────────────────────
  useEffect(() => {
    if (!isActive) return;
    if (planSource) {
      const { days, exercises } = initFromPlan(planSource, libraryExercises, {
        lockWeekDays,
      });
      setTrainDays(days);
      setExercisesByDay(exercises);
      setPlanName(get(planSource, "name", ""));
      setPlanDescription(get(planSource, "description", ""));
      setSelectedDayId(get(days, "[0].id", null));
    } else if (lockWeekDays) {
      const days = buildWeekDaySkeleton();
      const exercises = fromPairs(map(days, (day) => [get(day, "id"), []]));
      setTrainDays(days);
      setExercisesByDay(exercises);
      setPlanName("");
      setPlanDescription("");
      setSelectedDayId(get(days, "[0].id", null));
    } else {
      // Numbered-day mode: seed with 3 starter days ("1-kun", "2-kun", "3-kun")
      // so the user has something to drop exercises into. They can add or
      // remove days freely.
      const days = buildNumberedDaySkeleton(3, (n) =>
        t("components.workoutPlanBuilder.dayName", { count: n }),
      );
      const exercises = fromPairs(map(days, (day) => [get(day, "id"), []]));
      setTrainDays(days);
      setExercisesByDay(exercises);
      setPlanName("");
      setPlanDescription("");
      setSelectedDayId(get(days, "[0].id", null));
    }
  }, [isActive, planSource, lockWeekDays, t]);

  useEffect(() => {
    if (metaName === null && metaDescription === null) return;

    setPlanName(metaName ?? "");
    setPlanDescription(metaDescription ?? "");
  }, [metaDescription, metaName]);

  useEffect(() => {
    if (selectedGroup === "all" || categories.length <= 1) return;
    if (!categories.includes(selectedGroup)) {
      setSelectedGroup("all");
    }
  }, [categories, selectedGroup]);

  // ─── Filtered exercises for library ─────────────────────────────────────
  const filteredExercises = useMemo(
    () => filterExercises(libraryExercises, search, selectedGroup),
    [search, selectedGroup, libraryExercises],
  );

  // ─── Kanban value ───────────────────────────────────────────────────────
  const kanbanValue = useMemo(() => {
    const result = {};
    map(trainDays, (day) => {
      result[get(day, "id")] = get(exercisesByDay, [get(day, "id")], []);
    });
    return result;
  }, [trainDays, exercisesByDay]);

  const trainDayColumns = useMemo(
    () =>
      map(trainDays, (day) => ({
        ...day,
        items: get(exercisesByDay, [get(day, "id")], []),
      })),
    [trainDays, exercisesByDay],
  );

  // ─── Callbacks ──────────────────────────────────────────────────────────
  const addExerciseToDay = useCallback((exercise, dayId) => {
    const newEx = buildExerciseItem(exercise);
    setExercisesByDay((prev) => ({
      ...prev,
      [dayId]: [...get(prev, [dayId], []), newEx],
    }));
    toast.success(t("components.workoutPlanBuilder.toasts.exerciseAdded", { name: get(exercise, "name") }));
  }, [t]);

  const removeExercise = useCallback((dayId, exerciseId) => {
    setExercisesByDay((prev) => ({
      ...prev,
      [dayId]: filter(get(prev, [dayId], []), (e) => get(e, "id") !== exerciseId),
    }));
  }, []);

  const removeDay = useCallback((dayId) => {
    setTrainDays((prev) => filter(prev, (d) => get(d, "id") !== dayId));
    setExercisesByDay((prev) => {
      const { [dayId]: _, ...rest } = prev;
      return rest;
    });
    toast.info(t("components.workoutPlanBuilder.toasts.dayRemoved"));
  }, [t]);

  const updateDay = useCallback((dayId, updates) => {
    setTrainDays((prev) =>
      map(prev, (d) => (get(d, "id") === dayId ? { ...d, ...updates } : d)),
    );
  }, []);

  const updateExercise = useCallback((dayId, exerciseId, updates) => {
    setExercisesByDay((prev) => ({
      ...prev,
      [dayId]: map(get(prev, [dayId], []), (ex) =>
        get(ex, "id") === exerciseId ? { ...ex, ...updates } : ex,
      ),
    }));
  }, []);

  const addDay = useCallback(() => {
    if (lockWeekDays) return;
    const newId = `day-${Date.now()}`;
    setTrainDays((prev) => {
      const num = size(prev) + 1;
      return [...prev, { id: newId, name: t("components.workoutPlanBuilder.dayName", { count: num }), focus: "" }];
    });
    setExercisesByDay((prev) => ({ ...prev, [newId]: [] }));
    setSelectedDayId(newId);
    toast.success(t("components.workoutPlanBuilder.toasts.dayAdded"));
  }, [lockWeekDays, t]);

  const handleKanbanChange = useCallback(
    (newMap) => {
      if (!lockWeekDays) {
        const newKeyOrder = Object.keys(newMap);
        setTrainDays((prev) =>
          filter(
            map(newKeyOrder, (id) => find(prev, (d) => get(d, "id") === id)),
            Boolean,
          ),
        );
      }
      setExercisesByDay(() => {
        const updated = {};
        for (const [dayId, exercises] of Object.entries(newMap)) {
          updated[dayId] = exercises;
        }
        return updated;
      });
    },
    [lockWeekDays],
  );

  const handleExternalDragEnd = useCallback(
    (event) => {
      const { active, over } = event;
      if (!over) return;
      if (get(active, "data.current.type") === "LibraryExercise") {
        const exercise = get(active, "data.current.exercise");
        const overId = get(over, "id");
        const targetDay =
          find(trainDays, (d) => get(d, "id") === overId) ||
          find(trainDays, (d) =>
            some(get(exercisesByDay, [get(d, "id")], []), (e) => get(e, "id") === overId),
          );
        if (targetDay) addExerciseToDay(exercise, get(targetDay, "id"));
      }
    },
    [trainDays, exercisesByDay, addExerciseToDay],
  );

  const handleSave = useCallback(() => {
    if (!planName.trim()) {
      toast.error(t("components.workoutPlanBuilder.toasts.nameRequired"));
      return;
    }
    if (size(trainDays) === 0) {
      toast.error(t("components.workoutPlanBuilder.toasts.minDays"));
      return;
    }
    const plan = buildSavePlan({
      planSource,
      planName,
      planDescription,
      trainDays,
      exercisesByDay,
    });
    onSave(plan);
  }, [planSource, planName, planDescription, trainDays, exercisesByDay, onSave]);

  const handleMetaSave = useCallback(
    ({ name, description: nextDescription }) => {
      setPlanName(name);
      setPlanDescription(nextDescription);
      onMetaSave?.({
        name,
        description: nextDescription,
      });
    },
    [onMetaSave],
  );

  const selectedDay = find(trainDays, (d) => get(d, "id") === selectedDayId);
  const selectedDayExercises = selectedDayId
    ? get(exercisesByDay, [selectedDayId], [])
    : [];

  const builderContent = (
    <>
      <BuilderHeader
        trainDays={trainDays}
        selectedDayId={selectedDayId}
        onSelectDay={setSelectedDayId}
        onAddDay={addDay}
        onClose={onClose}
        lockWeekDays={lockWeekDays}
        title={planName || title}
        description={description || "Tahrirlash rejimi"}
        asPage={asPage}
        onEditMeta={() => setMetaDrawerOpen(true)}
        onOpenMobileLibrary={() => setMobileLibraryOpen(true)}
      />

      <div
        data-vaul-no-drag
        className="flex flex-col h-full animate-in fade-in duration-300 overflow-hidden"
      >
        {isMobile ? (
          <BuilderMobileView
            trainDays={trainDays}
            selectedDay={selectedDay}
            selectedDayId={selectedDayId}
            selectedDayExercises={selectedDayExercises}
            lockWeekDays={lockWeekDays}
            onUpdateDay={updateDay}
            onUpdateExercise={updateExercise}
            onRemoveExercise={removeExercise}
            onOpenMobileLibrary={() => setMobileLibraryOpen(true)}
          />
        ) : (
          <BuilderDesktopView
            trainDays={trainDays}
            trainDayColumns={trainDayColumns}
            kanbanValue={kanbanValue}
            filteredExercises={filteredExercises}
            categories={categories}
            search={search}
            selectedGroup={selectedGroup}
            isSidebarOpen={isSidebarOpen}
            lockWeekDays={lockWeekDays}
            onSearch={setSearch}
            onSelectGroup={setSelectedGroup}
            onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
            onKanbanChange={handleKanbanChange}
            onExternalDragEnd={handleExternalDragEnd}
            onRemoveExercise={removeExercise}
            onRemoveDay={removeDay}
            onUpdateDay={updateDay}
            onUpdateExercise={updateExercise}
            onAddDay={addDay}
            onAddExerciseToDay={addExerciseToDay}
          />
        )}
      </div>

      <BuilderFooter
        onSave={handleSave}
        isSaving={isSaving}
        saveLabel={submitLabel}
        asPage={asPage}
      />

      <BuilderMetaDrawer
        open={metaDrawerOpen}
        onOpenChange={setMetaDrawerOpen}
        name={planName || title || ""}
        description={planDescription}
        onSave={handleMetaSave}
      />
    </>
  );

  if (asPage) {
    return (
      <>
        <div
          className={cn(
            "flex h-[calc(100svh-9rem)] min-h-[640px] flex-col overflow-hidden rounded-3xl border bg-card text-sm shadow-sm",
            fullscreen && "min-h-[calc(100svh-8rem)]",
          )}
        >
          {builderContent}
        </div>

        <BuilderMobileLibrary
          open={mobileLibraryOpen}
          onOpenChange={setMobileLibraryOpen}
          filteredExercises={filteredExercises}
          categories={categories}
          search={search}
          selectedGroup={selectedGroup}
          selectedDayId={selectedDayId}
          onSearch={setSearch}
          onSelectGroup={setSelectedGroup}
          onAddExerciseToDay={addExerciseToDay}
        />
      </>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent
        className={cn(
          "p-0 data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:sm:max-w-full",
        )}
      >
        {builderContent}
      </DrawerContent>

      {/* Mobile: exercise library bottom drawer */}
      <BuilderMobileLibrary
        open={mobileLibraryOpen}
        onOpenChange={setMobileLibraryOpen}
        filteredExercises={filteredExercises}
        categories={categories}
        search={search}
        selectedGroup={selectedGroup}
        selectedDayId={selectedDayId}
        onSearch={setSearch}
        onSelectGroup={setSelectedGroup}
        onAddExerciseToDay={addExerciseToDay}
      />
    </Drawer>
  );
};

export default WorkoutPlanBuilder;
