import { createCoachResourceApi } from "./create-coach-resource-api";

const coachSnippetsApi = createCoachResourceApi({
  resource: "snippets",
  queryKeyBase: ["coach", "snippets"],
});

export const LIST_QUERY_KEY = coachSnippetsApi.LIST_QUERY_KEY;
export const DETAIL_QUERY_KEY = coachSnippetsApi.DETAIL_QUERY_KEY;
export const getList = coachSnippetsApi.getList;
export const getById = coachSnippetsApi.getById;
export const create = coachSnippetsApi.create;
export const update = coachSnippetsApi.update;
export const remove = coachSnippetsApi.remove;
export const updateStatus = coachSnippetsApi.updateStatus;
export const restore = coachSnippetsApi.restore;
export const bulkStatus = coachSnippetsApi.bulkStatus;
export const bulkTrash = coachSnippetsApi.bulkTrash;
export const bulkRestore = coachSnippetsApi.bulkRestore;
export const bulkHardDelete = coachSnippetsApi.bulkHardDelete;
export const reorder = coachSnippetsApi.reorder;
export const exportData = coachSnippetsApi.exportData;
export const importData = coachSnippetsApi.importData;

export default coachSnippetsApi;
