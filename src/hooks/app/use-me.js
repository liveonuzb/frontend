import React from "react";
import { get } from "lodash";
import { useGetQuery } from "@/hooks/api";
import { useAuthStore } from "@/store";
import { normalizeUserOnboarding } from "@/lib/user-onboarding";
import { getApiResponseData } from "@/lib/api-response";

export const ME_QUERY_KEY = ["me"];

export const useMe = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const query = useGetQuery({
    url: "/users/me",
    queryProps: {
      queryKey: ME_QUERY_KEY,
      enabled: isAuthenticated,
    },
  });

  const user = React.useMemo(
    () => getApiResponseData(query.data, null),
    [query.data],
  );

  const onboarding = React.useMemo(
    () => normalizeUserOnboarding(get(user, "onboarding")),
    [user],
  );

  return {
    ...query,
    user,
    onboarding,
  };
};

export default useMe;
