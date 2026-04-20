import coachGroupsApi, {
  DETAIL_QUERY_KEY,
  LIST_QUERY_KEY,
} from "../api/coach-groups-api";
import { createCoachResourceHooks } from "./create-coach-resource-hooks";

const coachGroupsHooks = createCoachResourceHooks({
  baseUrl: coachGroupsApi.baseUrl,
  listQueryKey: LIST_QUERY_KEY,
  detailQueryKey: DETAIL_QUERY_KEY,
});

export const useCoachGroups = coachGroupsHooks.useList;
export const useCoachGroup = coachGroupsHooks.useDetail;
export const useCoachGroupsMutations = coachGroupsHooks.useMutations;

export default coachGroupsHooks;
