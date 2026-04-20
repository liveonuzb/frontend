import { createCoachResourceApi } from "./create-coach-resource-api";

const coachNotificationsApi = createCoachResourceApi({
  resource: "notifications",
  queryKeyBase: ["coach", "notifications"],
});

export const LIST_QUERY_KEY = coachNotificationsApi.LIST_QUERY_KEY;
export const DETAIL_QUERY_KEY = coachNotificationsApi.DETAIL_QUERY_KEY;
export const getList = coachNotificationsApi.getList;
export const getById = coachNotificationsApi.getById;
export const create = coachNotificationsApi.create;
export const update = coachNotificationsApi.update;
export const remove = coachNotificationsApi.remove;
export const updateStatus = coachNotificationsApi.updateStatus;
export const restore = coachNotificationsApi.restore;
export const bulkStatus = coachNotificationsApi.bulkStatus;
export const bulkTrash = coachNotificationsApi.bulkTrash;
export const bulkRestore = coachNotificationsApi.bulkRestore;
export const bulkHardDelete = coachNotificationsApi.bulkHardDelete;
export const reorder = coachNotificationsApi.reorder;
export const exportData = coachNotificationsApi.exportData;
export const importData = coachNotificationsApi.importData;

export default coachNotificationsApi;
