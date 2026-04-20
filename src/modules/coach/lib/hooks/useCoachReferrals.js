import coachReferralsApi, {
  DETAIL_QUERY_KEY,
  LIST_QUERY_KEY,
} from "../api/coach-referrals-api";
import { createCoachResourceHooks } from "./create-coach-resource-hooks";

const coachReferralsHooks = createCoachResourceHooks({
  baseUrl: coachReferralsApi.baseUrl,
  listQueryKey: LIST_QUERY_KEY,
  detailQueryKey: DETAIL_QUERY_KEY,
});

export const useCoachReferrals = coachReferralsHooks.useList;
export const useCoachReferral = coachReferralsHooks.useDetail;
export const useCoachReferralsMutations = coachReferralsHooks.useMutations;

export default coachReferralsHooks;
