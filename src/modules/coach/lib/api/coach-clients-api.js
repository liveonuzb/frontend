import { createCoachResourceApi } from "./create-coach-resource-api";

const coachClientsApi = createCoachResourceApi({
  resource: "clients",
  queryKeyBase: ["coach", "clients"],
});

export const LIST_QUERY_KEY = coachClientsApi.LIST_QUERY_KEY;
export const DETAIL_QUERY_KEY = coachClientsApi.DETAIL_QUERY_KEY;
export const getList = coachClientsApi.getList;
export const getById = coachClientsApi.getById;
export const create = coachClientsApi.create;
export const update = coachClientsApi.update;
export const remove = coachClientsApi.remove;
export const updateStatus = coachClientsApi.updateStatus;
export const restore = coachClientsApi.restore;
export const bulkStatus = coachClientsApi.bulkStatus;
export const bulkTrash = coachClientsApi.bulkTrash;
export const bulkRestore = coachClientsApi.bulkRestore;
export const bulkHardDelete = coachClientsApi.bulkHardDelete;
export const reorder = coachClientsApi.reorder;
export const exportData = coachClientsApi.exportData;
export const importData = coachClientsApi.importData;

export default coachClientsApi;
