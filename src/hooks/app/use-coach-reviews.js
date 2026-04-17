import React from "react";
import { get } from "lodash";
import { useQueryClient } from "@tanstack/react-query";
import { useGetQuery, usePostQuery } from "@/hooks/api";
import { COACHES_QUERY_KEY } from "@/hooks/app/use-coaches";

export const USER_COACH_REVIEW_QUERY_KEY = ["user", "coach-review"];

export const useCoachReview = (coachId, options = {}) => {
  const enabled = options.enabled ?? true;
  const { data, ...query } = useGetQuery({
    url: `/user/coaches/${coachId}/review`,
    queryProps: {
      queryKey: [...USER_COACH_REVIEW_QUERY_KEY, coachId],
      enabled: enabled && Boolean(coachId),
    },
  });

  return {
    ...query,
    canReview: Boolean(get(data, "data.data.canReview", false)),
    review: get(data, "data.data.review", null),
  };
};

export const useUpsertCoachReview = (coachId) => {
  const queryClient = useQueryClient();
  const mutation = usePostQuery({
    queryKey: [...USER_COACH_REVIEW_QUERY_KEY, coachId],
    mutationProps: {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: [...USER_COACH_REVIEW_QUERY_KEY, coachId],
          }),
          queryClient.invalidateQueries({
            queryKey: ["user", "coach-directory", "detail", coachId],
          }),
          queryClient.invalidateQueries({
            queryKey: ["public", "coach", coachId],
          }),
          queryClient.invalidateQueries({
            queryKey: COACHES_QUERY_KEY,
            exact: false,
          }),
          queryClient.invalidateQueries({
            queryKey: ["public", "coaches"],
          }),
        ]);
      },
    },
  });

  const upsertReview = React.useCallback(
    async (payload) =>
      mutation.mutateAsync({
        url: `/user/coaches/${coachId}/review`,
        attributes: payload,
      }),
    [coachId, mutation],
  );

  return {
    upsertReview,
    isSubmittingReview: mutation.isPending,
  };
};

