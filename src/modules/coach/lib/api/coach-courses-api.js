import { createCoachResourceApi } from "./create-coach-resource-api";
import { api } from "@/hooks/api/use-api";

const coachCoursesApi = createCoachResourceApi({
  resource: "courses",
  queryKeyBase: ["coach", "courses"],
});

export const LIST_QUERY_KEY = coachCoursesApi.LIST_QUERY_KEY;
export const DETAIL_QUERY_KEY = coachCoursesApi.DETAIL_QUERY_KEY;
export const getList = coachCoursesApi.getList;
export const getById = coachCoursesApi.getById;
export const create = coachCoursesApi.create;
export const update = coachCoursesApi.update;
export const remove = coachCoursesApi.remove;
export const reorder = coachCoursesApi.reorder;
export const publishCourse = (id, config = {}) =>
  api.patch(`/coach/courses/${id}/publish`, {}, config);
export const unpublishCourse = (id, config = {}) =>
  api.patch(`/coach/courses/${id}/unpublish`, {}, config);
export const connectGroup = (id, attributes = {}, config = {}) =>
  api.patch(`/coach/courses/${id}/group/connect`, attributes, config);
export const disconnectGroup = (id, attributes = {}, config = {}) =>
  api.patch(`/coach/courses/${id}/group/disconnect`, attributes, config);
export const refreshGroupAdmin = (id, config = {}) =>
  api.patch(`/coach/courses/${id}/group/refresh`, {}, config);

export default coachCoursesApi;
