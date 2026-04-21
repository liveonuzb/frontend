import React from "react";
import { get } from "lodash";
import { useQueryClient } from "@tanstack/react-query";
import coachReportsApi, {
  DETAIL_QUERY_KEY,
  HISTORY_QUERY_KEY,
  LIST_QUERY_KEY,
} from "../api/coach-reports-api";
import { createCoachResourceHooks } from "./create-coach-resource-hooks";
import { api } from "@/hooks/api/use-api";
import { useGetQuery } from "@/hooks/api";

const coachReportsHooks = createCoachResourceHooks({
  baseUrl: coachReportsApi.baseUrl,
  listQueryKey: LIST_QUERY_KEY,
  detailQueryKey: DETAIL_QUERY_KEY,
});

export const useCoachReports = (params = {}, queryProps = {}) =>
  useGetQuery({
    url: "/coach/reports/history",
    params,
    queryProps: {
      queryKey: [...HISTORY_QUERY_KEY, params],
      ...queryProps,
    },
  });
export const useCoachReport = coachReportsHooks.useDetail;
export const useCoachReportsMutations = coachReportsHooks.useMutations;

const inferFilename = (response, fallback = "coach-report") => {
  const disposition = response.headers?.["content-disposition"] || "";
  const match = disposition.match(/filename="?([^"]+)"?/i);
  return match?.[1] || fallback;
};

export const useCoachReportGenerator = () => {
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = React.useState(false);

  const generateReport = React.useCallback(
    async (params = {}) => {
      setIsGenerating(true);
      try {
        const response = await api.get("/coach/reports", {
          params,
          responseType: "blob",
        });
        const blob = get(response, "data");
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = inferFilename(response, `${params.type || "report"}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        await queryClient.invalidateQueries({ queryKey: HISTORY_QUERY_KEY });
        return response;
      } finally {
        setIsGenerating(false);
      }
    },
    [queryClient],
  );

  return { generateReport, isGenerating };
};

export default coachReportsHooks;
