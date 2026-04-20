import { createCoachResourceApi } from "./create-coach-resource-api";

const coachReportsApi = createCoachResourceApi({
  resource: "reports",
  queryKeyBase: ["coach", "reports"],
});

export const LIST_QUERY_KEY = coachReportsApi.LIST_QUERY_KEY;
export const DETAIL_QUERY_KEY = coachReportsApi.DETAIL_QUERY_KEY;
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

export default coachReportsApi;
