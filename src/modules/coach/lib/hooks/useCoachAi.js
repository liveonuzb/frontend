import coachAiApi, {
  DETAIL_QUERY_KEY,
  LIST_QUERY_KEY,
} from "../api/coach-ai-api";
import { createCoachResourceHooks } from "./create-coach-resource-hooks";

const coachAiHooks = createCoachResourceHooks({
  baseUrl: coachAiApi.baseUrl,
  listQueryKey: LIST_QUERY_KEY,
  detailQueryKey: DETAIL_QUERY_KEY,
});

export const useCoachAi = coachAiHooks.useList;
export const useCoachAiInvocation = coachAiHooks.useDetail;
export const useCoachAiMutations = coachAiHooks.useMutations;

export default coachAiHooks;
