import {
  DETAIL_QUERY_KEY,
  LIST_QUERY_KEY,
} from "../api/coach-course-purchases-api";
import { useGetQuery, usePatchQuery } from "@/hooks/api";

export const useCoachCoursePurchases = (params = {}, queryProps = {}) =>
  useGetQuery({
    url: "/coach/course-purchases",
    params,
    queryProps: {
      queryKey: [...LIST_QUERY_KEY, params],
      ...queryProps,
    },
  });

export const useCoachCoursePurchase = (id, params = {}, queryProps = {}) =>
  useGetQuery({
    url: `/coach/course-purchases/${id}`,
    params,
    queryProps: {
      queryKey: [...DETAIL_QUERY_KEY, id, params],
      enabled: Boolean(id) && (queryProps.enabled ?? true),
      ...queryProps,
    },
  });

export const useCoachCoursePurchasesMutations = (options = {}) => {
  const approveMutation = usePatchQuery({
    queryKey: LIST_QUERY_KEY,
    mutationProps: options.approveMutationProps,
  });
  const rejectMutation = usePatchQuery({
    queryKey: LIST_QUERY_KEY,
    mutationProps: options.rejectMutationProps,
  });
  const revokeMutation = usePatchQuery({
    queryKey: LIST_QUERY_KEY,
    mutationProps: options.revokeMutationProps,
  });
  const extendMutation = usePatchQuery({
    queryKey: LIST_QUERY_KEY,
    mutationProps: options.extendMutationProps,
  });
  const resendInviteMutation = usePatchQuery({
    queryKey: LIST_QUERY_KEY,
    mutationProps: options.resendInviteMutationProps,
  });
  const bulkApproveMutation = usePatchQuery({
    queryKey: LIST_QUERY_KEY,
    mutationProps: options.bulkApproveMutationProps,
  });
  const bulkRejectMutation = usePatchQuery({
    queryKey: LIST_QUERY_KEY,
    mutationProps: options.bulkRejectMutationProps,
  });

  return {
    approveMutation,
    rejectMutation,
    revokeMutation,
    extendMutation,
    resendInviteMutation,
    bulkApproveMutation,
    bulkRejectMutation,
    approvePurchase: (id, attributes = {}, config = {}) =>
      approveMutation.mutateAsync({
        url: `/coach/course-purchases/${id}/approve`,
        attributes,
        config,
      }),
    rejectPurchase: (id, attributes = {}, config = {}) =>
      rejectMutation.mutateAsync({
        url: `/coach/course-purchases/${id}/reject`,
        attributes,
        config,
      }),
    revokePurchase: (id, attributes = {}, config = {}) =>
      revokeMutation.mutateAsync({
        url: `/coach/course-purchases/${id}/revoke`,
        attributes,
        config,
      }),
    extendPurchase: (id, attributes = {}, config = {}) =>
      extendMutation.mutateAsync({
        url: `/coach/course-purchases/${id}/extend`,
        attributes,
        config,
      }),
    resendPurchaseInvite: (id, config = {}) =>
      resendInviteMutation.mutateAsync({
        url: `/coach/course-purchases/${id}/resend-invite`,
        attributes: {},
        config,
      }),
    bulkApprovePurchases: (attributes = {}, config = {}) =>
      bulkApproveMutation.mutateAsync({
        url: "/coach/course-purchases/bulk-approve",
        attributes,
        config,
      }),
    bulkRejectPurchases: (attributes = {}, config = {}) =>
      bulkRejectMutation.mutateAsync({
        url: "/coach/course-purchases/bulk-reject",
        attributes,
        config,
      }),
  };
};
