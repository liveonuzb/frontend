import { get } from "lodash";
import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetQuery } from "@/hooks/api";
import { api } from "@/hooks/api/use-api";

export const USER_COACH_PAYMENTS_QUERY_KEY = ["me", "coach-payments"];

const DEFAULT_SUMMARY = {
  totalAssignments: 0,
  activeAssignments: 0,
  due: 0,
  overdue: 0,
  paid: 0,
  upcoming: 0,
  unset: 0,
  totalPaidAmount: 0,
  totalCompletedPayments: 0,
  totalPaymentsCount: 0,
  totalCancelledPayments: 0,
  coachPaymentsCount: 0,
  subscriptionPaymentsCount: 0,
  coachPaidAmount: 0,
  subscriptionPaidAmount: 0,
};

export const useUserCoachPayments = (options = {}) => {
  const enabled = options.enabled ?? true;
  const queryClient = useQueryClient();
  const { data, ...query } = useGetQuery({
    url: "/user/me/coach-payments",
    queryProps: {
      queryKey: USER_COACH_PAYMENTS_QUERY_KEY,
      enabled,
    },
  });

  const uploadCoachPaymentReceipt = React.useCallback(
    async (paymentId, file) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await api.post(
        `/user/me/coach-payments/${paymentId}/receipt`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      await queryClient.invalidateQueries({ queryKey: USER_COACH_PAYMENTS_QUERY_KEY });
      return response.data?.data ?? response.data;
    },
    [queryClient],
  );

  return {
    ...query,
    items: get(data, "data.items", []),
    payments: get(data, "data.payments", []),
    summary: {
      ...DEFAULT_SUMMARY,
      ...(get(data, "data.summary", {}) || {}),
    },
    uploadCoachPaymentReceipt,
  };
};

export default useUserCoachPayments;
