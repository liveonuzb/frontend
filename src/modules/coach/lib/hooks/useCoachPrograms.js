import coachProgramsApi, {
  DETAIL_QUERY_KEY,
  LIST_QUERY_KEY,
} from "../api/coach-programs-api";
import { createCoachResourceHooks } from "./create-coach-resource-hooks";

const coachProgramsHooks = createCoachResourceHooks({
  baseUrl: coachProgramsApi.baseUrl,
  listQueryKey: LIST_QUERY_KEY,
  detailQueryKey: DETAIL_QUERY_KEY,
});

export const useCoachPrograms = coachProgramsHooks.useList;
export const useCoachProgram = coachProgramsHooks.useDetail;
export const useCoachProgramsMutations = coachProgramsHooks.useMutations;

export default coachProgramsHooks;
