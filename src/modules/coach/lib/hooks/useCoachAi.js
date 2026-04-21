import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import coachAiApi, {
  DETAIL_QUERY_KEY,
  INVOCATIONS_QUERY_KEY,
  LIST_QUERY_KEY,
} from "../api/coach-ai-api";
import { createCoachResourceHooks } from "./create-coach-resource-hooks";
import { useGetQuery, usePostQuery } from "@/hooks/api";

const coachAiHooks = createCoachResourceHooks({
  baseUrl: coachAiApi.baseUrl,
  listQueryKey: LIST_QUERY_KEY,
  detailQueryKey: DETAIL_QUERY_KEY,
});

export const useCoachAi = (params = {}, queryProps = {}) =>
  useGetQuery({
    url: "/coach/ai/invocations",
    params,
    queryProps: {
      queryKey: [...INVOCATIONS_QUERY_KEY, params],
      ...queryProps,
    },
  });
export const useCoachAiInvocation = coachAiHooks.useDetail;
export const useCoachAiMutations = coachAiHooks.useMutations;

export const useCoachPlanDraftGenerator = () => {
  const queryClient = useQueryClient();
  const mutation = usePostQuery({
    queryKey: INVOCATIONS_QUERY_KEY,
    mutationProps: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: INVOCATIONS_QUERY_KEY });
      },
    },
  });

  const generatePlanDraft = React.useCallback(
    (attributes = {}) =>
      mutation.mutateAsync({
        url: "/coach/ai/plan-draft",
        attributes,
      }),
    [mutation],
  );

  return {
    generatePlanDraft,
    isGenerating: mutation.isPending,
  };
};

export default coachAiHooks;
