import coachClientsApi, {
  DETAIL_QUERY_KEY,
  LIST_QUERY_KEY,
} from "../api/coach-clients-api";
import { createCoachResourceHooks } from "./create-coach-resource-hooks";

const coachClientsHooks = createCoachResourceHooks({
  baseUrl: coachClientsApi.baseUrl,
  listQueryKey: LIST_QUERY_KEY,
  detailQueryKey: DETAIL_QUERY_KEY,
});

export const useCoachClients = coachClientsHooks.useList;
export const useCoachClient = coachClientsHooks.useDetail;
export const useCoachClientsMutations = coachClientsHooks.useMutations;

export default coachClientsHooks;
