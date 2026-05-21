import { filter, get, isArray, map, toNumber } from "lodash";

export const WORKOUT_PLAN_DIFFICULTY = {
  beginner: "beginner",
  intermediate: "intermediate",
  advanced: "advanced",
};

export const WORKOUT_PLAN_STATUS = {
  active: "active",
  draft: "draft",
  archived: "archived",
  template: "template",
};

const WORKOUT_PLAN_DIFFICULTY_ALIASES = {
  beginner: WORKOUT_PLAN_DIFFICULTY.beginner,
  "boshlang'ich": WORKOUT_PLAN_DIFFICULTY.beginner,
  boshlangich: WORKOUT_PLAN_DIFFICULTY.beginner,
  начальный: WORKOUT_PLAN_DIFFICULTY.beginner,
  intermediate: WORKOUT_PLAN_DIFFICULTY.intermediate,
  "o'rta": WORKOUT_PLAN_DIFFICULTY.intermediate,
  orta: WORKOUT_PLAN_DIFFICULTY.intermediate,
  средний: WORKOUT_PLAN_DIFFICULTY.intermediate,
  advanced: WORKOUT_PLAN_DIFFICULTY.advanced,
  yuqori: WORKOUT_PLAN_DIFFICULTY.advanced,
  продвинутый: WORKOUT_PLAN_DIFFICULTY.advanced,
};

export const normalizeWorkoutPlanDifficulty = (
  value,
  fallback = WORKOUT_PLAN_DIFFICULTY.intermediate,
) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();

  return WORKOUT_PLAN_DIFFICULTY_ALIASES[normalized] ?? fallback;
};

export const normalizeWorkoutPlanStatus = (
  value,
  fallback = WORKOUT_PLAN_STATUS.draft,
) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();

  return Object.values(WORKOUT_PLAN_STATUS).includes(normalized)
    ? normalized
    : fallback;
};

const countDaysPerWeek = (schedule = []) =>
  isArray(schedule)
    ? filter(
        schedule,
        (day) => isArray(day?.exercises) && day.exercises.length > 0,
      ).length
    : 0;

export const normalizeNextWorkoutSnapshot = (workout) => {
  if (!workout || typeof workout !== "object") {
    return null;
  }

  return {
    ...workout,
    planId: workout.planId ?? null,
    dayIndex: toNumber(workout.dayIndex ?? 0) || 0,
    title: workout.title ?? "",
    focus: workout.focus ?? null,
    duration: workout.duration ?? null,
    estimatedCalories:
      toNumber(workout.estimatedCalories ?? workout.calories ?? 0) || 0,
    exerciseCount:
      toNumber(workout.exerciseCount ?? workout.exercisesCount ?? 0) || 0,
    completed: Boolean(workout.completed),
    completedAt: workout.completedAt ?? null,
    skipped: Boolean(workout.skipped),
    skippedAt: workout.skippedAt ?? null,
    isStartable: workout.isStartable !== false,
  };
};

export const normalizeTodayWorkoutSnapshot = (workout, nextWorkout = null) => {
  const source = workout && typeof workout === "object" ? workout : nextWorkout;
  if (!source || typeof source !== "object") {
    return null;
  }

  return {
    ...source,
    planId: source.planId ?? nextWorkout?.planId ?? null,
    dayIndex: toNumber(source.dayIndex ?? nextWorkout?.dayIndex ?? 0) || 0,
    title: source.title ?? nextWorkout?.title ?? "",
    focus: source.focus ?? nextWorkout?.focus ?? null,
    duration: source.duration ?? nextWorkout?.duration ?? null,
    calories:
      toNumber(
        source.calories ??
          source.estimatedCalories ??
          nextWorkout?.estimatedCalories ??
          0,
      ) || 0,
    estimatedCalories:
      toNumber(
        source.estimatedCalories ??
          source.calories ??
          nextWorkout?.estimatedCalories ??
          0,
      ) || 0,
    exercisesCount:
      toNumber(
        source.exercisesCount ??
          source.exerciseCount ??
          nextWorkout?.exerciseCount ??
          0,
      ) || 0,
    exerciseCount:
      toNumber(
        source.exerciseCount ??
          source.exercisesCount ??
          nextWorkout?.exerciseCount ??
          0,
      ) || 0,
  };
};

