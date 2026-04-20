import coachReportsApi, {
  DETAIL_QUERY_KEY,
  LIST_QUERY_KEY,
} from "../api/coach-reports-api";
import { createCoachResourceHooks } from "./create-coach-resource-hooks";

const coachReportsHooks = createCoachResourceHooks({
  baseUrl: coachReportsApi.baseUrl,
  listQueryKey: LIST_QUERY_KEY,
  detailQueryKey: DETAIL_QUERY_KEY,
});

export const useCoachReports = coachReportsHooks.useList;
export const useCoachReport = coachReportsHooks.useDetail;
export const useCoachReportsMutations = coachReportsHooks.useMutations;

export default coachReportsHooks;
