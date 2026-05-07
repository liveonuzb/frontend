import { api } from "@/hooks/api/use-api";
import { createCoachResourceApi } from "./create-coach-resource-api";

const coachPaymentsApi = createCoachResourceApi({
  resource: "payments",
  queryKeyBase: ["coach", "payments"],
});

export const LIST_QUERY_KEY = coachPaymentsApi.LIST_QUERY_KEY;
export const DETAIL_QUERY_KEY = coachPaymentsApi.DETAIL_QUERY_KEY;
export const getList = coachPaymentsApi.getList;
export const getById = coachPaymentsApi.getById;
export const create = coachPaymentsApi.create;
export const update = coachPaymentsApi.update;
export const remove = coachPaymentsApi.remove;
export const updateStatus = coachPaymentsApi.updateStatus;
export const restore = coachPaymentsApi.restore;
export const bulkStatus = coachPaymentsApi.bulkStatus;
export const bulkTrash = coachPaymentsApi.bulkTrash;
export const bulkRestore = coachPaymentsApi.bulkRestore;
export const bulkHardDelete = coachPaymentsApi.bulkHardDelete;
export const reorder = coachPaymentsApi.reorder;
export const exportData = (params = {}, config = {}) =>
  api.get("/coach/payments/export.csv", { params, ...config });
export const importData = coachPaymentsApi.importData;
export const getPaymentDues = (params = {}, config = {}) =>
  api.get("/coach/payments/dues", { params, ...config });
export const syncPaymentDues = (attributes = {}, config = {}) =>
  api.post("/coach/payments/dues/sync", attributes, config);
export const createPaymentDueCheckout = (dueId, attributes = {}, config = {}) =>
  api.post(`/coach/payments/dues/${dueId}/checkout`, attributes, config);
export const getPayoutSummary = (config = {}) =>
  api.get("/coach/payments/payouts/summary", config);
export const getPayoutRequests = (config = {}) =>
  api.get("/coach/payments/payouts", config);
export const requestPayout = (attributes = {}, config = {}) =>
  api.post("/coach/payments/payouts", attributes, config);

export default {
  ...coachPaymentsApi,
  exportData,
  getPaymentDues,
  syncPaymentDues,
  createPaymentDueCheckout,
  getPayoutSummary,
  getPayoutRequests,
  requestPayout,
};
