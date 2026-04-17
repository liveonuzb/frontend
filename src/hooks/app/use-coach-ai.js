import { useGetQuery, usePostQuery } from "../api";

export function useClientAiSummary(clientId, options = {}) {
  return useGetQuery({
    url: `/coach/clients/${clientId}/ai-summary`,
    queryProps: { enabled: !!clientId, staleTime: 5 * 60 * 1000, ...options },
  });
}

export function useClientNextActions(clientId, options = {}) {
  return useGetQuery({
    url: `/coach/clients/${clientId}/ai-next-actions`,
    queryProps: { enabled: !!clientId, staleTime: 5 * 60 * 1000, ...options },
  });
}

export function useGeneratePlanDraft() {
  return usePostQuery({ url: "/coach/ai/plan-draft" });
}
