import React from "react";
import { get } from "lodash";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetQuery,
  usePostQuery,
} from "@/hooks/api";
import {
  COACH_DASHBOARD_QUERY_KEY,
  COACH_CLIENTS_QUERY_KEY,
} from "./use-coach-query-keys";

export const useCoachDashboard = () => {
  const queryClient = useQueryClient();
  const { data, ...query } = useGetQuery({
    url: "/coach/dashboard",
    queryProps: {
      queryKey: COACH_DASHBOARD_QUERY_KEY,
      refetchInterval: 15000,
      refetchOnWindowFocus: true,
    },
  });

  const respondMutation = usePostQuery({
    queryKey: COACH_DASHBOARD_QUERY_KEY,
    mutationProps: {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: COACH_DASHBOARD_QUERY_KEY,
          }),
          queryClient.invalidateQueries({ queryKey: COACH_CLIENTS_QUERY_KEY }),
        ]);
      },
    },
  });

  const respondToInvitation = React.useCallback(
    async (invitationId, action, reason) =>
      respondMutation.mutateAsync({
        url: `/coach/clients/invitations/${invitationId}/respond`,
        attributes: { action, reason },
      }),
    [respondMutation],
  );

  return {
    ...query,
    dashboard: get(data, "data", {
      metrics: {},
      recentClients: [],
      pendingInvitations: [],
      templates: [],
      alerts: [],
    }),
    respondToInvitation,
    isResponding: respondMutation.isPending,
  };
};
