import { useGetQuery } from "@/hooks/api";

const REFERRALS_KEY = ["coach", "referrals", "dashboard"];

export function useCoachReferralDashboard(options = {}) {
  return useGetQuery({
    url: "/coach/referrals/dashboard",
    queryProps: {
      queryKey: REFERRALS_KEY,
      ...options,
    },
  });
}
