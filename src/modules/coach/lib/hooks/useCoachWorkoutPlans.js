import coachWorkoutPlansApi, {
  DETAIL_QUERY_KEY,
  LIST_QUERY_KEY,
} from "../api/coach-workout-plans-api";
import { createCoachResourceHooks } from "./create-coach-resource-hooks";

const coachWorkoutPlansHooks = createCoachResourceHooks({
  baseUrl: coachWorkoutPlansApi.baseUrl,
  listQueryKey: LIST_QUERY_KEY,
  detailQueryKey: DETAIL_QUERY_KEY,
});

export const useCoachWorkoutPlans = coachWorkoutPlansHooks.useList;
export const useCoachWorkoutPlan = coachWorkoutPlansHooks.useDetail;
export const useCoachWorkoutPlansMutations = coachWorkoutPlansHooks.useMutations;

export default coachWorkoutPlansHooks;
