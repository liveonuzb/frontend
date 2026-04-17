import { get } from "lodash";
import { useGetQuery, usePatchQuery } from "@/hooks/api";
import { COACH_TELEGRAM_QUERY_KEY } from "./use-coach-query-keys";

export const useCoachPaymentProfile = () => {
  const { data, ...query } = useGetQuery({
    url: "/coach/payment-profile",
    queryProps: {
      queryKey: [...COACH_TELEGRAM_QUERY_KEY, "payment-profile"],
    },
  });

  return {
    ...query,
    profile: get(data, "data.data", get(data, "data", null)),
  };
};

export const useSaveCoachPaymentProfile = () =>
  usePatchQuery({
    queryKey: [...COACH_TELEGRAM_QUERY_KEY, "payment-profile"],
  });
