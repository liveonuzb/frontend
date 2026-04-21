import { api } from "@/hooks/api/use-api";
import { createCoachResourceApi } from "./create-coach-resource-api";

const coachSessionsApi = createCoachResourceApi({
  resource: "sessions",
  queryKeyBase: ["coach", "sessions"],
});

export const LIST_QUERY_KEY = coachSessionsApi.LIST_QUERY_KEY;
export const DETAIL_QUERY_KEY = coachSessionsApi.DETAIL_QUERY_KEY;
export const getList = coachSessionsApi.getList;
export const reschedule = (id, attributes = {}, config = {}) =>
  api.patch(`/coach/sessions/${id}/reschedule`, attributes, config);
export const cancel = (id, attributes = {}, config = {}) =>
  api.patch(`/coach/sessions/${id}/cancel`, attributes, config);
export const complete = (id, attributes = {}, config = {}) =>
  api.patch(`/coach/sessions/${id}/complete`, attributes, config);
export const bulkReschedule = (attributes = {}, config = {}) =>
  api.patch("/coach/sessions/bulk/reschedule", attributes, config);
export const bulkCancel = (attributes = {}, config = {}) =>
  api.patch("/coach/sessions/bulk/cancel", attributes, config);
export const bulkComplete = (attributes = {}, config = {}) =>
  api.patch("/coach/sessions/bulk/complete", attributes, config);
export const createBooking = (roomId, attributes = {}, config = {}) =>
  api.post(`/user/chat/rooms/${roomId}/bookings`, attributes, config);

export default coachSessionsApi;
