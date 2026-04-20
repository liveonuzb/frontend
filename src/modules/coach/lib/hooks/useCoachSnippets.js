import coachSnippetsApi, {
  DETAIL_QUERY_KEY,
  LIST_QUERY_KEY,
} from "../api/coach-snippets-api";
import { createCoachResourceHooks } from "./create-coach-resource-hooks";

const coachSnippetsHooks = createCoachResourceHooks({
  baseUrl: coachSnippetsApi.baseUrl,
  listQueryKey: LIST_QUERY_KEY,
  detailQueryKey: DETAIL_QUERY_KEY,
});

export const useCoachSnippets = coachSnippetsHooks.useList;
export const useCoachSnippet = coachSnippetsHooks.useDetail;
export const useCoachSnippetsMutations = coachSnippetsHooks.useMutations;

export default coachSnippetsHooks;
