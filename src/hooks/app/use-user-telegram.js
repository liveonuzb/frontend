import React from "react";
import { usePostQuery } from "@/hooks/api";
import { getApiResponseData } from "@/lib/api-response";

export const useUserTelegram = () => {
  const connectMutation = usePostQuery();

  const createConnectLink = React.useCallback(async () => {
    const response = await connectMutation.mutateAsync({
      url: "/user/telegram/connect-link",
    });

    return getApiResponseData(response, null);
  }, [connectMutation]);

  return {
    createConnectLink,
    isCreatingConnectLink: connectMutation.isPending,
  };
};

export default useUserTelegram;
