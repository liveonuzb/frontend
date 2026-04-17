import React from "react";
import { get } from "lodash";
import { useQueryClient } from "@tanstack/react-query";
import {
  useDeleteQuery,
  useGetQuery,
  usePatchQuery,
  usePostQuery,
} from "@/hooks/api";
import {
  COACH_GROUPS_QUERY_KEY,
  COACH_CLIENTS_QUERY_KEY,
  COACH_MEAL_PLANS_QUERY_KEY,
  COACH_WORKOUT_PLANS_QUERY_KEY,
} from "./use-coach-query-keys";

export const useCoachGroups = () => {
  const queryClient = useQueryClient();
  const { data, ...query } = useGetQuery({
    url: "/coach/telegram-groups",
    queryProps: {
      queryKey: COACH_GROUPS_QUERY_KEY,
    },
  });

  const mutationProps = {
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: COACH_GROUPS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: COACH_CLIENTS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: COACH_MEAL_PLANS_QUERY_KEY }),
        queryClient.invalidateQueries({
          queryKey: COACH_WORKOUT_PLANS_QUERY_KEY,
        }),
      ]);
    },
  };

  const createMutation = usePostQuery({
    queryKey: COACH_GROUPS_QUERY_KEY,
    mutationProps,
  });
  const updateMutation = usePatchQuery({
    queryKey: COACH_GROUPS_QUERY_KEY,
    mutationProps,
  });
  const deleteMutation = useDeleteQuery({
    queryKey: COACH_GROUPS_QUERY_KEY,
    mutationProps,
  });
  const addClientsMutation = usePostQuery({
    queryKey: COACH_GROUPS_QUERY_KEY,
    mutationProps,
  });
  const assignMealPlanMutation = usePostQuery({
    queryKey: COACH_GROUPS_QUERY_KEY,
    mutationProps,
  });
  const assignWorkoutPlanMutation = usePostQuery({
    queryKey: COACH_GROUPS_QUERY_KEY,
    mutationProps,
  });

  const addGroup = React.useCallback(
    async (payload) =>
      createMutation.mutateAsync({
        url: "/coach/telegram-groups",
        attributes: payload,
      }),
    [createMutation],
  );

  const updateGroup = React.useCallback(
    async (groupId, payload) =>
      updateMutation.mutateAsync({
        url: `/coach/telegram-groups/${groupId}`,
        attributes: payload,
      }),
    [updateMutation],
  );

  const removeGroup = React.useCallback(
    async (groupId) =>
      deleteMutation.mutateAsync({
        url: `/coach/telegram-groups/${groupId}`,
      }),
    [deleteMutation],
  );

  const addClientsToGroup = React.useCallback(
    async (groupId, clientIds) =>
      addClientsMutation.mutateAsync({
        url: `/coach/telegram-groups/${groupId}/clients`,
        attributes: { clientIds },
      }),
    [addClientsMutation],
  );

  const createGroupWithClients = React.useCallback(
    async (name, description, clientIds) =>
      createMutation.mutateAsync({
        url: "/coach/telegram-groups",
        attributes: { name, description, clientIds },
      }),
    [createMutation],
  );

  const assignMealPlanToGroup = React.useCallback(
    async (groupId, planId) =>
      assignMealPlanMutation.mutateAsync({
        url: `/coach/telegram-groups/${groupId}/assign-meal-plan`,
        attributes: { planId },
      }),
    [assignMealPlanMutation],
  );

  const assignWorkoutPlanToGroup = React.useCallback(
    async (groupId, planId) =>
      assignWorkoutPlanMutation.mutateAsync({
        url: `/coach/telegram-groups/${groupId}/assign-workout-plan`,
        attributes: { planId },
      }),
    [assignWorkoutPlanMutation],
  );

  return {
    ...query,
    groups: get(data, "data.items", get(data, "data.data.items", [])),
    addGroup,
    updateGroup,
    removeGroup,
    addClientsToGroup,
    createGroupWithClients,
    assignMealPlanToGroup,
    assignWorkoutPlanToGroup,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isAddingClients: addClientsMutation.isPending,
    isAssigningMealPlan: assignMealPlanMutation.isPending,
    isAssigningWorkoutPlan: assignWorkoutPlanMutation.isPending,
  };
};
