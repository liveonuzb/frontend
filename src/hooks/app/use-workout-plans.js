import React from "react";
import { find, filter, get, some, fromPairs, isArray, map, toNumber, toPairs } from "lodash";
import { useQueryClient } from "@tanstack/react-query";
import {
  useDeleteQuery,
  useGetQuery,
  usePatchQuery,
  usePostQuery,
} from "@/hooks/api";
import { getApiResponseData } from "@/lib/api-response";
import { WORKOUT_OVERVIEW_QUERY_KEY } from "@/hooks/app/use-workout-overview";

export const WORKOUT_PLANS_QUERY_KEY = ["user", "workout", "plans"];
export const WORKOUT_EXERCISES_QUERY_KEY = ["user", "workout", "exercises"];
export const CUSTOM_WORKOUT_EXERCISES_QUERY_KEY = [
  "user",
  "workout",
  "custom-exercises",
];
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
  "начальный": WORKOUT_PLAN_DIFFICULTY.beginner,
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

export const getWorkoutPlanDetailQueryKey = (planId) => [
  "user",
  "workout",
  "plans",
  planId,
];

const resolveResponseData = (response, fallback = null) =>
  get(response, "data.data", get(response, "data", fallback));

const sanitizeJsonPayload = (value) => {
  if (value === undefined) {
    return null;
  }

  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (isArray(value)) {
    return map(value, (item) =>
      item === undefined ? null : sanitizeJsonPayload(item));
  }

  if (typeof value === "object") {
    return fromPairs(map(filter(toPairs(value), ([, item]) => item !== undefined), ([key, item]) => [key, sanitizeJsonPayload(item)]));
  }

  return String(value);
};

const countDaysPerWeek = (schedule = []) =>
  isArray(schedule)
    ? filter(
        schedule,
        (day) => isArray(day?.exercises) && day.exercises.length > 0,
      ).length
    : 0;

const normalizePlan = (plan) => {
  if (!plan) {
    return null;
  }

  const schedule = isArray(plan.schedule) ? plan.schedule : [];

  return {
    ...plan,
    name: plan.name || "Mening workout rejam",
    description: plan.description || "",
    coverImageUrl: plan.coverImageUrl || null,
    difficulty: normalizeWorkoutPlanDifficulty(plan.difficulty),
    status: normalizeWorkoutPlanStatus(plan.status),
    days: toNumber(plan.days ?? 28) || 28,
    daysPerWeek:
      toNumber(plan.daysPerWeek ?? countDaysPerWeek(schedule)) ||
      countDaysPerWeek(schedule),
    schedule,
    generationMeta: plan.generationMeta ?? null,
    dayProgress: isArray(plan.dayProgress)
      ? map(plan.dayProgress, (item) => ({
          dayIndex: toNumber(item?.dayIndex ?? 0) || 0,
          completed: Boolean(item?.completed),
          completedAt: item?.completedAt ?? null,
          exerciseCount: toNumber(item?.exerciseCount ?? 0) || 0,
        }))
      : [],
    startDate: plan.startDate ?? null,
    createdAt: plan.createdAt ?? null,
    updatedAt: plan.updatedAt ?? null,
    source: plan.source || "manual",
  };
};

