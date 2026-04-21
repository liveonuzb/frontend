import coachReferralsApi, {
  DASHBOARD_QUERY_KEY,
  DETAIL_QUERY_KEY,
  LIST_QUERY_KEY,
} from "../api/coach-referrals-api";
import { createCoachResourceHooks } from "./create-coach-resource-hooks";
import { useGetQuery, usePatchQuery, usePostQuery } from "@/hooks/api";

const coachReferralsHooks = createCoachResourceHooks({
  baseUrl: coachReferralsApi.baseUrl,
  listQueryKey: LIST_QUERY_KEY,
  detailQueryKey: DETAIL_QUERY_KEY,
});

export const useCoachReferrals = coachReferralsHooks.useList;
export const useCoachReferral = coachReferralsHooks.useDetail;
export const useCoachReferralsMutations = (options = {}) => {
  const cancelMutation = usePatchQuery({
    queryKey: LIST_QUERY_KEY,
    listKey: DASHBOARD_QUERY_KEY,
    mutationProps: options.cancelMutationProps,
  });
  const resendMutation = usePostQuery({
    queryKey: LIST_QUERY_KEY,
    listKey: DASHBOARD_QUERY_KEY,
    mutationProps: options.resendMutationProps,
  });

  return {
    cancelMutation,
    resendMutation,
    cancelReferral: (id, config = {}) =>
      cancelMutation.mutateAsync({
        url: `/coach/referrals/${id}/cancel`,
        attributes: {},
        config,
      }),
    resendReferral: (id, config = {}) =>
      resendMutation.mutateAsync({
        url: `/coach/referrals/${id}/resend`,
        attributes: {},
        config,
      }),
    isMutating: cancelMutation.isPending || resendMutation.isPending,
  };
};
export const useCoachReferralDashboard = (queryProps = {}) =>
  useGetQuery({
    url: "/coach/referrals/dashboard",
    queryProps: {
      queryKey: DASHBOARD_QUERY_KEY,
      ...queryProps,
    },
  });

export default coachReferralsHooks;
