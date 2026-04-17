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
  COACH_CLIENT_DETAIL_QUERY_KEY,
  COACH_CLIENTS_QUERY_KEY,
  COACH_DASHBOARD_QUERY_KEY,
  COACH_MEAL_PLANS_QUERY_KEY,
  COACH_PROGRAMS_QUERY_KEY,
  COACH_WORKOUT_PLANS_QUERY_KEY,
} from "./use-coach-query-keys";

export const useCoachPrograms = () => {
  const queryClient = useQueryClient();
  const { data, ...query } = useGetQuery({
    url: "/coach/programs",
    queryProps: {
      queryKey: COACH_PROGRAMS_QUERY_KEY,
    },
  });

  const invalidateProgramScope = React.useCallback(
    async () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: COACH_PROGRAMS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: COACH_DASHBOARD_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: COACH_CLIENTS_QUERY_KEY }),
        queryClient.invalidateQueries({
          queryKey: COACH_CLIENT_DETAIL_QUERY_KEY,
        }),
        queryClient.invalidateQueries({ queryKey: COACH_MEAL_PLANS_QUERY_KEY }),
        queryClient.invalidateQueries({
          queryKey: COACH_WORKOUT_PLANS_QUERY_KEY,
        }),
      ]),
    [queryClient],
  );

  const createMutation = usePostQuery({
    queryKey: COACH_PROGRAMS_QUERY_KEY,
    mutationProps: { onSuccess: invalidateProgramScope },
  });
  const updateMutation = usePatchQuery({
    queryKey: COACH_PROGRAMS_QUERY_KEY,
    mutationProps: { onSuccess: invalidateProgramScope },
  });
  const duplicateMutation = usePostQuery({
    queryKey: COACH_PROGRAMS_QUERY_KEY,
    mutationProps: { onSuccess: invalidateProgramScope },
  });
  const assignMutation = usePostQuery({
    queryKey: COACH_PROGRAMS_QUERY_KEY,
    mutationProps: { onSuccess: invalidateProgramScope },
  });
  const progressMutation = usePatchQuery({
    queryKey: COACH_PROGRAMS_QUERY_KEY,
    mutationProps: { onSuccess: invalidateProgramScope },
  });
  const archiveMutation = useDeleteQuery({
    queryKey: COACH_PROGRAMS_QUERY_KEY,
    mutationProps: { onSuccess: invalidateProgramScope },
  });

  const createProgram = React.useCallback(
    async (payload) =>
      createMutation.mutateAsync({
        url: "/coach/programs",
        attributes: payload,
      }),
    [createMutation],
  );

  const updateProgram = React.useCallback(
    async (programId, payload) =>
      updateMutation.mutateAsync({
        url: `/coach/programs/${programId}`,
        attributes: payload,
      }),
    [updateMutation],
  );

  const duplicateProgram = React.useCallback(
    async (programId) =>
      duplicateMutation.mutateAsync({
        url: `/coach/programs/${programId}/duplicate`,
        attributes: {},
      }),
    [duplicateMutation],
  );

  const assignProgram = React.useCallback(
    async (programId, payload) =>
      assignMutation.mutateAsync({
        url: `/coach/programs/${programId}/assign`,
        attributes: payload,
      }),
    [assignMutation],
  );

  const updateProgramProgress = React.useCallback(
    async (programId, assignmentId, payload) =>
      progressMutation.mutateAsync({
        url: `/coach/programs/${programId}/assignments/${assignmentId}/progress`,
        attributes: payload,
      }),
    [progressMutation],
  );

  const archiveProgram = React.useCallback(
    async (programId) =>
      archiveMutation.mutateAsync({
        url: `/coach/programs/${programId}`,
      }),
    [archiveMutation],
  );

  return {
    ...query,
    programs: get(data, "data.items", get(data, "data.data.items", [])),
    createProgram,
    updateProgram,
    duplicateProgram,
    assignProgram,
    updateProgramProgress,
    archiveProgram,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDuplicating: duplicateMutation.isPending,
    isAssigning: assignMutation.isPending,
    isUpdatingProgress: progressMutation.isPending,
    isArchiving: archiveMutation.isPending,
  };
};
