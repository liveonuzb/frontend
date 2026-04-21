import { useGetQuery } from "@/hooks/api";
import { AUDIT_LOGS_QUERY_KEY } from "../api/coach-audit-api";

export const useCoachAuditLogs = (params = {}, queryProps = {}) =>
  useGetQuery({
    url: "/coach/audit-logs",
    params,
    queryProps: {
      queryKey: [...AUDIT_LOGS_QUERY_KEY, params],
      ...queryProps,
    },
  });
