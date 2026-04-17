import React from "react";
import { find, filter, get, some } from "lodash";
import { useQueryClient } from "@tanstack/react-query";
import {
  useDeleteQuery,
  useGetQuery,
  usePatchQuery,
  usePostQuery,
} from "@/hooks/api";
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

const countDaysPerWeek = (schedule = []) =>
  Array.isArray(schedule)
    ? filter(
        schedule,
        (day) => Array.isArray(day?.exercises) && day.exercises.length > 0,
      ).length
    : 0;

const normalizePlan = (plan) => {
  if (!plan) {
    return null;
  }

  const schedule = Array.isArray(plan.schedule) ? plan.schedule : [];

  return {
    ...plan,
    name: plan.name || "Mening workout rejam",
    description: plan.description || "",
    difficulty: plan.difficulty || "O'rta",
    days: Number(plan.days ?? 28) || 28,
    daysPerWeek:
      Number(plan.daysPerWeek ?? countDaysPerWeek(schedule)) ||
      countDaysPerWeek(schedule),
    schedule,
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
  const items = Array.isArray(payload.items)
    ? filter(payload.items.map(normalizePlan), Boolean)
    : [];
  const templates = Array.isArray(payload.templates)
    ? filter(payload.templates.map(normalizeTemplate), Boolean)
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
  difficulty: plan.difficulty,
  days:
    plan.days === undefined || plan.days === null || plan.days === ""
      ? undefined
      : Number(plan.days),
  daysPerWeek:
    plan.daysPerWeek === undefined ||
    plan.daysPerWeek === null ||
    plan.daysPerWeek === ""
      ? undefined
      : Number(plan.daysPerWeek),
  schedule: Array.isArray(plan.schedule) ? plan.schedule : [],
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
