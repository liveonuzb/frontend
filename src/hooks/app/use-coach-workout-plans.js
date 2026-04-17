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
  COACH_WORKOUT_PLANS_QUERY_KEY,
  COACH_DASHBOARD_QUERY_KEY,
  COACH_CLIENTS_QUERY_KEY,
  COACH_CLIENT_DETAIL_QUERY_KEY,
} from "./use-coach-query-keys";

export const useCoachWorkoutPlans = (params = {}) => {
  const queryClient = useQueryClient();
  const { data, ...query } = useGetQuery({
    url: "/coach/workout-plans",
    params,
    queryProps: {
      queryKey: [...COACH_WORKOUT_PLANS_QUERY_KEY, params],
    },
  });

  const mutationProps = {
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: COACH_WORKOUT_PLANS_QUERY_KEY,
        }),
        queryClient.invalidateQueries({ queryKey: COACH_DASHBOARD_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: COACH_CLIENTS_QUERY_KEY }),
        queryClient.invalidateQueries({
          queryKey: COACH_CLIENT_DETAIL_QUERY_KEY,
        }),
      ]);
    },
  };

  const createMutation = usePostQuery({
    queryKey: COACH_WORKOUT_PLANS_QUERY_KEY,
    mutationProps,
  });
  const updateMutation = usePatchQuery({
    queryKey: COACH_WORKOUT_PLANS_QUERY_KEY,
    mutationProps,
  });
  const assignMutation = usePostQuery({
    queryKey: COACH_WORKOUT_PLANS_QUERY_KEY,
    mutationProps,
  });
  const assignPreviewMutation = usePostQuery({
    queryKey: COACH_WORKOUT_PLANS_QUERY_KEY,
  });
  const rollbackMutation = usePostQuery({
    queryKey: COACH_WORKOUT_PLANS_QUERY_KEY,
    mutationProps,
  });
  const deleteMutation = useDeleteQuery({
    queryKey: COACH_WORKOUT_PLANS_QUERY_KEY,
    mutationProps,
  });

  const createWorkoutPlan = React.useCallback(
    async (payload) =>
      createMutation.mutateAsync({
        url: "/coach/workout-plans",
        attributes: payload,
      }),
    [createMutation],
  );

  const updateWorkoutPlan = React.useCallback(
    async (planId, payload) =>
      updateMutation.mutateAsync({
        url: `/coach/workout-plans/${planId}`,
        attributes: payload,
      }),
    [updateMutation],
  );

  const assignWorkoutPlan = React.useCallback(
    async (templateId, clientIds) =>
      assignMutation.mutateAsync({
        url: "/coach/workout-plans/assign",
        attributes: { templateId, clientIds },
      }),
    [assignMutation],
  );

  const previewWorkoutPlanAssignment = React.useCallback(
    async (planId, clientIds) => {
      const response = await assignPreviewMutation.mutateAsync({
        url: `/coach/workout-plans/${planId}/assign-preview`,
        attributes: { clientIds },
      });

      return get(response, "data.data", get(response, "data", response));
    },
    [assignPreviewMutation],
  );

  const getWorkoutPlanVersions = React.useCallback(async (planId) => {
    const response = await api.get(`/coach/workout-plans/${planId}/versions`);

    return get(response, "data.data", get(response, "data", response));
  }, []);

  const rollbackWorkoutPlanVersion = React.useCallback(
    async (planId, versionId) => {
      const response = await rollbackMutation.mutateAsync({
        url: `/coach/workout-plans/${planId}/versions/${versionId}/rollback`,
        attributes: {},
      });

      return get(response, "data.data", get(response, "data", response));
    },
    [rollbackMutation],
  );

  const deleteWorkoutPlan = React.useCallback(
    async (planId) =>
      deleteMutation.mutateAsync({
        url: `/coach/workout-plans/${planId}`,
      }),
    [deleteMutation],
  );

  return {
    ...query,
    workoutPlans: get(data, "data.items", get(data, "data.data.items", [])),
    clients: get(data, "data.clients", get(data, "data.data.clients", [])),
    folders: get(data, "data.folders", get(data, "data.data.folders", [])),
    tags: get(data, "data.tags", get(data, "data.data.tags", [])),
    meta: get(data, "data.meta", get(data, "data.data.meta", {})),
    createWorkoutPlan,
    updateWorkoutPlan,
    assignWorkoutPlan,
    previewWorkoutPlanAssignment,
    getWorkoutPlanVersions,
    rollbackWorkoutPlanVersion,
    deleteWorkoutPlan,
    isAssigning: assignMutation.isPending,
    isPreviewingAssignment: assignPreviewMutation.isPending,
    isRollingBack: rollbackMutation.isPending,
    isDeleting: deleteMutation.isPending,
    unassignWorkoutPlan: React.useCallback(
      async (planId, clientId) =>
        deleteMutation.mutateAsync({
          url: `/coach/workout-plans/${planId}/assign/${clientId}`,
        }),
      [deleteMutation],
    ),
  };
};
