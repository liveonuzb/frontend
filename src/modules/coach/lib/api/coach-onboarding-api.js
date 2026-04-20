import { createCoachResourceApi } from "./create-coach-resource-api";

const coachOnboardingApi = createCoachResourceApi({
  resource: "onboarding",
  queryKeyBase: ["coach", "onboarding"],
});

export const LIST_QUERY_KEY = coachOnboardingApi.LIST_QUERY_KEY;
export const DETAIL_QUERY_KEY = coachOnboardingApi.DETAIL_QUERY_KEY;
export const getList = coachOnboardingApi.getList;
export const getById = coachOnboardingApi.getById;
export const create = coachOnboardingApi.create;
export const update = coachOnboardingApi.update;
export const remove = coachOnboardingApi.remove;
export const updateStatus = coachOnboardingApi.updateStatus;
export const restore = coachOnboardingApi.restore;
export const bulkStatus = coachOnboardingApi.bulkStatus;
export const bulkTrash = coachOnboardingApi.bulkTrash;
export const bulkRestore = coachOnboardingApi.bulkRestore;
export const bulkHardDelete = coachOnboardingApi.bulkHardDelete;
export const reorder = coachOnboardingApi.reorder;
export const exportData = coachOnboardingApi.exportData;
export const importData = coachOnboardingApi.importData;

export default coachOnboardingApi;
