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
    difficulty: plan.difficulty || "O'rta",
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
    status: plan.status || "template",
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
  difficulty: plan.difficulty,
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
      ...(params.query ? { query: params.query } : {}),
    }),
    [params.categoryId, params.query],
  );
  const { data, ...query } = useGetQuery({
    url: "/user/workout/plans/exercises",
    params: queryParams,
    queryProps: {
      queryKey: ["user", "workout", "exercises", queryParams],
      enabled,
    },
  });

  const exercises = React.useMemo(() => getApiResponseData(data, []), [data]);

  return {
    ...query,
    data,
    exercises: isArray(exercises) ? exercises : [],
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
