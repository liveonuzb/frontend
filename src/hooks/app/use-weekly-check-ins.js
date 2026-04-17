import React from "react";
import { get } from "lodash";
import { useGetQuery, usePostQuery } from "@/hooks/api";

export const USER_WEEKLY_CHECK_INS_QUERY_KEY = ["user", "weekly-check-ins"];

export const useWeeklyCheckIns = (options = {}) => {
  const enabled = options.enabled ?? true;
  const { data, ...query } = useGetQuery({
    url: "/users/me/check-ins",
    queryProps: {
      queryKey: USER_WEEKLY_CHECK_INS_QUERY_KEY,
      enabled,
    },
  });

  const submitMutation = usePostQuery({
    queryKey: USER_WEEKLY_CHECK_INS_QUERY_KEY,
  });

  const submitWeeklyCheckIn = React.useCallback(
    async (checkInId, payload) =>
      submitMutation.mutateAsync({
        url: `/users/me/check-ins/${checkInId}/submit`,
        attributes: payload,
      }),
    [submitMutation],
  );

  const items = get(data, "data.data.items", []);

  return {
    ...query,
    checkIns: items,
    pendingCheckIns: items.filter(
      (item) => item.status === "pending" || item.status === "overdue",
    ),
    completedCheckIns: items.filter((item) => item.status === "submitted"),
    submitWeeklyCheckIn,
    isSubmittingWeeklyCheckIn: submitMutation.isPending,
  };
};

export default useWeeklyCheckIns;
