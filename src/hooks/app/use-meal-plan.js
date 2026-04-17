import React from "react";
import { get, find, map, filter } from "lodash";
import { useQueryClient } from "@tanstack/react-query";
import {
  useDeleteQuery,
  useGetQuery,
  usePostQuery,
  usePutQuery,
} from "@/hooks/api";

export const MEAL_PLAN_QUERY_KEY = ["meal-plans", "me"];

const defaultMealPlanState = {
  plans: [],
  activePlan: null,
  draftPlan: null,
};

const normalizePlan = (plan) => {
  if (!plan) {
    return null;
  }

  return {
    ...plan,
    name: plan.name || "Mening rejam",
    description: plan.description ?? null,
    weeklyKanban:
      plan.weeklyKanban &&
      typeof plan.weeklyKanban === "object" &&
      !Array.isArray(plan.weeklyKanban)
        ? plan.weeklyKanban
        : {},
    startDate: plan.startDate ?? null,
    createdAt: plan.createdAt ?? null,
    updatedAt: plan.updatedAt ?? null,
  };
};

const normalizeMealPlanState = (payload = {}) => {
  const plans = Array.isArray(payload.plans)
    ? filter(map(payload.plans, normalizePlan), Boolean)
    : [];
  const activePlan =
    normalizePlan(payload.activePlan) ||
    find(plans, (plan) => plan.status === "active") ||
    null;
  const draftPlan =
    normalizePlan(payload.draftPlan) ||
    find(plans, (plan) => plan.status === "draft") ||
    null;

  return {
    plans,
    activePlan,
    draftPlan,
  };
};

const buildMealPlanPayload = (plan = {}) => ({
  name: plan.name,
  description: plan.description,
  weeklyKanban:
    plan.weeklyKanban &&
    typeof plan.weeklyKanban === "object" &&
    !Array.isArray(plan.weeklyKanban)
      ? plan.weeklyKanban
      : {},
  source: plan.source,
  goal: plan.goal,
  mealCount: plan.mealCount,
  startDate: plan.startDate,
});

const syncMealPlanCache = (queryClient, response) => {
  const nextState = normalizeMealPlanState(get(response, "data", {}));
  queryClient.setQueryData(MEAL_PLAN_QUERY_KEY, { data: nextState });
  return nextState;
};

