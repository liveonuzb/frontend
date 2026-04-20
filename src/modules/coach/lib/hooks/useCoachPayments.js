import coachPaymentsApi, {
  DETAIL_QUERY_KEY,
  LIST_QUERY_KEY,
} from "../api/coach-payments-api";
import { createCoachResourceHooks } from "./create-coach-resource-hooks";

const coachPaymentsHooks = createCoachResourceHooks({
  baseUrl: coachPaymentsApi.baseUrl,
  listQueryKey: LIST_QUERY_KEY,
  detailQueryKey: DETAIL_QUERY_KEY,
});

export const useCoachPayments = coachPaymentsHooks.useList;
export const useCoachPayment = coachPaymentsHooks.useDetail;
export const useCoachPaymentsMutations = coachPaymentsHooks.useMutations;

export default coachPaymentsHooks;
