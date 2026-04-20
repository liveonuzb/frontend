import coachMealPlansApi, {
  DETAIL_QUERY_KEY,
  LIST_QUERY_KEY,
} from "../api/coach-meal-plans-api";
import { createCoachResourceHooks } from "./create-coach-resource-hooks";

const coachMealPlansHooks = createCoachResourceHooks({
  baseUrl: coachMealPlansApi.baseUrl,
  listQueryKey: LIST_QUERY_KEY,
  detailQueryKey: DETAIL_QUERY_KEY,
});

export const useCoachMealPlans = coachMealPlansHooks.useList;
export const useCoachMealPlan = coachMealPlansHooks.useDetail;
export const useCoachMealPlansMutations = coachMealPlansHooks.useMutations;

export default coachMealPlansHooks;
