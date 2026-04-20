import { createCoachResourceApi } from "./create-coach-resource-api";

const coachTelegramApi = createCoachResourceApi({
  resource: "telegram",
  queryKeyBase: ["coach", "telegram"],
});

export const LIST_QUERY_KEY = coachTelegramApi.LIST_QUERY_KEY;
export const DETAIL_QUERY_KEY = coachTelegramApi.DETAIL_QUERY_KEY;
export const getList = coachTelegramApi.getList;
export const getById = coachTelegramApi.getById;
export const create = coachTelegramApi.create;
export const update = coachTelegramApi.update;
export const remove = coachTelegramApi.remove;
export const updateStatus = coachTelegramApi.updateStatus;
export const restore = coachTelegramApi.restore;
export const bulkStatus = coachTelegramApi.bulkStatus;
export const bulkTrash = coachTelegramApi.bulkTrash;
export const bulkRestore = coachTelegramApi.bulkRestore;
export const bulkHardDelete = coachTelegramApi.bulkHardDelete;
export const reorder = coachTelegramApi.reorder;
export const exportData = coachTelegramApi.exportData;
export const importData = coachTelegramApi.importData;

export default coachTelegramApi;