export const normalizeWorkoutPlanSnapshot = (plan, options = {}) => {
  if (!plan || typeof plan !== "object") {
    return null;
  }

  const schedule = isArray(plan.schedule) ? plan.schedule : [];
  const nextWorkout = normalizeNextWorkoutSnapshot(plan.nextWorkout);
  const statusFallback = options.statusFallback ?? WORKOUT_PLAN_STATUS.draft;

  return {
    ...plan,
    name: plan.name || "Mening workout rejam",
    description: plan.description || "",
    coverImageUrl: plan.coverImageUrl || null,
    difficulty: normalizeWorkoutPlanDifficulty(plan.difficulty),
    status: normalizeWorkoutPlanStatus(plan.status, statusFallback),
    days: toNumber(plan.days ?? 28) || 28,
    daysPerWeek:
      toNumber(plan.daysPerWeek ?? countDaysPerWeek(schedule)) ||
      countDaysPerWeek(schedule),
    completedWorkouts: toNumber(plan.completedWorkouts ?? 0) || 0,
    skippedWorkouts: toNumber(plan.skippedWorkouts ?? 0) || 0,
    remainingWorkouts: toNumber(plan.remainingWorkouts ?? 0) || 0,
    targetWorkouts: toNumber(plan.targetWorkouts ?? 0) || 0,
    progress: toNumber(plan.progress ?? 0) || 0,
    schedule,
    generationMeta: plan.generationMeta ?? null,
    dayProgress: isArray(plan.dayProgress)
      ? map(plan.dayProgress, (item) => ({
          ...item,
          dayIndex: toNumber(item?.dayIndex ?? 0) || 0,
          completed: Boolean(item?.completed),
          completedAt: item?.completedAt ?? null,
          skipped: Boolean(item?.skipped),
          skippedAt: item?.skippedAt ?? null,
          exerciseCount: toNumber(item?.exerciseCount ?? 0) || 0,
        }))
      : [],
    nextWorkout,
    todayWorkout: normalizeTodayWorkoutSnapshot(plan.todayWorkout, nextWorkout),
    startDate: plan.startDate ?? null,
    createdAt: plan.createdAt ?? null,
    updatedAt: plan.updatedAt ?? null,
    source: plan.source || "manual",
  };
};

export const normalizeWorkoutPlanTemplateSnapshot = (plan) => {
  const normalized = normalizeWorkoutPlanSnapshot(plan, {
    statusFallback: WORKOUT_PLAN_STATUS.template,
  });

  if (!normalized) {
    return null;
  }

  return {
    ...normalized,
    status: WORKOUT_PLAN_STATUS.template,
    isTemplate: Boolean(plan.isTemplate ?? true),
    translations:
      plan.translations && typeof plan.translations === "object"
        ? plan.translations
        : {},
    descriptionTranslations:
      plan.descriptionTranslations &&
      typeof plan.descriptionTranslations === "object"
        ? plan.descriptionTranslations
        : {},
  };
};

const normalizeActiveWorkoutSession = (activeSession) => {
  if (!activeSession || typeof activeSession !== "object") {
    return null;
  }

  const session =
    activeSession.session && typeof activeSession.session === "object"
      ? {
          ...activeSession.session,
          planDayIndex:
            activeSession.session.planDayIndex === undefined ||
            activeSession.session.planDayIndex === null
              ? null
              : toNumber(activeSession.session.planDayIndex),
        }
      : null;

  return {
    type: activeSession.type === "running" ? "running" : "strength",
    session,
  };
};

export const normalizeWorkoutStateSnapshot = (
  state = {},
  fallbackActivePlan = null,
) => {
  if (!state || typeof state !== "object" || !Object.keys(state).length) {
    const nextWorkout = fallbackActivePlan?.nextWorkout ?? null;

    return {
      activeSession: null,
      activePlan: fallbackActivePlan,
      nextWorkout,
      canStartWorkout: Boolean(nextWorkout?.isStartable),
      blockReason: null,
      hasSessionConflict: false,
    };
  }

  const activeSession = normalizeActiveWorkoutSession(state.activeSession);
  const activePlan = normalizeWorkoutPlanSnapshot(
    state.activePlan ?? fallbackActivePlan,
  );
  const nextWorkout = normalizeNextWorkoutSnapshot(
    state.nextWorkout ?? activePlan?.nextWorkout,
  );
  const hasSessionConflict = Boolean(state.hasSessionConflict ?? activeSession);

  return {
    activeSession,
    activePlan,
    nextWorkout,
    canStartWorkout:
      state.canStartWorkout === undefined
        ? !hasSessionConflict && Boolean(nextWorkout?.isStartable)
        : Boolean(state.canStartWorkout),
    blockReason: state.blockReason ?? null,
    hasSessionConflict,
  };
};

export const normalizeWorkoutPlansCollection = (payload = {}) => {
  const items = isArray(payload.items)
    ? filter(map(payload.items, normalizeWorkoutPlanSnapshot), Boolean)
    : [];
  const templates = isArray(payload.templates)
    ? filter(map(payload.templates, normalizeWorkoutPlanTemplateSnapshot), Boolean)
    : [];

  return {
    items,
    templates,
    activePlanId: payload.activePlanId ?? null,
    draftPlanId: payload.draftPlanId ?? null,
  };
};
