import { api } from "@/hooks/api/use-api";

export const LIST_QUERY_KEY = ["coach", "course-purchases"];
export const DETAIL_QUERY_KEY = [...LIST_QUERY_KEY, "detail"];

export const getList = (params = {}, config = {}) =>
  api.get("/coach/course-purchases", { params, ...config });
export const getById = (id, params = {}, config = {}) =>
  api.get(`/coach/course-purchases/${id}`, { params, ...config });
export const approvePurchase = (id, attributes = {}, config = {}) =>
  api.patch(`/coach/course-purchases/${id}/approve`, attributes, config);
export const rejectPurchase = (id, attributes = {}, config = {}) =>
  api.patch(`/coach/course-purchases/${id}/reject`, attributes, config);
export const revokePurchase = (id, attributes = {}, config = {}) =>
  api.patch(`/coach/course-purchases/${id}/revoke`, attributes, config);
export const extendPurchase = (id, attributes = {}, config = {}) =>
  api.patch(`/coach/course-purchases/${id}/extend`, attributes, config);
export const resendInvite = (id, config = {}) =>
  api.patch(`/coach/course-purchases/${id}/resend-invite`, {}, config);
export const bulkApprove = (attributes = {}, config = {}) =>
  api.patch("/coach/course-purchases/bulk-approve", attributes, config);
export const bulkReject = (attributes = {}, config = {}) =>
  api.patch("/coach/course-purchases/bulk-reject", attributes, config);
export const exportCsv = (params = {}, config = {}) =>
  api.get("/coach/course-purchases/export.csv", { params, ...config });
