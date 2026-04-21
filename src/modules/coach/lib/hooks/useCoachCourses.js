import coachCoursesApi, {
  DETAIL_QUERY_KEY,
  LIST_QUERY_KEY,
} from "../api/coach-courses-api";
import { createCoachResourceHooks } from "./create-coach-resource-hooks";
import { usePatchQuery } from "@/hooks/api";

const coachCoursesHooks = createCoachResourceHooks({
  baseUrl: coachCoursesApi.baseUrl,
  listQueryKey: LIST_QUERY_KEY,
  detailQueryKey: DETAIL_QUERY_KEY,
});

export const useCoachCourses = coachCoursesHooks.useList;
export const useCoachCourse = coachCoursesHooks.useDetail;

export const useCoachCoursesMutations = (options = {}) => {
  const baseMutations = coachCoursesHooks.useMutations(options);
  const publishMutation = usePatchQuery({
    queryKey: LIST_QUERY_KEY,
    mutationProps: options.publishMutationProps,
  });
  const unpublishMutation = usePatchQuery({
    queryKey: LIST_QUERY_KEY,
    mutationProps: options.unpublishMutationProps,
  });
  const connectGroupMutation = usePatchQuery({
    queryKey: LIST_QUERY_KEY,
    mutationProps: options.connectGroupMutationProps,
  });
  const disconnectGroupMutation = usePatchQuery({
    queryKey: LIST_QUERY_KEY,
    mutationProps: options.disconnectGroupMutationProps,
  });
  const refreshGroupMutation = usePatchQuery({
    queryKey: LIST_QUERY_KEY,
    mutationProps: options.refreshGroupMutationProps,
  });

  return {
    ...baseMutations,
    publishMutation,
    unpublishMutation,
    connectGroupMutation,
    disconnectGroupMutation,
    refreshGroupMutation,
    publishCourse: (id, config = {}) =>
      publishMutation.mutateAsync({
        url: `/coach/courses/${id}/publish`,
        attributes: {},
        config,
      }),
    unpublishCourse: (id, config = {}) =>
      unpublishMutation.mutateAsync({
        url: `/coach/courses/${id}/unpublish`,
        attributes: {},
        config,
      }),
    connectCourseGroup: (id, attributes = {}, config = {}) =>
      connectGroupMutation.mutateAsync({
        url: `/coach/courses/${id}/group/connect`,
        attributes,
        config,
      }),
    disconnectCourseGroup: (id, attributes = {}, config = {}) =>
      disconnectGroupMutation.mutateAsync({
        url: `/coach/courses/${id}/group/disconnect`,
        attributes,
        config,
      }),
    refreshCourseGroupAdmin: (id, config = {}) =>
      refreshGroupMutation.mutateAsync({
        url: `/coach/courses/${id}/group/refresh`,
        attributes: {},
        config,
      }),
  };
};

export default coachCoursesHooks;
