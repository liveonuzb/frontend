import React from "react";
import { get } from "lodash";
import { useGetQuery } from "@/hooks/api";

export const USER_COACH_FEEDBACK_QUERY_KEY = ["me", "coach-feedback"];

export const useCoachFeedback = (options = {}) => {
  const enabled = options.enabled ?? true;
  const { data, ...query } = useGetQuery({
    url: "/users/me/coach-feedback",
    queryProps: {
      queryKey: USER_COACH_FEEDBACK_QUERY_KEY,
      enabled,
    },
  });

  const items = get(data, "data.data.items", []);

  return {
    ...query,
    items,
    latestFeedback: items[0] ?? null,
    unreadItems: React.useMemo(() => items.slice(0, 3), [items]),
  };
};

export default useCoachFeedback;