const normalizeTemplate = (plan) => {
  const normalized = normalizePlan(plan);

  if (!normalized) {
    return null;
  }

  return {
    ...normalized,
    status: normalizeWorkoutPlanStatus(plan.status, WORKOUT_PLAN_STATUS.template),
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

export const normalizeWorkoutPlansState = (payload = {}) => {
  const items = isArray(payload.items)
    ? filter(map(payload.items, normalizePlan), Boolean)
    : [];
  const templates = isArray(payload.templates)
    ? filter(map(payload.templates, normalizeTemplate), Boolean)
    : [];
  const activePlanId = payload.activePlanId ?? null;
  const draftPlanId = payload.draftPlanId ?? null;

  return {
    items,
    templates,
    activePlanId,
    draftPlanId,
  };
};

export const buildWorkoutPlanPayload = (plan = {}) => ({
  name: plan.name,
  description: plan.description,
  coverImageUrl: plan.coverImageUrl,
  difficulty: normalizeWorkoutPlanDifficulty(plan.difficulty, undefined),
  days:
    plan.days === undefined || plan.days === null || plan.days === ""
      ? undefined
      : toNumber(plan.days),
  daysPerWeek:
    plan.daysPerWeek === undefined ||
    plan.daysPerWeek === null ||
    plan.daysPerWeek === ""
      ? undefined
      : toNumber(plan.daysPerWeek),
  schedule: sanitizeJsonPayload(isArray(plan.schedule) ? plan.schedule : []),
  generationMeta:
    plan.generationMeta === undefined
      ? undefined
      : sanitizeJsonPayload(plan.generationMeta),
  source: plan.source,
  startDate: plan.startDate,
});

const invalidateWorkoutPlanQueries = async (
  queryClient,
  { planId } = {},
) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: WORKOUT_PLANS_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: WORKOUT_OVERVIEW_QUERY_KEY }),
    ...(planId
      ? [
          queryClient.invalidateQueries({
            queryKey: getWorkoutPlanDetailQueryKey(planId),
          }),
        ]
      : []),
  ]);
};

const invalidateWorkoutExerciseQueries = async (queryClient) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: WORKOUT_EXERCISES_QUERY_KEY }),
    queryClient.invalidateQueries({
      queryKey: CUSTOM_WORKOUT_EXERCISES_QUERY_KEY,
    }),
    queryClient.invalidateQueries({ queryKey: ["user", "workout", "catalog"] }),
  ]);
};

export const buildCustomExercisePayload = (exercise = {}) => ({
  name: exercise.name,
  description: exercise.description,
  trackingType: exercise.trackingType || "REPS_WEIGHT",
  defaultSets:
    exercise.defaultSets === undefined ||
    exercise.defaultSets === null ||
    exercise.defaultSets === ""
      ? undefined
      : toNumber(exercise.defaultSets),
  defaultReps:
    exercise.defaultReps === undefined ||
    exercise.defaultReps === null ||
    exercise.defaultReps === ""
      ? undefined
      : toNumber(exercise.defaultReps),
  defaultDurationSeconds:
    exercise.defaultDurationSeconds === undefined ||
    exercise.defaultDurationSeconds === null ||
    exercise.defaultDurationSeconds === ""
      ? undefined
      : toNumber(exercise.defaultDurationSeconds),
  defaultDistanceMeters:
    exercise.defaultDistanceMeters === undefined ||
    exercise.defaultDistanceMeters === null ||
    exercise.defaultDistanceMeters === ""
      ? undefined
      : toNumber(exercise.defaultDistanceMeters),
  defaultRestSeconds:
    exercise.defaultRestSeconds === undefined ||
    exercise.defaultRestSeconds === null ||
    exercise.defaultRestSeconds === ""
      ? undefined
      : toNumber(exercise.defaultRestSeconds),
  equipment: exercise.equipment,
  equipments: isArray(exercise.equipments) ? exercise.equipments : [],
  targetMuscles: isArray(exercise.targetMuscles) ? exercise.targetMuscles : [],
  bodyParts: isArray(exercise.bodyParts) ? exercise.bodyParts : [],
  secondaryMuscles: isArray(exercise.secondaryMuscles)
    ? exercise.secondaryMuscles
    : [],
  instructions: isArray(exercise.instructions) ? exercise.instructions : [],
  imageUrl: exercise.imageUrl,
  videoUrl: exercise.videoUrl || exercise.youtubeUrl,
  visibility: exercise.visibility || "private",
});

