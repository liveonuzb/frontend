import React from "react";
import {
  find,
  filter,
  fromPairs,
  get,
  isArray,
  map,
  some,
  startsWith,
  toNumber,
  toPairs,
} from "lodash";
import { useQueryClient } from "@tanstack/react-query";
import {
  useDeleteQuery,
  useGetQuery,
  usePatchQuery,
  usePostQuery,
} from "@/hooks/api";
import { getApiResponseData } from "@/lib/api-response";
import { WORKOUT_OVERVIEW_QUERY_KEY } from "@/hooks/app/use-workout-overview";
import {
  WORKOUT_PLAN_DIFFICULTY,
  WORKOUT_PLAN_STATUS,
  normalizeWorkoutPlanDifficulty,
  normalizeWorkoutPlanSnapshot,
  normalizeWorkoutPlanStatus,
  normalizeWorkoutPlansCollection,
} from "./workout-state-normalizer.js";

export const WORKOUT_PLANS_QUERY_KEY = ["user", "workout", "plans"];
export const WORKOUT_EXERCISES_QUERY_KEY = ["user", "workout", "exercises"];
export const CUSTOM_WORKOUT_EXERCISES_QUERY_KEY = [
  "user",
  "workout",
  "custom-exercises",
];
export {
  WORKOUT_PLAN_DIFFICULTY,
  WORKOUT_PLAN_STATUS,
  normalizeWorkoutPlanDifficulty,
  normalizeWorkoutPlanStatus,
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

const normalizePlan = normalizeWorkoutPlanSnapshot;

export const normalizeWorkoutPlansState = normalizeWorkoutPlansCollection;

export const mergeActivatedWorkoutPlanState = (
  payload = {},
  activatedPlan,
) => {
  const state = normalizeWorkoutPlansState(payload);
  const normalizedActivatedPlan = normalizePlan(activatedPlan);

  if (!normalizedActivatedPlan?.id) {
    return state;
  }

  const activePlan = {
    ...normalizedActivatedPlan,
    status: WORKOUT_PLAN_STATUS.active,
  };
  const itemsWithoutActivatedPlan = filter(
    state.items,
    (plan) => plan.id !== activePlan.id,
  );
  const nextItems = [
    activePlan,
    ...map(itemsWithoutActivatedPlan, (plan) =>
      plan.status === WORKOUT_PLAN_STATUS.active
        ? {
            ...plan,
            status: WORKOUT_PLAN_STATUS.draft,
            startDate: null,
          }
        : plan,
    ),
  ];

  return {
    ...state,
    items: nextItems,
    activePlanId: activePlan.id,
    draftPlanId:
      get(
        find(nextItems, (plan) => plan.status === WORKOUT_PLAN_STATUS.draft),
        "id",
      ) ?? null,
  };
};

export const isTemplateActivationFallbackEligible = (error, plan = {}) => {
  const status =
    get(error, "response.status") ??
    get(error, "response.data.statusCode") ??
    get(error, "status");
  const isTemplatePlan = Boolean(
    plan?.isTemplate ||
      plan?.source === "template" ||
      startsWith(String(plan?.id ?? ""), "workout-template-"),
  );
  const hasPlanPayload = Boolean(
    plan?.name || (isArray(plan?.schedule) && plan.schedule.length > 0),
  );

  return Number(status) === 404 && isTemplatePlan && hasPlanPayload;
};

const buildWorkoutPlansCacheValue = (state) => ({
  data: {
    data: state,
  },
});

const syncActivatedWorkoutPlanCache = (queryClient, response) => {
  const activatedPlan = normalizePlan(resolveResponseData(response));

  if (!activatedPlan?.id) {
    return activatedPlan;
  }

  queryClient.setQueryData(WORKOUT_PLANS_QUERY_KEY, (current) =>
    buildWorkoutPlansCacheValue(
      mergeActivatedWorkoutPlanState(resolveResponseData(current, {}), activatedPlan),
    ),
  );
  queryClient.setQueryData(
    getWorkoutPlanDetailQueryKey(activatedPlan.id),
    {
      data: {
        data: activatedPlan,
      },
    },
  );

  return activatedPlan;
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
  const createPlanMutation = useCreateWorkoutPlan();
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
      const requestedPlan = {
        ...plan,
        id: plan?.id ?? planId,
      };
      const activateById = (targetPlanId, payload) =>
        mutation.mutateAsync({
          url: `/user/workout/plans/${targetPlanId}/activate`,
          attributes: buildWorkoutPlanPayload(payload),
          planId: targetPlanId,
        });

      try {
        const response = await activateById(planId, plan);

        return syncActivatedWorkoutPlanCache(queryClient, response);
      } catch (error) {
        if (!isTemplateActivationFallbackEligible(error, requestedPlan)) {
          throw error;
        }

        const createdPlan = await createPlanMutation.createPlan({
          ...requestedPlan,
          source: "template",
        });

        if (!createdPlan?.id) {
          throw error;
        }

        const response = await activateById(createdPlan.id, createdPlan);

        return syncActivatedWorkoutPlanCache(queryClient, response);
      }
    },
    [createPlanMutation, mutation, queryClient],
  );

  return {
    ...mutation,
    isPending: mutation.isPending || createPlanMutation.isPending,
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

export const useDuplicateWorkoutPlan = () => {
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

  const duplicatePlan = React.useCallback(
    async (planId) => {
      const response = await mutation.mutateAsync({
        url: `/user/workout/plans/${planId}/duplicate`,
        attributes: {},
        planId,
      });

      return normalizePlan(resolveResponseData(response));
    },
    [mutation],
  );

  return {
    ...mutation,
    duplicatePlan,
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
