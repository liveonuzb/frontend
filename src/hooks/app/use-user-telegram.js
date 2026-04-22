import React from "react";
import { useDeleteQuery, usePostQuery } from "@/hooks/api";
import { getApiResponseData } from "@/lib/api-response";
import { ME_QUERY_KEY } from "./use-me";

export const useUserTelegram = () => {
  const connectMutation = usePostQuery();
  const disconnectMutation = useDeleteQuery({
    queryKey: ME_QUERY_KEY,
  });

  const createConnectLink = React.useCallback(async () => {
    const response = await connectMutation.mutateAsync({
      url: "/user/telegram/connect-link",
    });

    return getApiResponseData(response, null);
  }, [connectMutation]);

  const disconnectTelegram = React.useCallback(async () => {
    const response = await disconnectMutation.mutateAsync({
      url: "/user/telegram",
    });

    return getApiResponseData(response, null);
  }, [disconnectMutation]);

  return {
    createConnectLink,
    disconnectTelegram,
    isCreatingConnectLink: connectMutation.isPending,
    isDisconnectingTelegram: disconnectMutation.isPending,
  };
};

export default useUserTelegram;
