import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import coachSessionsApi, {
  DETAIL_QUERY_KEY,
  LIST_QUERY_KEY,
} from "../api/coach-sessions-api";
import { createCoachResourceHooks } from "./create-coach-resource-hooks";
import { usePatchQuery, usePostQuery } from "@/hooks/api";

const coachSessionsHooks = createCoachResourceHooks({
  baseUrl: coachSessionsApi.baseUrl,
  listQueryKey: LIST_QUERY_KEY,
  detailQueryKey: DETAIL_QUERY_KEY,
});

export const useCoachSessions = coachSessionsHooks.useList;
export const useCoachSession = coachSessionsHooks.useDetail;

export const useCoachSessionsMutations = () => {
  const queryClient = useQueryClient();
  const invalidateSessions = React.useCallback(
    () => queryClient.invalidateQueries({ queryKey: LIST_QUERY_KEY }),
    [queryClient],
  );

  const createMutation = usePostQuery({
    queryKey: LIST_QUERY_KEY,
    mutationProps: { onSuccess: invalidateSessions },
  });
  const rescheduleMutation = usePatchQuery({
    queryKey: LIST_QUERY_KEY,
    mutationProps: { onSuccess: invalidateSessions },
  });
  const cancelMutation = usePatchQuery({
    queryKey: LIST_QUERY_KEY,
    mutationProps: { onSuccess: invalidateSessions },
  });
  const completeMutation = usePatchQuery({
    queryKey: LIST_QUERY_KEY,
    mutationProps: { onSuccess: invalidateSessions },
  });

  const createSession = React.useCallback(
    (roomId, attributes = {}, config = {}) =>
      createMutation.mutateAsync({
        url: `/user/chat/rooms/${roomId}/bookings`,
        attributes,
        config,
      }),
    [createMutation],
  );

  const rescheduleSession = React.useCallback(
    (sessionId, attributes = {}, config = {}) =>
      rescheduleMutation.mutateAsync({
        url: `/coach/sessions/${sessionId}/reschedule`,
        attributes,
        config,
      }),
    [rescheduleMutation],
  );

  const cancelSession = React.useCallback(
    (sessionId, attributes = {}, config = {}) =>
      cancelMutation.mutateAsync({
        url: `/coach/sessions/${sessionId}/cancel`,
        attributes,
        config,
      }),
    [cancelMutation],
  );

  const completeSession = React.useCallback(
    (sessionId, attributes = {}, config = {}) =>
      completeMutation.mutateAsync({
        url: `/coach/sessions/${sessionId}/complete`,
        attributes,
        config,
      }),
    [completeMutation],
  );

  return {
    createMutation,
    rescheduleMutation,
    cancelMutation,
    completeMutation,
    createSession,
    rescheduleSession,
    cancelSession,
    completeSession,
    isMutating:
      createMutation.isPending ||
      rescheduleMutation.isPending ||
      cancelMutation.isPending ||
      completeMutation.isPending,
  };
};

export default coachSessionsHooks;
