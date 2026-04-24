import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/api/use-api";

export const USER_AI_REPORT_PERIODS = [
  { period: "weekly", label: "Haftalik", shortLabel: "7 kun", days: 7 },
  { period: "monthly", label: "Oylik", shortLabel: "30 kun", days: 30 },
  { period: "three_months", label: "3 oylik", shortLabel: "90 kun", days: 90 },
  { period: "six_months", label: "6 oylik", shortLabel: "180 kun", days: 180 },
  { period: "yearly", label: "1 yillik", shortLabel: "365 kun", days: 365 },
];

export const USER_AI_REPORT_QUERY_KEY = ["user", "ai-reports"];

const unwrapResponse = (response) => response?.data?.data ?? response?.data ?? null;

export const getUserAiReportPeriodLabel = (period) =>
  USER_AI_REPORT_PERIODS.find((item) => item.period === period)?.label ?? period;

export const useUserAiReportLimits = () =>
  useQuery({
    queryKey: [...USER_AI_REPORT_QUERY_KEY, "limits"],
    queryFn: async () => unwrapResponse(await api.get("/user/reports/limits")),
  });

export const useUserAiReports = (params = {}) =>
  useQuery({
    queryKey: [...USER_AI_REPORT_QUERY_KEY, "history", params],
    queryFn: async () =>
      unwrapResponse(
        await api.get("/user/reports", {
          params,
        }),
      ),
  });

export const useUserAiReport = (id, options = {}) =>
  useQuery({
    queryKey: [...USER_AI_REPORT_QUERY_KEY, "detail", id],
    queryFn: async () => unwrapResponse(await api.get(`/user/reports/${id}`)),
    enabled: Boolean(id && (options.enabled ?? true)),
  });

export const useGenerateUserAiReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (period) =>
      unwrapResponse(
        await api.post("/user/reports", {
          period,
        }),
      ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [...USER_AI_REPORT_QUERY_KEY, "history"],
        }),
        queryClient.invalidateQueries({
          queryKey: [...USER_AI_REPORT_QUERY_KEY, "limits"],
        }),
      ]);
    },
  });
};