export const useWorkoutPlans = (options = {}) => {
  const enabled = options.enabled ?? true;
  const { data, ...query } = useGetQuery({
    url: "/user/workout/plans",
    queryProps: {
      queryKey: WORKOUT_PLANS_QUERY_KEY,
      enabled,
    },
  });

  const state = React.useMemo(
    () => normalizeWorkoutPlansState(resolveResponseData(data, {})),
    [data],
  );

  return {
    ...query,
    ...state,
    data,
  };
};

export const useWorkoutPlanDetail = (planId, options = {}) => {
  const enabled = options.enabled ?? true;
  const { data, ...query } = useGetQuery({
    url: `/user/workout/plans/${planId}`,
    queryProps: {
      queryKey: getWorkoutPlanDetailQueryKey(planId),
      enabled: Boolean(planId) && enabled,
    },
  });

  const plan = React.useMemo(
    () => normalizePlan(resolveResponseData(data)),
    [data],
  );

  return {
    ...query,
    data,
    plan,
  };
};

export const useCreateWorkoutPlan = () => {
  const queryClient = useQueryClient();
  const mutation = usePostQuery({
    mutationProps: {
      onSuccess: async () => {
        await invalidateWorkoutPlanQueries(queryClient);
      },
    },
  });

  const createPlan = React.useCallback(
    async (plan) => {
      const response = await mutation.mutateAsync({
        url: "/user/workout/plans",
        attributes: buildWorkoutPlanPayload(plan),
      });

      return normalizePlan(resolveResponseData(response));
    },
    [mutation],
  );

  return {
    ...mutation,
    createPlan,
  };
};

export const useWorkoutCatalog = (options = {}) => {
  const enabled = options.enabled ?? true;
  const { data, ...query } = useGetQuery({
    url: "/user/workout/plans/catalog",
    queryProps: {
      queryKey: ["user", "workout", "catalog"],
      enabled,
    },
  });

  const catalog = React.useMemo(
    () =>
      getApiResponseData(data, {
        equipments: [],
        muscles: [],
        bodyParts: [],
        exercises: [],
      }),
    [data],
  );

  return {
    ...query,
    catalog,
  };
};

export const useWorkoutExerciseCategories = (options = {}) => {
  const enabled = options.enabled ?? true;
  const { data, ...query } = useGetQuery({
    url: "/user/workout/plans/exercise-categories",
    queryProps: {
      queryKey: ["user", "workout", "exercise-categories"],
      enabled,
    },
  });

  const categories = React.useMemo(
    () => getApiResponseData(data, []),
    [data],
  );

  return {
    ...query,
    data,
    categories: isArray(categories) ? categories : [],
  };
};

export const useWorkoutExercises = (params = {}, options = {}) => {
  const enabled = options.enabled ?? true;
  const queryParams = React.useMemo(
    () => ({
      ...(params.categoryId ? { categoryId: params.categoryId } : {}),
      ...(params.equipmentId ? { equipmentId: params.equipmentId } : {}),
      ...(params.muscleId ? { muscleId: params.muscleId } : {}),
      ...(params.query ? { query: params.query } : {}),
      ...(params.limit ? { limit: params.limit } : {}),
      ...(params.cursor ? { cursor: params.cursor } : {}),
      ...(params.source ? { source: params.source } : {}),
      ...(params.sort ? { sort: params.sort } : {}),
    }),
    [
      params.categoryId,
      params.cursor,
      params.equipmentId,
      params.limit,
      params.muscleId,
      params.query,
      params.source,
      params.sort,
    ],
  );
  const { data, ...query } = useGetQuery({
    url: "/user/workout/plans/exercises",
    params: queryParams,
    queryProps: {
      queryKey: [...WORKOUT_EXERCISES_QUERY_KEY, queryParams],
      enabled,
    },
  });

  const exercisePayload = React.useMemo(
    () => getApiResponseData(data, []),
    [data],
  );
  const exercises = React.useMemo(
    () =>
      isArray(exercisePayload)
        ? exercisePayload
        : isArray(get(exercisePayload, "data"))
          ? get(exercisePayload, "data")
          : [],
    [exercisePayload],
  );
  const meta = React.useMemo(
    () =>
      get(
        data,
        "data.meta",
        get(data, "data.data.meta", get(exercisePayload, "meta", {})),
      ),
    [data, exercisePayload],
  );

  return {
    ...query,
    data,
    exercises: isArray(exercises) ? exercises : [],
    meta,
  };
};

