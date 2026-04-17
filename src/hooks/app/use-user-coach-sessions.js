import React from "react";
import { get } from "lodash";
import { useQueryClient } from "@tanstack/react-query";
import { useGetQuery, usePostQuery } from "@/hooks/api";

export const USER_COACH_SESSIONS_QUERY_KEY = ["me", "coach-sessions"];

const DEFAULT_SUMMARY = {
  proposed: 0,
  scheduled: 0,
  completed: 0,
  cancelled: 0,
};

export const useUserCoachSessions = (options = {}) => {
  const queryClient = useQueryClient();
  const enabled = options.enabled ?? true;
  const { data, ...query } = useGetQuery({
    url: "/users/me/coach-sessions",
    queryProps: {
      queryKey: USER_COACH_SESSIONS_QUERY_KEY,
      enabled,
      refetchInterval: 15000,
      refetchOnWindowFocus: true,
    },
  });

  const cancelMutation = usePostQuery({
    queryKey: USER_COACH_SESSIONS_QUERY_KEY,
    mutationProps: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: USER_COACH_SESSIONS_QUERY_KEY,
        });
      },
    },
  });

  const cancelSession = React.useCallback(
    async (session, reason) =>
      cancelMutation.mutateAsync({
        url: `/chat/rooms/${session.roomId}/bookings/${session.id}/cancel`,
        attributes: {
          reason,
        },
      }),
    [cancelMutation],
  );

  return {
    ...query,
    sessions: get(data, "data.items", []),
    upcomingSessions: get(data, "data.upcoming", []),
    sessionHistory: get(data, "data.history", []),
    sessionSummary: {
      ...DEFAULT_SUMMARY,
      ...(get(data, "data.summary", {}) || {}),
    },
    cancelSession,
    isCancellingSession: cancelMutation.isPending,
  };
};

export default useUserCoachSessions;
