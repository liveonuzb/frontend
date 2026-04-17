import { useGetQuery, usePostQuery } from "@/hooks/api";
import { useQueryClient } from "@tanstack/react-query";
import { get } from "lodash";

export const COACHES_QUERY_KEY = ["user", "coaches"];
export const COACH_STATUS_QUERY_KEY = ["user", "coach-status"];
export const COACH_REQUESTS_QUERY_KEY = ["user", "coach", "requests"];

export const useCoaches = (options = {}) => {
  const queryClient = useQueryClient();
  const includeCoaches = options.includeCoaches ?? true;
  const includeStatus = options.includeStatus ?? true;
  const coachesParams = options.coachesParams ?? undefined;

  const { data: coachesData, ...coachesQuery } = useGetQuery({
    url: "/user/coaches",
    params: coachesParams,
    queryProps: {
      queryKey: [...COACHES_QUERY_KEY, coachesParams ?? {}],
      enabled: includeCoaches,
    },
  });

  const { data: statusData, ...statusQuery } = useGetQuery({
    url: "/user/coaches/status",
    queryProps: {
      queryKey: COACH_STATUS_QUERY_KEY,
      enabled: includeStatus,
    },
  });

  const { mutateAsync: requestCoach, isPending: isRequesting } = usePostQuery();
  const { mutateAsync: respondToInvitation, isPending: isResponding } = usePostQuery();

  const handleRequestCoach = async (coachId, notes) => {
    await requestCoach({
      url: `/user/coaches/${coachId}/request`,
      attributes: { notes },
    });
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: COACH_REQUESTS_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: COACH_STATUS_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: ["user", "coach-requests"] }),
    ]);
  };

  const handleRespond = async (invitationId, action, reason) => {
    await respondToInvitation({
      url: `/user/coaches/invitations/${invitationId}/respond`,
      attributes: { action, reason },
    });
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: COACH_STATUS_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: COACH_REQUESTS_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: ["coach-invitations"] }),
    ]);
  };

  const coachesPayload = get(coachesData, "data", []);
  const coaches = Array.isArray(coachesPayload)
    ? coachesPayload
    : Array.isArray(coachesPayload?.data)
      ? coachesPayload.data
      : [];
  const coachesMeta = Array.isArray(coachesPayload)
    ? {
        total: coaches.length,
        page: 1,
        pageSize: coaches.length || 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      }
    : {
        total: Number(coachesPayload?.meta?.total ?? coaches.length),
        page: Number(coachesPayload?.meta?.page ?? 1),
        pageSize: Number(coachesPayload?.meta?.pageSize ?? (coaches.length || 0)),
        totalPages: Number(coachesPayload?.meta?.totalPages ?? 1),
        hasNextPage: Boolean(coachesPayload?.meta?.hasNextPage),
        hasPrevPage: Boolean(coachesPayload?.meta?.hasPrevPage),
      };

  return {
    coaches: includeCoaches ? coaches : [],
    coachesMeta,
    status: includeStatus
      ? get(statusData, "data", { connected: false })
      : { connected: false },
    isLoading:
      (includeCoaches ? coachesQuery.isLoading : false) ||
      (includeStatus ? statusQuery.isLoading : false),
    requestCoach: handleRequestCoach,
    respondToInvitation: handleRespond,
    isRequesting,
    isResponding,
  };
};

export default useCoaches;