export const useMealPlan = (options = {}) => {
  const enabled = options.enabled ?? true;
  const queryClient = useQueryClient();
  const { data, ...query } = useGetQuery({
    url: "/meal-plans/me",
    queryProps: {
      queryKey: MEAL_PLAN_QUERY_KEY,
      enabled,
    },
  });

  const mutationProps = React.useMemo(
    () => ({
      onSuccess: async (response) => {
        syncMealPlanCache(queryClient, response);
      },
    }),
    [queryClient],
  );

  const createDraftMutation = usePostQuery({
    queryKey: MEAL_PLAN_QUERY_KEY,
    mutationProps,
  });
  const updatePlanMutation = usePutQuery({
    queryKey: MEAL_PLAN_QUERY_KEY,
    mutationProps,
  });
  const generateAiMutation = usePostQuery({
    queryKey: MEAL_PLAN_QUERY_KEY,
    mutationProps,
  });
  const activatePlanMutation = usePostQuery({
    queryKey: MEAL_PLAN_QUERY_KEY,
    mutationProps,
  });
  const renamePlanMutation = usePutQuery({
    queryKey: MEAL_PLAN_QUERY_KEY,
    mutationProps,
  });
  const duplicatePlanMutation = usePostQuery({
    queryKey: MEAL_PLAN_QUERY_KEY,
    mutationProps,
  });
  const archivePlanMutation = usePostQuery({
    queryKey: MEAL_PLAN_QUERY_KEY,
    mutationProps,
  });
  const applyCoachUpdateMutation = usePostQuery({
    queryKey: MEAL_PLAN_QUERY_KEY,
    mutationProps,
  });
  const pausePlanMutation = usePostQuery({
    queryKey: MEAL_PLAN_QUERY_KEY,
    mutationProps,
  });
  const deletePlanMutation = useDeleteQuery({
    queryKey: MEAL_PLAN_QUERY_KEY,
    mutationProps,
  });
  const clearAllMutation = useDeleteQuery({
    queryKey: MEAL_PLAN_QUERY_KEY,
    mutationProps,
  });

  const mealPlanState = React.useMemo(
    () => normalizeMealPlanState(get(data, "data", defaultMealPlanState)),
    [data],
  );

  const saveDraftPlan = React.useCallback(
    async (plan) => {
      const payload = buildMealPlanPayload(plan);
      const response = plan?.id
        ? await updatePlanMutation.mutateAsync({
            url: `/meal-plans/me/${plan.id}`,
            attributes: payload,
          })
        : await createDraftMutation.mutateAsync({
            url: "/meal-plans/me",
            attributes: payload,
          });

      return syncMealPlanCache(queryClient, response);
    },
    [createDraftMutation, queryClient, updatePlanMutation],
  );

  const generateAiPlan = React.useCallback(
    async (payload) => {
      const response = await generateAiMutation.mutateAsync({
        url: "/meal-plans/me/ai-generate",
        attributes: payload,
      });
      return syncMealPlanCache(queryClient, response);
    },
    [generateAiMutation, queryClient],
  );

  const startPlan = React.useCallback(
    async (plan) => {
      if (!plan?.id) {
        const createdState = await saveDraftPlan(plan);
        const latestDraft =
          createdState.draftPlan || find(createdState.plans, (item) => item.status === "draft");

        if (!latestDraft?.id) {
          return createdState;
        }

        const activatedResponse = await activatePlanMutation.mutateAsync({
          url: `/meal-plans/me/${latestDraft.id}/activate`,
          attributes: buildMealPlanPayload(latestDraft),
        });
        return syncMealPlanCache(queryClient, activatedResponse);
      }

      const response = await activatePlanMutation.mutateAsync({
        url: `/meal-plans/me/${plan.id}/activate`,
        attributes: buildMealPlanPayload(plan),
      });
      return syncMealPlanCache(queryClient, response);
    },
    [activatePlanMutation, queryClient, saveDraftPlan],
  );

  const pausePlan = React.useCallback(
    async (planId) => {
      const targetPlanId = planId || mealPlanState.activePlan?.id;
      if (!targetPlanId) {
        return mealPlanState;
      }

      const response = await pausePlanMutation.mutateAsync({
        url: `/meal-plans/me/${targetPlanId}/pause`,
        attributes: {},
      });
      return syncMealPlanCache(queryClient, response);
    },
    [mealPlanState, pausePlanMutation, queryClient],
  );

  const renamePlan = React.useCallback(
    async (planId, name) => {
      if (!planId) {
        return mealPlanState;
      }

      const response = await renamePlanMutation.mutateAsync({
        url: `/meal-plans/me/${planId}/rename`,
        attributes: { name },
      });
      return syncMealPlanCache(queryClient, response);
    },
    [mealPlanState, queryClient, renamePlanMutation],
  );

  const duplicatePlan = React.useCallback(
    async (planId) => {
      if (!planId) {
        return mealPlanState;
      }

      const response = await duplicatePlanMutation.mutateAsync({
        url: `/meal-plans/me/${planId}/duplicate`,
        attributes: {},
      });
      return syncMealPlanCache(queryClient, response);
    },
    [duplicatePlanMutation, mealPlanState, queryClient],
  );

  const archivePlan = React.useCallback(
    async (planId) => {
      if (!planId) {
        return mealPlanState;
      }

      const response = await archivePlanMutation.mutateAsync({
        url: `/meal-plans/me/${planId}/archive`,
        attributes: {},
      });
      return syncMealPlanCache(queryClient, response);
    },
    [archivePlanMutation, mealPlanState, queryClient],
  );

  const applyCoachUpdate = React.useCallback(
    async (planId) => {
      if (!planId) {
        return mealPlanState;
      }

      const response = await applyCoachUpdateMutation.mutateAsync({
        url: `/meal-plans/me/${planId}/apply-coach-update`,
        attributes: {},
      });
      return syncMealPlanCache(queryClient, response);
    },
    [applyCoachUpdateMutation, mealPlanState, queryClient],
  );

  const removePlan = React.useCallback(
    async (planId) => {
      if (!planId) {
        return mealPlanState;
      }

      const response = await deletePlanMutation.mutateAsync({
        url: `/meal-plans/me/${planId}`,
      });
      return syncMealPlanCache(queryClient, response);
    },
    [deletePlanMutation, mealPlanState, queryClient],
  );

  const clearAllPlans = React.useCallback(async () => {
    const response = await clearAllMutation.mutateAsync({
      url: "/meal-plans/me",
    });
    return syncMealPlanCache(queryClient, response);
  }, [clearAllMutation, queryClient]);

  return {
    ...query,
    ...mealPlanState,
    generateAiPlan,
    saveDraftPlan,
    startPlan,
    renamePlan,
    duplicatePlan,
    archivePlan,
    applyCoachUpdate,
    pausePlan,
    removePlan,
    clearAllPlans,
    isSavingDraft: createDraftMutation.isPending || updatePlanMutation.isPending,
    isGeneratingAi: generateAiMutation.isPending,
    isStartingPlan: activatePlanMutation.isPending,
    isRenamingPlan: renamePlanMutation.isPending,
    isDuplicatingPlan: duplicatePlanMutation.isPending,
    isArchivingPlan: archivePlanMutation.isPending,
    isApplyingCoachUpdate: applyCoachUpdateMutation.isPending,
    isPausingPlan: pausePlanMutation.isPending,
    isRemovingPlan: deletePlanMutation.isPending,
    isClearingAllPlans: clearAllMutation.isPending,
  };
};

export default useMealPlan;
