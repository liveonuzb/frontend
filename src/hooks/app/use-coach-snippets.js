import { get } from "lodash";
import { useQueryClient } from "@tanstack/react-query";
import {
  useDeleteQuery,
  useGetQuery,
  usePatchQuery,
  usePostQuery,
} from "@/hooks/api";
import { COACH_SNIPPETS_QUERY_KEY } from "./use-coach-query-keys";

export const useCoachSnippets = () => {
  const queryClient = useQueryClient();
  const { data, ...query } = useGetQuery({
    url: "/coach/snippets",
    queryProps: {
      queryKey: COACH_SNIPPETS_QUERY_KEY,
    },
  });

  const invalidateSnippets = async () => {
    await queryClient.invalidateQueries({ queryKey: COACH_SNIPPETS_QUERY_KEY });
  };

  const createMutation = usePostQuery({
    queryKey: COACH_SNIPPETS_QUERY_KEY,
    mutationProps: {
      onSuccess: invalidateSnippets,
    },
  });

  const updateMutation = usePatchQuery({
    queryKey: COACH_SNIPPETS_QUERY_KEY,
    mutationProps: {
      onSuccess: invalidateSnippets,
    },
  });

  const deleteMutation = useDeleteQuery({
    queryKey: COACH_SNIPPETS_QUERY_KEY,
    mutationProps: {
      onSuccess: invalidateSnippets,
    },
  });

  return {
    ...query,
    snippets: get(data, "data.data.items", []),
    createSnippet: (payload) =>
      createMutation.mutateAsync({
        url: "/coach/snippets",
        attributes: payload,
      }),
    updateSnippet: (templateId, payload) =>
      updateMutation.mutateAsync({
        url: `/coach/snippets/${templateId}`,
        attributes: payload,
      }),
    deleteSnippet: (templateId) =>
      deleteMutation.mutateAsync({
        url: `/coach/snippets/${templateId}`,
      }),
    isCreatingSnippet: createMutation.isPending,
    isUpdatingSnippet: updateMutation.isPending,
    isDeletingSnippet: deleteMutation.isPending,
  };
};
