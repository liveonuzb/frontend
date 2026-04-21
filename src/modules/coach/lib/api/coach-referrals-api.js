import { createCoachResourceApi } from "./create-coach-resource-api";
import { api } from "@/hooks/api/use-api";

const coachReferralsApi = createCoachResourceApi({
  resource: "referrals",
  queryKeyBase: ["coach", "referrals"],
});

export const LIST_QUERY_KEY = coachReferralsApi.LIST_QUERY_KEY;
export const DETAIL_QUERY_KEY = coachReferralsApi.DETAIL_QUERY_KEY;
export const DASHBOARD_QUERY_KEY = ["coach", "referrals", "dashboard"];
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
export const getDashboard = (params = {}, config = {}) =>
  api.get("/coach/referrals/dashboard", { params, ...config });
export const cancelReferral = (id, config = {}) =>
  api.patch(`/coach/referrals/${id}/cancel`, {}, config);
export const resendReferral = (id, config = {}) =>
  api.post(`/coach/referrals/${id}/resend`, {}, config);
export const trackReferralClick = (code, config = {}) =>
  api.get(`/coach/referrals/track/${encodeURIComponent(code)}`, config);

export default coachReferralsApi;
