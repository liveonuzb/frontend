import React from "react";
import { useGetQuery } from "@/hooks/api";
import { getApiResponseData } from "@/lib/api-response";
import { USER_AI_REPORT_QUERY_KEY } from "@/hooks/app/use-user-ai-reports";
import { dailyReportQueryKey } from "@/modules/user/containers/report/report-helpers.js";

import isArray from "lodash/isArray";

const RESTORE_QUOTE_QUERY_KEY = ["user", "gamification", "streak", "restore-quote"];

const getFirstReport = (payload) => {
  if (isArray(payload)) {
    return payload[0] ?? null;
  }

  if (isArray(payload?.items)) {
    return payload.items[0] ?? null;
  }

  return null;
};

export const DASHBOARD_AI_INSIGHTS_QUERY_KEYS = {
  limits: [...USER_AI_REPORT_QUERY_KEY, "limits"],
  latestReport: [...USER_AI_REPORT_QUERY_KEY, "history", { page: 1, pageSize: 1 }],
  dailyReport: dailyReportQueryKey,
  restoreQuote: RESTORE_QUOTE_QUERY_KEY,
};

export default function useDashboardAiInsights(dateKey) {
  const limitsQuery = useGetQuery({
    url: "/user/reports/limits",
    queryProps: {
      queryKey: DASHBOARD_AI_INSIGHTS_QUERY_KEYS.limits,
    },
  });
  const latestReportQuery = useGetQuery({
    url: "/user/reports",
    params: {
      page: 1,
      pageSize: 1,
    },
    queryProps: {
      queryKey: DASHBOARD_AI_INSIGHTS_QUERY_KEYS.latestReport,
    },
  });
  const dailyReportQuery = useGetQuery({
    url: `/user/tracking/reports/daily?date=${dateKey}`,
    queryProps: {
      queryKey: dailyReportQueryKey(dateKey),
      enabled: Boolean(dateKey),
    },
  });
  const restoreQuoteQuery = useGetQuery({
    url: "/user/gamification/streak/restore-quote",
    queryProps: {
      queryKey: RESTORE_QUOTE_QUERY_KEY,
    },
  });

  const limits = React.useMemo(
    () => getApiResponseData(limitsQuery.data, null),
    [limitsQuery.data],
  );
  const latestReport = React.useMemo(
    () => getFirstReport(getApiResponseData(latestReportQuery.data, null)),
    [latestReportQuery.data],
  );
  const dailyReport = React.useMemo(
    () => getApiResponseData(dailyReportQuery.data, null),
    [dailyReportQuery.data],
  );
  const streakQuote = React.useMemo(
    () => getApiResponseData(restoreQuoteQuery.data, null),
    [restoreQuoteQuery.data],
  );

  return {
    limits,
    latestReport,
    dailyReport,
    streakQuote,
    isLoading:
      limitsQuery.isLoading ||
      latestReportQuery.isLoading ||
      dailyReportQuery.isLoading,
    hasError:
      limitsQuery.isError ||
      latestReportQuery.isError ||
      dailyReportQuery.isError ||
      restoreQuoteQuery.isError,
    refetch: async () => {
      await Promise.all([
        limitsQuery.refetch?.(),
        latestReportQuery.refetch?.(),
        dailyReportQuery.refetch?.(),
        restoreQuoteQuery.refetch?.(),
      ]);
    },
  };
}
