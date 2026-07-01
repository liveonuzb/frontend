import { useQueryClient } from "@tanstack/react-query";
import get from "lodash/get";
import { useDeleteQuery, useGetQuery, usePostQuery } from "@/hooks/api";
import { getApiResponseData } from "@/lib/api-response";

export const HEALTH_SYNC_QUERY_KEY = ["user", "health-sync"];

const useHealthSync = () => {
  const queryClient = useQueryClient();
  const statusQuery = useGetQuery({
    url: "/user/health-sync/status",
    queryProps: {
      queryKey: HEALTH_SYNC_QUERY_KEY,
    },
  });
  const invalidateHealthData = async () => {
    await queryClient.invalidateQueries({ queryKey: HEALTH_SYNC_QUERY_KEY });
    await queryClient.invalidateQueries({ queryKey: ["daily-tracking"] });
    await queryClient.invalidateQueries({ queryKey: ["user", "daily-metric-detail"] });
  };
  const startMutation = usePostQuery({
    queryKey: HEALTH_SYNC_QUERY_KEY,
  });
  const syncMutation = usePostQuery({
    queryKey: HEALTH_SYNC_QUERY_KEY,
    mutationProps: {
      onSuccess: invalidateHealthData,
    },
  });
  const disconnectMutation = useDeleteQuery({
    queryKey: HEALTH_SYNC_QUERY_KEY,
    mutationProps: {
      onSuccess: invalidateHealthData,
    },
  });

  const connectGoogle = async () => {
    const response = await startMutation.mutateAsync({
      url: "/user/health-sync/google/start",
      attributes: {},
    });
    return getApiResponseData(response, {});
  };

  const syncGoogle = async (attributes = {}) => {
    const response = await syncMutation.mutateAsync({
      url: "/user/health-sync/google/sync",
      attributes,
    });
    return getApiResponseData(response, {});
  };

  const disconnectGoogle = async () => {
    const response = await disconnectMutation.mutateAsync({
      url: "/user/health-sync/google",
    });
    return getApiResponseData(response, {});
  };

  return {
    status: getApiResponseData(statusQuery.data, {
      google: {
        connected: false,
        status: "disconnected",
        lastSyncAt: null,
        lastError: null,
      },
    }),
    isLoading: statusQuery.isLoading,
    isConnecting: startMutation.isPending,
    isSyncing: syncMutation.isPending,
    isDisconnecting: disconnectMutation.isPending,
    lastError: get(statusQuery.error, "message", null),
    connectGoogle,
    syncGoogle,
    disconnectGoogle,
  };
};

export default useHealthSync;
