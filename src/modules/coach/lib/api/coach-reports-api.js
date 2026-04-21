import { createCoachResourceApi } from "./create-coach-resource-api";
import { api } from "@/hooks/api/use-api";

const coachReportsApi = createCoachResourceApi({
  resource: "reports",
  queryKeyBase: ["coach", "reports"],
});

export const LIST_QUERY_KEY = coachReportsApi.LIST_QUERY_KEY;
export const DETAIL_QUERY_KEY = coachReportsApi.DETAIL_QUERY_KEY;
export const HISTORY_QUERY_KEY = ["coach", "reports", "history"];
export const getList = coachReportsApi.getList;
export const getById = coachReportsApi.getById;
export const create = coachReportsApi.create;
export const update = coachReportsApi.update;
export const remove = coachReportsApi.remove;
export const updateStatus = coachReportsApi.updateStatus;
export const restore = coachReportsApi.restore;
export const bulkStatus = coachReportsApi.bulkStatus;
export const bulkTrash = coachReportsApi.bulkTrash;
export const bulkRestore = coachReportsApi.bulkRestore;
export const bulkHardDelete = coachReportsApi.bulkHardDelete;
export const reorder = coachReportsApi.reorder;
export const exportData = coachReportsApi.exportData;
export const importData = coachReportsApi.importData;
export const getHistory = (params = {}, config = {}) =>
  api.get("/coach/reports/history", { params, ...config });
export const generateReport = (params = {}, config = {}) =>
  api.get("/coach/reports", {
    params,
    responseType: "blob",
    ...config,
  });

export default coachReportsApi;
