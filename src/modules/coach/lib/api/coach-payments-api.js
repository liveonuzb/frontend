import { createCoachResourceApi } from "./create-coach-resource-api";

const coachPaymentsApi = createCoachResourceApi({
  resource: "payments",
  queryKeyBase: ["coach", "payments"],
});

export const LIST_QUERY_KEY = coachPaymentsApi.LIST_QUERY_KEY;
export const DETAIL_QUERY_KEY = coachPaymentsApi.DETAIL_QUERY_KEY;
export const getList = coachPaymentsApi.getList;
export const getById = coachPaymentsApi.getById;
export const create = coachPaymentsApi.create;
export const update = coachPaymentsApi.update;
export const remove = coachPaymentsApi.remove;
export const updateStatus = coachPaymentsApi.updateStatus;
export const restore = coachPaymentsApi.restore;
export const bulkStatus = coachPaymentsApi.bulkStatus;
export const bulkTrash = coachPaymentsApi.bulkTrash;
export const bulkRestore = coachPaymentsApi.bulkRestore;
export const bulkHardDelete = coachPaymentsApi.bulkHardDelete;
export const reorder = coachPaymentsApi.reorder;
export const exportData = coachPaymentsApi.exportData;
export const importData = coachPaymentsApi.importData;

export default coachPaymentsApi;