export const useCustomWorkoutExercises = (params = {}, options = {}) => {
  const enabled = options.enabled ?? true;
  const queryParams = React.useMemo(
    () => ({
      ...(params.query ? { query: params.query } : {}),
      ...(params.limit ? { limit: params.limit } : {}),
      ...(params.cursor ? { cursor: params.cursor } : {}),
    }),
    [params.cursor, params.limit, params.query],
  );
  const { data, ...query } = useGetQuery({
    url: "/user/workout/plans/custom-exercises",
    params: queryParams,
    queryProps: {
      queryKey: [...CUSTOM_WORKOUT_EXERCISES_QUERY_KEY, queryParams],
      enabled,
    },
  });
  const exercisePayload = React.useMemo(
    () => getApiResponseData(data, []),
    [data],
  );

  return {
    ...query,
    data,
    exercises: isArray(get(exercisePayload, "data"))
      ? get(exercisePayload, "data")
      : [],
    meta: get(exercisePayload, "meta", {}),
  };
};

export const useCreateCustomWorkoutExercise = () => {
  const queryClient = useQueryClient();
  const mutation = usePostQuery({
    mutationProps: {
      onSuccess: async () => {
        await invalidateWorkoutExerciseQueries(queryClient);
      },
    },
  });

  const createExercise = React.useCallback(
    async (exercise) => {
      const response = await mutation.mutateAsync({
        url: "/user/workout/plans/custom-exercises",
        attributes: buildCustomExercisePayload(exercise),
      });

      return getApiResponseData(response, null);
    },
    [mutation],
  );

  return {
    ...mutation,
    createExercise,
  };
};

export const useUpdateCustomWorkoutExercise = () => {
  const queryClient = useQueryClient();
  const mutation = usePatchQuery({
    mutationProps: {
      onSuccess: async () => {
        await invalidateWorkoutExerciseQueries(queryClient);
      },
    },
  });

  const updateExercise = React.useCallback(
    async (exerciseId, exercise) => {
      const response = await mutation.mutateAsync({
        url: `/user/workout/plans/custom-exercises/${exerciseId}`,
        attributes: buildCustomExercisePayload(exercise),
      });

      return getApiResponseData(response, null);
    },
    [mutation],
  );

  return {
    ...mutation,
    updateExercise,
  };
};

export const useDeleteCustomWorkoutExercise = () => {
  const queryClient = useQueryClient();
  const mutation = useDeleteQuery({
    mutationProps: {
      onSuccess: async () => {
        await invalidateWorkoutExerciseQueries(queryClient);
      },
    },
  });

  const deleteExercise = React.useCallback(
    async (exerciseId) =>
      mutation.mutateAsync({
        url: `/user/workout/plans/custom-exercises/${exerciseId}`,
      }),
    [mutation],
  );

  return {
    ...mutation,
    deleteExercise,
  };
};

export const useGenerateWorkoutPlan = () => {
  const mutation = usePostQuery();

  const generatePlan = React.useCallback(
    async (payload) => {
      const response = await mutation.mutateAsync({
        url: "/user/workout/plans/generate",
        attributes: payload,
      });

      return getApiResponseData(response, null);
    },
    [mutation],
  );

  return {
    ...mutation,
    generatePlan,
  };
};

