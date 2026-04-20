import { createCoachResourceApi } from "./create-coach-resource-api";

const coachProgramsApi = createCoachResourceApi({
  resource: "programs",
  queryKeyBase: ["coach", "programs"],
});

export const LIST_QUERY_KEY = coachProgramsApi.LIST_QUERY_KEY;
export const DETAIL_QUERY_KEY = coachProgramsApi.DETAIL_QUERY_KEY;
export const getList = coachProgramsApi.getList;
export const getById = coachProgramsApi.getById;
export const create = coachProgramsApi.create;
export const update = coachProgramsApi.update;
export const remove = coachProgramsApi.remove;
export const updateStatus = coachProgramsApi.updateStatus;
export const restore = coachProgramsApi.restore;
export const bulkStatus = coachProgramsApi.bulkStatus;
export const bulkTrash = coachProgramsApi.bulkTrash;
export const bulkRestore = coachProgramsApi.bulkRestore;
export const bulkHardDelete = coachProgramsApi.bulkHardDelete;
export const reorder = coachProgramsApi.reorder;
export const exportData = coachProgramsApi.exportData;
export const importData = coachProgramsApi.importData;

export default coachProgramsApi;
