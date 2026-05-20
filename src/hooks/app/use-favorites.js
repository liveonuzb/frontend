import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetQuery } from "@/hooks/api";
import useApi from "@/hooks/api/use-api";

import { map } from "lodash";

const FAVORITES_KEY = ["me", "favorites"];

export const useFavorites = (entityType) => {
  const params = entityType ? { type: entityType } : {};
  const { data, isLoading, refetch } = useGetQuery({
    url: "/users/me/favorites",
    params,
    queryProps: { queryKey: [...FAVORITES_KEY, entityType ?? "all"] },
  });

  const items = React.useMemo(() => data?.data?.items ?? [], [data]);
  const favoriteIds = React.useMemo(
    () => new Set(map(items, (f) => String(f.entityId))),
    [items],
  );

  return { items, favoriteIds, isLoading, refetch };
};

export const useFavoriteActions = (entityType) => {
  const { request } = useApi();
  const queryClient = useQueryClient();
  const [pendingEntityId, setPendingEntityId] = React.useState(null);

  const invalidateFavorites = React.useCallback(
    (entityId) => {
      queryClient.invalidateQueries({ queryKey: [...FAVORITES_KEY, entityType] });
      queryClient.invalidateQueries({ queryKey: [...FAVORITES_KEY, "all"] });
      queryClient.invalidateQueries({
        queryKey: [...FAVORITES_KEY, "check", entityType, entityId],
      });
    },
    [entityType, queryClient],
  );

  const toggleFavorite = React.useCallback(
    async (entityId, isFavorite) => {
      const normalizedEntityId = String(entityId || "");

      if (!entityType || !normalizedEntityId || pendingEntityId) {
        return;
      }

      setPendingEntityId(normalizedEntityId);

      try {
        if (isFavorite) {
          await request.delete(`/users/me/favorites/${entityType}/${normalizedEntityId}`);
        } else {
          await request.post("/users/me/favorites", {
            entityType,
            entityId: normalizedEntityId,
          });
        }

        invalidateFavorites(normalizedEntityId);
      } finally {
        setPendingEntityId(null);
      }
    },
    [entityType, invalidateFavorites, pendingEntityId, request],
  );

  const isPendingFor = React.useCallback(
    (entityId) => pendingEntityId === String(entityId || ""),
    [pendingEntityId],
  );

  return {
    toggleFavorite,
    isPendingFor,
  };
};

export const useFavoriteToggle = (entityType, entityId) => {
  const { request } = useApi();
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = React.useState(false);

  const { data: checkData, isLoading: isChecking } = useGetQuery({
    url: `/users/me/favorites/${entityType}/${entityId}/check`,
    queryProps: {
      queryKey: [...FAVORITES_KEY, "check", entityType, entityId],
      enabled: Boolean(entityType) && Boolean(entityId),
    },
  });

  const isFavorite = checkData?.data?.isFavorite ?? false;

  const toggle = React.useCallback(async () => {
    if (isPending) return;
    setIsPending(true);
    try {
      if (isFavorite) {
        await request.delete(`/users/me/favorites/${entityType}/${entityId}`);
      } else {
        await request.post("/users/me/favorites", { entityType, entityId });
      }
      queryClient.invalidateQueries({ queryKey: [...FAVORITES_KEY, "check", entityType, entityId] });
      queryClient.invalidateQueries({ queryKey: [...FAVORITES_KEY, entityType] });
      queryClient.invalidateQueries({ queryKey: [...FAVORITES_KEY, "all"] });
    } finally {
      setIsPending(false);
    }
  }, [isPending, isFavorite, entityType, entityId, request, queryClient]);

  return { isFavorite, isPending: isPending || isChecking, toggle };
};
