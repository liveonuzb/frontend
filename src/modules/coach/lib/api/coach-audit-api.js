import { api } from "@/hooks/api/use-api";

export const AUDIT_LOGS_QUERY_KEY = ["coach", "audit-logs"];

export const getAuditLogs = (params = {}, config = {}) =>
  api.get("/coach/audit-logs", { params, ...config });
