import { createCoachResourceApi } from "./create-coach-resource-api";

const coachGroupsApi = createCoachResourceApi({
  resource: "groups",
  queryKeyBase: ["coach", "groups"],
});

export const LIST_QUERY_KEY = coachGroupsApi.LIST_QUERY_KEY;
export const DETAIL_QUERY_KEY = coachGroupsApi.DETAIL_QUERY_KEY;
export const getList = coachGroupsApi.getList;
export const getById = coachGroupsApi.getById;
export const create = coachGroupsApi.create;
export const update = coachGroupsApi.update;
export const remove = coachGroupsApi.remove;
export const updateStatus = coachGroupsApi.updateStatus;
export const restore = coachGroupsApi.restore;
export const bulkStatus = coachGroupsApi.bulkStatus;
export const bulkTrash = coachGroupsApi.bulkTrash;
export const bulkRestore = coachGroupsApi.bulkRestore;
export const bulkHardDelete = coachGroupsApi.bulkHardDelete;
export const reorder = coachGroupsApi.reorder;
export const exportData = coachGroupsApi.exportData;
export const importData = coachGroupsApi.importData;

export default coachGroupsApi;
