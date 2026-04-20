import { createCoachResourceApi } from "./create-coach-resource-api";

const coachWorkoutPlansApi = createCoachResourceApi({
  resource: "workout-plans",
  queryKeyBase: ["coach", "workout-plans"],
});

export const LIST_QUERY_KEY = coachWorkoutPlansApi.LIST_QUERY_KEY;
export const DETAIL_QUERY_KEY = coachWorkoutPlansApi.DETAIL_QUERY_KEY;
export const getList = coachWorkoutPlansApi.getList;
export const getById = coachWorkoutPlansApi.getById;
export const create = coachWorkoutPlansApi.create;
export const update = coachWorkoutPlansApi.update;
export const remove = coachWorkoutPlansApi.remove;
export const updateStatus = coachWorkoutPlansApi.updateStatus;
export const restore = coachWorkoutPlansApi.restore;
export const bulkStatus = coachWorkoutPlansApi.bulkStatus;
export const bulkTrash = coachWorkoutPlansApi.bulkTrash;
export const bulkRestore = coachWorkoutPlansApi.bulkRestore;
export const bulkHardDelete = coachWorkoutPlansApi.bulkHardDelete;
export const reorder = coachWorkoutPlansApi.reorder;
export const exportData = coachWorkoutPlansApi.exportData;
export const importData = coachWorkoutPlansApi.importData;

export default coachWorkoutPlansApi;
