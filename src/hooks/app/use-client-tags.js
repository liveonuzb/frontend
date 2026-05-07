import React from "react";
import { filter, get, includes, map, uniqBy } from "lodash";
import { useQueryClient } from "@tanstack/react-query";
import { useGetQuery, usePatchQuery, usePostQuery } from "@/hooks/api";
import {
  COACH_CLIENTS_QUERY_KEY,
  COACH_CLIENT_DETAIL_QUERY_KEY,
  COACH_CLIENT_SUMMARY_QUERY_KEY,
} from "./use-coach-query-keys";

const COACH_CLIENT_TAGS_QUERY_KEY = ["coach", "client-tags"];

const PREDEFINED_TAGS = [
  { id: "beginner", label: "Boshlang'ich", color: "bg-blue-500/10 text-blue-700 border-blue-500/20" },
  { id: "advanced", label: "Ilg'or", color: "bg-violet-500/10 text-violet-700 border-violet-500/20" },
  { id: "weight-loss", label: "Vazn yo'qotish", color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" },
  { id: "muscle-gain", label: "Massa yig'ish", color: "bg-orange-500/10 text-orange-700 border-orange-500/20" },
  { id: "maintenance", label: "Saqlash", color: "bg-amber-500/10 text-amber-700 border-amber-500/20" },
  { id: "rehabilitation", label: "Reabilitatsiya", color: "bg-rose-500/10 text-rose-700 border-rose-500/20" },
  { id: "vip", label: "VIP", color: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20" },
  { id: "online", label: "Online", color: "bg-cyan-500/10 text-cyan-700 border-cyan-500/20" },
  { id: "offline", label: "Offline", color: "bg-slate-500/10 text-slate-700 border-slate-500/20" },
];

const normalizeTagIds = (client) => {
  const tagIds = get(client, "tagIds");
  if (Array.isArray(tagIds)) return tagIds;

  const tags = get(client, "tags");
  if (!Array.isArray(tags)) return [];

  return map(tags, (tag) => get(tag, "id") || get(tag, "slug")).filter(Boolean);
};

const resolveAvailableTags = (tagsData) => {
  const serverTags = get(tagsData, "data.data.items", get(tagsData, "data.items", []));
  return uniqBy(
    [
      ...(Array.isArray(serverTags) ? serverTags : []),
      ...PREDEFINED_TAGS.map((tag) => ({ ...tag, slug: tag.id, isDefault: true })),
    ],
    (tag) => get(tag, "id") || get(tag, "slug"),
  );
};

export const useClientTagCatalog = () => {
  const { data: tagsData } = useGetQuery({
    url: "/coach/clients/tags",
    queryProps: {
      queryKey: COACH_CLIENT_TAGS_QUERY_KEY,
    },
  });
  return React.useMemo(() => resolveAvailableTags(tagsData), [tagsData]);
};

export const useClientTags = (clients = []) => {
  const queryClient = useQueryClient();
  const availableTags = useClientTagCatalog();
  const updateTagsMutation = usePatchQuery({
    queryKey: COACH_CLIENTS_QUERY_KEY,
    mutationProps: {
      onSuccess: async (_data, variables) => {
        const clientId = variables?.url?.split("/").at(-2);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: COACH_CLIENTS_QUERY_KEY }),
          clientId
            ? queryClient.invalidateQueries({
                queryKey: [...COACH_CLIENT_DETAIL_QUERY_KEY, clientId],
              })
            : Promise.resolve(),
          clientId
            ? queryClient.invalidateQueries({
                queryKey: [...COACH_CLIENT_SUMMARY_QUERY_KEY, clientId],
              })
            : Promise.resolve(),
        ]);
      },
    },
  });
  const createTagMutation = usePostQuery({
    queryKey: COACH_CLIENT_TAGS_QUERY_KEY,
    mutationProps: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: COACH_CLIENT_TAGS_QUERY_KEY,
        });
      },
    },
  });
  const tagsMap = React.useMemo(() => {
    return clients.reduce((acc, client) => {
      const clientId = get(client, "id");
      if (!clientId) return acc;
      acc[clientId] = normalizeTagIds(client);
      return acc;
    }, {});
  }, [clients]);

  const getClientTags = React.useCallback(
    (clientId) => tagsMap[clientId] || [],
    [tagsMap],
  );

  const saveClientTags = React.useCallback(
    async (clientId, tagIds) =>
      updateTagsMutation.mutateAsync({
        url: `/coach/clients/${clientId}/tags`,
        attributes: { tagIds },
      }),
    [updateTagsMutation],
  );

  const addTag = React.useCallback(
    async (clientId, tagId) => {
      const current = tagsMap[clientId] || [];
      if (includes(current, tagId)) return;
      await saveClientTags(clientId, [...current, tagId]);
    },
    [saveClientTags, tagsMap],
  );

  const removeTag = React.useCallback(
    async (clientId, tagId) => {
      const current = tagsMap[clientId] || [];
      await saveClientTags(clientId, filter(current, (t) => t !== tagId));
    },
    [saveClientTags, tagsMap],
  );

  const toggleTag = React.useCallback(
    async (clientId, tagId) => {
      const current = tagsMap[clientId] || [];
      const updated = includes(current, tagId)
        ? filter(current, (t) => t !== tagId)
        : [...current, tagId];
      await saveClientTags(clientId, updated);
    },
    [saveClientTags, tagsMap],
  );

  const clearClientTags = React.useCallback(
    async (clientId) => {
      await saveClientTags(clientId, []);
    },
    [saveClientTags],
  );

  const createTag = React.useCallback(
    async (payload) =>
      createTagMutation.mutateAsync({
        url: "/coach/clients/tags",
        attributes: payload,
      }),
    [createTagMutation],
  );

  return {
    getClientTags,
    addTag,
    removeTag,
    toggleTag,
    clearClientTags,
    createTag,
    predefinedTags: availableTags,
    availableTags,
    isUpdatingTags: updateTagsMutation.isPending,
    isCreatingTag: createTagMutation.isPending,
  };
};

export { PREDEFINED_TAGS };
