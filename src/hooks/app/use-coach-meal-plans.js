import React from "react";
import { get } from "lodash";
import { useQueryClient } from "@tanstack/react-query";
import {
  useDeleteQuery,
  useGetQuery,
  usePatchQuery,
  usePostQuery,
} from "@/hooks/api";
import { api } from "@/hooks/api/use-api.js";
import {
  COACH_MEAL_PLANS_QUERY_KEY,
  COACH_DASHBOARD_QUERY_KEY,
  COACH_CLIENTS_QUERY_KEY,
  COACH_CLIENT_DETAIL_QUERY_KEY,
} from "./use-coach-query-keys";

export const useCoachMealPlans = (params = {}) => {
  const queryClient = useQueryClient();
  const { data, ...query } = useGetQuery({
    url: "/coach/meal-plans",
    params,
    queryProps: {
      queryKey: [...COACH_MEAL_PLANS_QUERY_KEY, params],
    },
  });

  const mutationProps = {
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: COACH_MEAL_PLANS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: COACH_DASHBOARD_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: COACH_CLIENTS_QUERY_KEY }),
        queryClient.invalidateQueries({
          queryKey: COACH_CLIENT_DETAIL_QUERY_KEY,
        }),
      ]);
    },
  };

  const createMutation = usePostQuery({
    queryKey: COACH_MEAL_PLANS_QUERY_KEY,
    mutationProps,
  });
  const updateMutation = usePatchQuery({
    queryKey: COACH_MEAL_PLANS_QUERY_KEY,
    mutationProps,
  });
  const duplicateMutation = usePostQuery({
    queryKey: COACH_MEAL_PLANS_QUERY_KEY,
    mutationProps,
  });
  const assignMutation = usePatchQuery({
    queryKey: COACH_MEAL_PLANS_QUERY_KEY,
    mutationProps,
  });
  const assignPreviewMutation = usePostQuery({
    queryKey: COACH_MEAL_PLANS_QUERY_KEY,
  });
  const rollbackMutation = usePostQuery({
    queryKey: COACH_MEAL_PLANS_QUERY_KEY,
    mutationProps,
  });
  const deleteMutation = useDeleteQuery({
    queryKey: COACH_MEAL_PLANS_QUERY_KEY,
    mutationProps,
  });

  const createMealPlan = React.useCallback(
    async (payload) =>
      createMutation.mutateAsync({
        url: "/coach/meal-plans",
        attributes: payload,
      }),
    [createMutation],
  );

  const updateMealPlan = React.useCallback(
    async (planId, payload) =>
      updateMutation.mutateAsync({
        url: `/coach/meal-plans/${planId}`,
        attributes: payload,
      }),
    [updateMutation],
  );

  const duplicateMealPlan = React.useCallback(
    async (planId) =>
      duplicateMutation.mutateAsync({
        url: `/coach/meal-plans/${planId}/duplicate`,
        attributes: {},
      }),
    [duplicateMutation],
  );

  const assignMealPlan = React.useCallback(
    async (planId, clientIds) =>
      assignMutation.mutateAsync({
        url: `/coach/meal-plans/${planId}/assign`,
        attributes: { clientIds },
      }),
    [assignMutation],
  );

  const previewMealPlanAssignment = React.useCallback(
    async (planId, clientIds) => {
      const response = await assignPreviewMutation.mutateAsync({
        url: `/coach/meal-plans/${planId}/assign-preview`,
        attributes: { clientIds },
      });

      return get(response, "data.data", get(response, "data", response));
    },
    [assignPreviewMutation],
  );

  const getMealPlanVersions = React.useCallback(async (planId) => {
    const response = await api.get(`/coach/meal-plans/${planId}/versions`);

    return get(response, "data.data", get(response, "data", response));
  }, []);

  const rollbackMealPlanVersion = React.useCallback(
    async (planId, versionId) => {
      const response = await rollbackMutation.mutateAsync({
        url: `/coach/meal-plans/${planId}/versions/${versionId}/rollback`,
        attributes: {},
      });

      return get(response, "data.data", get(response, "data", response));
    },
    [rollbackMutation],
  );

  const deleteMealPlan = React.useCallback(
    async (planId) =>
      deleteMutation.mutateAsync({
        url: `/coach/meal-plans/${planId}`,
      }),
    [deleteMutation],
  );

  return {
    ...query,
    mealPlans: get(data, "data.items", []),
    clients: get(data, "data.clients", []),
    folders: get(data, "data.folders", []),
    tags: get(data, "data.tags", []),
    meta: get(data, "data.meta", {}),
    createMealPlan,
    updateMealPlan,
    duplicateMealPlan,
    assignMealPlan,
    previewMealPlanAssignment,
    getMealPlanVersions,
    rollbackMealPlanVersion,
    deleteMealPlan,
    isAssigning: assignMutation.isPending,
    isPreviewingAssignment: assignPreviewMutation.isPending,
    isRollingBack: rollbackMutation.isPending,
    isDeleting: deleteMutation.isPending,
    unassignMealPlan: React.useCallback(
      async (planId, clientId) =>
        deleteMutation.mutateAsync({
          url: `/coach/meal-plans/${planId}/assign/${clientId}`,
        }),
      [deleteMutation],
    ),
  };
};
