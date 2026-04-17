import React from "react";
import { get } from "lodash";
import { useQueryClient } from "@tanstack/react-query";
import { useDeleteQuery, useGetQuery, usePostQuery } from "@/hooks/api";
import { COACH_CLIENTS_QUERY_KEY, COACH_DASHBOARD_QUERY_KEY } from "@/hooks/app/use-coach.js";
import { MEAL_PLAN_QUERY_KEY } from "@/hooks/app/use-meal-plan.js";

export const COACH_INVITATIONS_QUERY_KEY = ["me", "coach-invitations"];
export const ME_QUERY_KEY = ["me"];
const EMPTY_INVITATIONS = [];

export const useCoachInvitations = (options = {}) => {
  const enabled = options.enabled ?? true;
  const queryClient = useQueryClient();
  const { data, ...query } = useGetQuery({
    url: "/users/me/coach-invitations",
    queryProps: {
      queryKey: COACH_INVITATIONS_QUERY_KEY,
      enabled,
    },
  });

  const mutationProps = {
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: COACH_INVITATIONS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: COACH_CLIENTS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: COACH_DASHBOARD_QUERY_KEY }),
      ]);
    },
  };

  const acceptMutation = usePostQuery({
    queryKey: COACH_INVITATIONS_QUERY_KEY,
    mutationProps,
  });
  const declineMutation = usePostQuery({
    queryKey: COACH_INVITATIONS_QUERY_KEY,
    mutationProps,
  });
  const disconnectMutation = useDeleteQuery({
    queryKey: COACH_INVITATIONS_QUERY_KEY,
    mutationProps: {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY }),
          queryClient.invalidateQueries({ queryKey: COACH_INVITATIONS_QUERY_KEY }),
          queryClient.invalidateQueries({ queryKey: COACH_CLIENTS_QUERY_KEY }),
          queryClient.invalidateQueries({ queryKey: COACH_DASHBOARD_QUERY_KEY }),
          queryClient.invalidateQueries({ queryKey: ["user", "weekly-check-ins"] }),
          queryClient.invalidateQueries({ queryKey: MEAL_PLAN_QUERY_KEY }),
        ]);
      },
    },
  });

  const acceptInvitation = React.useCallback(
    async (invitationId) =>
      acceptMutation.mutateAsync({
        url: `/users/me/coach-invitations/${invitationId}/accept`,
        attributes: {},
      }),
    [acceptMutation],
  );

  const declineInvitation = React.useCallback(
    async (invitationId, payload = {}) =>
      declineMutation.mutateAsync({
        url: `/users/me/coach-invitations/${invitationId}/decline`,
        attributes: payload,
      }),
    [declineMutation],
  );

  const disconnectCoach = React.useCallback(
    async () =>
      disconnectMutation.mutateAsync({
        url: "/users/me/coach-connection",
      }),
    [disconnectMutation],
  );

  return {
    ...query,
    invitations: get(data, "data.data.items", EMPTY_INVITATIONS),
    acceptInvitation,
    declineInvitation,
    disconnectCoach,
    isAccepting: acceptMutation.isPending,
    isDeclining: declineMutation.isPending,
    isDisconnecting: disconnectMutation.isPending,
  };
};
