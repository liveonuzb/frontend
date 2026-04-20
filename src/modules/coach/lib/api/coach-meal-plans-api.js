import { createCoachResourceApi } from "./create-coach-resource-api";

const coachMealPlansApi = createCoachResourceApi({
  resource: "meal-plans",
  queryKeyBase: ["coach", "meal-plans"],
});

export const LIST_QUERY_KEY = coachMealPlansApi.LIST_QUERY_KEY;
export const DETAIL_QUERY_KEY = coachMealPlansApi.DETAIL_QUERY_KEY;
export const getList = coachMealPlansApi.getList;
export const getById = coachMealPlansApi.getById;
export const create = coachMealPlansApi.create;
export const update = coachMealPlansApi.update;
export const remove = coachMealPlansApi.remove;
export const updateStatus = coachMealPlansApi.updateStatus;
export const restore = coachMealPlansApi.restore;
export const bulkStatus = coachMealPlansApi.bulkStatus;
export const bulkTrash = coachMealPlansApi.bulkTrash;
export const bulkRestore = coachMealPlansApi.bulkRestore;
export const bulkHardDelete = coachMealPlansApi.bulkHardDelete;
export const reorder = coachMealPlansApi.reorder;
export const exportData = coachMealPlansApi.exportData;
export const importData = coachMealPlansApi.importData;

export default coachMealPlansApi;