export const useRegenerateWorkoutPlanDay = () => {
  const queryClient = useQueryClient();
  const mutation = usePostQuery({
    mutationProps: {
      onSuccess: async (_, variables) => {
        await invalidateWorkoutPlanQueries(queryClient, {
          planId: variables?.planId,
        });
      },
    },
  });

  const regenerateDay = React.useCallback(
    async (planId, dayIndex, payload = {}) => {
      const response = await mutation.mutateAsync({
        url: `/user/workout/plans/${planId}/days/${dayIndex}/regenerate`,
        attributes: payload,
        planId,
      });

      return normalizePlan(resolveResponseData(response));
    },
    [mutation],
  );

  return {
    ...mutation,
    regenerateDay,
  };
};

export const useUpdateWorkoutPlan = () => {
  const queryClient = useQueryClient();
  const mutation = usePatchQuery({
    mutationProps: {
      onSuccess: async (_, variables) => {
        await invalidateWorkoutPlanQueries(queryClient, {
          planId: variables?.planId,
        });
      },
    },
  });

  const updatePlan = React.useCallback(
    async (planId, plan) => {
      const response = await mutation.mutateAsync({
        url: `/user/workout/plans/${planId}`,
        attributes: buildWorkoutPlanPayload(plan),
        planId,
      });

      return normalizePlan(resolveResponseData(response));
    },
    [mutation],
  );

  return {
    ...mutation,
    updatePlan,
  };
};

export const useActivateWorkoutPlan = () => {
  const queryClient = useQueryClient();
  const mutation = usePostQuery({
    mutationProps: {
      onSuccess: async (_, variables) => {
        await invalidateWorkoutPlanQueries(queryClient, {
          planId: variables?.planId,
        });
      },
    },
  });

  const activatePlan = React.useCallback(
    async (planId, plan = {}) => {
      const response = await mutation.mutateAsync({
        url: `/user/workout/plans/${planId}/activate`,
        attributes: buildWorkoutPlanPayload(plan),
        planId,
      });

      return normalizePlan(resolveResponseData(response));
    },
    [mutation],
  );

  return {
    ...mutation,
    activatePlan,
  };
};

export const usePauseWorkoutPlan = () => {
  const queryClient = useQueryClient();
  const mutation = usePostQuery({
    mutationProps: {
      onSuccess: async (_, variables) => {
        await invalidateWorkoutPlanQueries(queryClient, {
          planId: variables?.planId,
        });
      },
    },
  });

  const pausePlan = React.useCallback(
    async (planId) => {
      const response = await mutation.mutateAsync({
        url: `/user/workout/plans/${planId}/pause`,
        attributes: {},
        planId,
      });

      return normalizePlan(resolveResponseData(response));
    },
    [mutation],
  );

  return {
    ...mutation,
    pausePlan,
  };
};

export const useDeleteWorkoutPlan = () => {
  const queryClient = useQueryClient();
  const mutation = useDeleteQuery({
    mutationProps: {
      onSuccess: async (_, variables) => {
        await invalidateWorkoutPlanQueries(queryClient, {
          planId: variables?.planId,
        });
      },
    },
  });

  const deletePlan = React.useCallback(
    async (planId) =>
      mutation.mutateAsync({
        url: `/user/workout/plans/${planId}`,
        planId,
      }),
    [mutation],
  );

  return {
    ...mutation,
    deletePlan,
  };
};

export const usePersistedWorkoutPlan = () => {
  const plansState = useWorkoutPlans();

  const activePlan = React.useMemo(
    () =>
      find(plansState.items, (plan) => plan.id === plansState.activePlanId) ??
      null,
    [plansState.activePlanId, plansState.items],
  );
  const draftPlan = React.useMemo(
    () =>
      find(plansState.items, (plan) => plan.id === plansState.draftPlanId) ??
      null,
    [plansState.draftPlanId, plansState.items],
  );

  return {
    ...plansState,
    activePlan,
    draftPlan,
  };
};

export const isPersistedWorkoutPlan = (plans = [], plan) =>
  Boolean(
    plan?.id && some(plans, (savedPlan) => savedPlan.id === plan.id),
  );
