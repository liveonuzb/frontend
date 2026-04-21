import { defaultsDeep, get } from "lodash";
import coachPaymentsApi, {
  DETAIL_QUERY_KEY,
  LIST_QUERY_KEY,
} from "../api/coach-payments-api";
import { createCoachResourceHooks } from "./create-coach-resource-hooks";
import { useGetQuery } from "@/hooks/api";

const coachPaymentsHooks = createCoachResourceHooks({
  baseUrl: coachPaymentsApi.baseUrl,
  listQueryKey: LIST_QUERY_KEY,
  detailQueryKey: DETAIL_QUERY_KEY,
});

export const useCoachPayments = coachPaymentsHooks.useList;
export const useCoachPayment = coachPaymentsHooks.useDetail;
export const useCoachPaymentsMutations = coachPaymentsHooks.useMutations;

const DEFAULT_PAYMENT_STATS = {
  revenue: {
    total: 0,
    currentMonth: 0,
    lastMonth: 0,
    expectedCurrentMonth: 0,
    collectedCurrentMonth: 0,
    outstandingCurrentMonth: 0,
    collectionRate: 0,
    growth: 0,
  },
  balance: { total: 0, pending: 0, available: 0, withdrawn: 0 },
  counts: {
    completed: 0,
    cancelled: 0,
    refunded: 0,
    pending: 0,
    overdue: 0,
  },
};

export const useCoachPaymentStats = () => {
  const { data, ...query } = useGetQuery({
    url: "/coach/payments/stats",
    queryProps: {
      queryKey: [...LIST_QUERY_KEY, "stats"],
    },
  });

  return {
    ...query,
    stats: defaultsDeep({}, get(data, "data", {}), DEFAULT_PAYMENT_STATS),
  };
};

export default coachPaymentsHooks;
