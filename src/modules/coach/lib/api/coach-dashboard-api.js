import { createCoachResourceApi } from "./create-coach-resource-api";

const coachDashboardApi = createCoachResourceApi({
  resource: "dashboard",
  queryKeyBase: ["coach", "dashboard"],
});

export const LIST_QUERY_KEY = coachDashboardApi.LIST_QUERY_KEY;
export const DETAIL_QUERY_KEY = coachDashboardApi.DETAIL_QUERY_KEY;
export const getList = coachDashboardApi.getList;
export const getById = coachDashboardApi.getById;
export const create = coachDashboardApi.create;
export const update = coachDashboardApi.update;
export const remove = coachDashboardApi.remove;
export const updateStatus = coachDashboardApi.updateStatus;
export const restore = coachDashboardApi.restore;
export const bulkStatus = coachDashboardApi.bulkStatus;
export const bulkTrash = coachDashboardApi.bulkTrash;
export const bulkRestore = coachDashboardApi.bulkRestore;
export const bulkHardDelete = coachDashboardApi.bulkHardDelete;
export const reorder = coachDashboardApi.reorder;
export const exportData = coachDashboardApi.exportData;
export const importData = coachDashboardApi.importData;

export default coachDashboardApi;
