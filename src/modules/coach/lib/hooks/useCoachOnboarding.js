import coachOnboardingApi, {
  DETAIL_QUERY_KEY,
  LIST_QUERY_KEY,
} from "../api/coach-onboarding-api";
import { createCoachResourceHooks } from "./create-coach-resource-hooks";

const coachOnboardingHooks = createCoachResourceHooks({
  baseUrl: coachOnboardingApi.baseUrl,
  listQueryKey: LIST_QUERY_KEY,
  detailQueryKey: DETAIL_QUERY_KEY,
});

export const useCoachOnboarding = coachOnboardingHooks.useList;
export const useCoachOnboardingStep = coachOnboardingHooks.useDetail;
export const useCoachOnboardingMutations = coachOnboardingHooks.useMutations;

export default coachOnboardingHooks;
