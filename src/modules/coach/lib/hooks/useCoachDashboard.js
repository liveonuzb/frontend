import React from "react";
import { defaultsDeep, get } from "lodash";
import { useQueryClient } from "@tanstack/react-query";
import coachDashboardApi, {
  DETAIL_QUERY_KEY,
  LIST_QUERY_KEY,
} from "../api/coach-dashboard-api";
import { LIST_QUERY_KEY as CLIENTS_QUERY_KEY } from "../api/coach-clients-api";
import { createCoachResourceHooks } from "./create-coach-resource-hooks";
import { usePostQuery } from "@/hooks/api";

const coachDashboardHooks = createCoachResourceHooks({
  baseUrl: coachDashboardApi.baseUrl,
  listQueryKey: LIST_QUERY_KEY,
  detailQueryKey: DETAIL_QUERY_KEY,
});

const DEFAULT_DASHBOARD = {
  metrics: {},
  recentClients: [],
  overdueClients: [],
  pendingInvitations: [],
  recentCheckIns: [],
  templates: [],
  alerts: [],
  paymentChart: {
    week: [],
    month: [],
    year: [],
  },
};

export const useCoachDashboard = (params = {}, queryProps = {}) => {
  const queryClient = useQueryClient();
  const { data, ...query } = coachDashboardHooks.useList(params, {
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
    ...queryProps,
  });

  const respondMutation = usePostQuery({
    queryKey: LIST_QUERY_KEY,
    mutationProps: {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: LIST_QUERY_KEY }),
          queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY }),
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
    dashboard: defaultsDeep({}, get(data, "data", {}), DEFAULT_DASHBOARD),
    respondToInvitation,
    isResponding: respondMutation.isPending,
  };
};
export const useCoachDashboardItem = coachDashboardHooks.useDetail;
export const useCoachDashboardMutations = coachDashboardHooks.useMutations;

export default coachDashboardHooks;
