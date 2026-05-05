import React from "react";
import { useQueryClient } from "@tanstack/react-query";

import {
  useDeleteQuery,
  usePatchQuery,
  usePostQuery,
} from "@/hooks/api";

export const WORKOUT_PLAN_TEMPLATES_QUERY_KEY = [
  "admin",
  "workout-plan-templates",
];

export function useWorkoutPlanTemplateMutations() {
  const queryClient = useQueryClient();

  const mutationProps = React.useMemo(
    () => ({
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: WORKOUT_PLAN_TEMPLATES_QUERY_KEY,
          }),
          queryClient.invalidateQueries({ queryKey: ["workout-plan"] }),
        ]);
      },
    }),
    [queryClient],
  );

  const createMutation = usePostQuery({
    queryKey: WORKOUT_PLAN_TEMPLATES_QUERY_KEY,
    mutationProps,
  });
  const updateMutation = usePatchQuery({
    queryKey: WORKOUT_PLAN_TEMPLATES_QUERY_KEY,
    mutationProps,
  });
  const deleteMutation = useDeleteQuery({
    queryKey: WORKOUT_PLAN_TEMPLATES_QUERY_KEY,
    mutationProps,
  });

  const createTemplate = React.useCallback(
    async (payload) =>
      createMutation.mutateAsync({
        url: "/admin/workout-plans",
        attributes: payload,
      }),
    [createMutation],
  );

  const updateTemplate = React.useCallback(
    async (id, payload) =>
      updateMutation.mutateAsync({
        url: `/admin/workout-plans/${id}`,
        attributes: payload,
      }),
    [updateMutation],
  );

  const deleteTemplate = React.useCallback(
    async (id) =>
      deleteMutation.mutateAsync({
        url: `/admin/workout-plans/${id}`,
      }),
    [deleteMutation],
  );

  return {
    createTemplate,
    deleteTemplate,
    isDeleting: deleteMutation.isPending,
    isSaving: createMutation.isPending || updateMutation.isPending,
    updateTemplate,
  };
}
