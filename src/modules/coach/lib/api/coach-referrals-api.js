import { createCoachResourceApi } from "./create-coach-resource-api";

const coachReferralsApi = createCoachResourceApi({
  resource: "referrals",
  queryKeyBase: ["coach", "referrals"],
});

export const LIST_QUERY_KEY = coachReferralsApi.LIST_QUERY_KEY;
export const DETAIL_QUERY_KEY = coachReferralsApi.DETAIL_QUERY_KEY;
export const getList = coachReferralsApi.getList;
export const getById = coachReferralsApi.getById;
export const create = coachReferralsApi.create;
export const update = coachReferralsApi.update;
export const remove = coachReferralsApi.remove;
export const updateStatus = coachReferralsApi.updateStatus;
export const restore = coachReferralsApi.restore;
export const bulkStatus = coachReferralsApi.bulkStatus;
export const bulkTrash = coachReferralsApi.bulkTrash;
export const bulkRestore = coachReferralsApi.bulkRestore;
export const bulkHardDelete = coachReferralsApi.bulkHardDelete;
export const reorder = coachReferralsApi.reorder;
export const exportData = coachReferralsApi.exportData;
export const importData = coachReferralsApi.importData;

export default coachReferralsApi;
