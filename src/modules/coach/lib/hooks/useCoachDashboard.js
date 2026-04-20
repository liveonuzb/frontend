import coachDashboardApi, {
  DETAIL_QUERY_KEY,
  LIST_QUERY_KEY,
} from "../api/coach-dashboard-api";
import { createCoachResourceHooks } from "./create-coach-resource-hooks";

const coachDashboardHooks = createCoachResourceHooks({
  baseUrl: coachDashboardApi.baseUrl,
  listQueryKey: LIST_QUERY_KEY,
  detailQueryKey: DETAIL_QUERY_KEY,
});

export const useCoachDashboard = coachDashboardHooks.useList;
export const useCoachDashboardItem = coachDashboardHooks.useDetail;
export const useCoachDashboardMutations = coachDashboardHooks.useMutations;

export default coachDashboardHooks;
