import { createCoachResourceApi } from "./create-coach-resource-api";

const coachAiApi = createCoachResourceApi({
  resource: "ai",
  queryKeyBase: ["coach", "ai"],
});

export const LIST_QUERY_KEY = coachAiApi.LIST_QUERY_KEY;
export const DETAIL_QUERY_KEY = coachAiApi.DETAIL_QUERY_KEY;
export const getList = coachAiApi.getList;
export const getById = coachAiApi.getById;
export const create = coachAiApi.create;
export const update = coachAiApi.update;
export const remove = coachAiApi.remove;
export const updateStatus = coachAiApi.updateStatus;
export const restore = coachAiApi.restore;
export const bulkStatus = coachAiApi.bulkStatus;
export const bulkTrash = coachAiApi.bulkTrash;
export const bulkRestore = coachAiApi.bulkRestore;
export const bulkHardDelete = coachAiApi.bulkHardDelete;
export const reorder = coachAiApi.reorder;
export const exportData = coachAiApi.exportData;
export const importData = coachAiApi.importData;

export default coachAiApi;
