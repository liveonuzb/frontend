import coachChallengesApi, {
  DETAIL_QUERY_KEY,
  LIST_QUERY_KEY,
} from "../api/coach-challenges-api";
import { createCoachResourceHooks } from "./create-coach-resource-hooks";

const coachChallengesHooks = createCoachResourceHooks({
  baseUrl: coachChallengesApi.baseUrl,
  listQueryKey: LIST_QUERY_KEY,
  detailQueryKey: DETAIL_QUERY_KEY,
});

export const useCoachChallenges = coachChallengesHooks.useList;
export const useCoachChallenge = coachChallengesHooks.useDetail;
export const useCoachChallengesMutations = coachChallengesHooks.useMutations;

export default coachChallengesHooks;
