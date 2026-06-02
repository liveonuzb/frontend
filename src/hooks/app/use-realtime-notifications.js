import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import get from "lodash/get";
import { USER_NOTIFICATIONS_QUERY_KEY } from "@/hooks/app/use-notifications";
import { PREMIUM_QUERY_KEY } from "@/hooks/app/use-premium";
import { ME_QUERY_KEY } from "@/hooks/app/use-profile-settings";
import { AI_USAGE_STATUS_QUERY_KEY } from "@/hooks/app/use-ai-access";
import { useAuthStore, useChatStore } from "@/store";

export const REALTIME_NOTIFICATION_CREATED_EVENT = "notification:created";

export const useRealtimeNotifications = (options = {}) => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => get(state, "user.id", null));
  const activeRole = useAuthStore((state) => state.activeRole);
  const token = useAuthStore((state) => state.token);
  const socket = useChatStore((state) => state.socket);
  const initSocket = useChatStore((state) => state.initSocket);
  const disconnectSocket = useChatStore((state) => state.disconnectSocket);
  const enabled =
    (options.enabled ?? true) &&
    Boolean(token) &&
    Boolean(userId) &&
    activeRole === "USER";

  React.useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    initSocket();
    return () => disconnectSocket();
  }, [disconnectSocket, enabled, initSocket]);

  React.useEffect(() => {
    if (!enabled || !socket) {
      return undefined;
    }

    const handleNotificationCreated = (payload = {}) => {
      const payloadUserId = get(payload, "userId");

      if (payloadUserId && payloadUserId !== userId) {
        return;
      }

      void queryClient.invalidateQueries({
        queryKey: USER_NOTIFICATIONS_QUERY_KEY,
      });
      void queryClient.invalidateQueries({ queryKey: PREMIUM_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
      void queryClient.invalidateQueries({
        queryKey: AI_USAGE_STATUS_QUERY_KEY,
      });
    };

    socket.on(REALTIME_NOTIFICATION_CREATED_EVENT, handleNotificationCreated);

    return () => {
      socket.off(
        REALTIME_NOTIFICATION_CREATED_EVENT,
        handleNotificationCreated,
      );
    };
  }, [enabled, queryClient, socket, userId]);
};

export default useRealtimeNotifications;
