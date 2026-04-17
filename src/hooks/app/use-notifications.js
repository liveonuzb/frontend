import React from "react";
import { get } from "lodash";
import { useGetQuery, usePostQuery, usePatchQuery } from "@/hooks/api";

export const USER_NOTIFICATIONS_QUERY_KEY = ["me", "notifications"];
export const USER_NOTIFICATIONS_PREFS_KEY = [
  "me",
  "notifications",
  "preferences",
];
export const USER_NOTIFICATIONS_QUIET_KEY = [
  "me",
  "notifications",
  "quiet-hours",
];
export const COACH_NOTIFICATIONS_QUERY_KEY = ["coach", "notifications"];
export const COACH_NOTIFICATIONS_PREFS_KEY = [
  "coach",
  "notifications",
  "preferences",
];

const EMPTY_ITEMS = [];

export const useUserNotificationsFeed = (options = {}) => {
  const enabled = options.enabled ?? true;
  const category = options.category;
  const filter = options.filter;
  const [cursor, setCursor] = React.useState(null);

  const params = React.useMemo(() => {
    const p = {};
    if (category) p.category = category;
    if (filter) p.filter = filter;
    if (cursor) p.cursor = cursor;
    return p;
  }, [category, filter, cursor]);

  const { data, ...query } = useGetQuery({
    url: "/users/me/notifications",
    params,
    queryProps: {
      queryKey: [...USER_NOTIFICATIONS_QUERY_KEY, params],
      enabled,
      refetchInterval: 15000,
      refetchOnWindowFocus: true,
    },
  });

  // Sync notifications on first load
  const syncMutation = usePostQuery({
    queryKey: USER_NOTIFICATIONS_QUERY_KEY,
  });

  React.useEffect(() => {
    if (enabled && !cursor) {
      syncMutation.mutate({
        url: "/users/me/notifications/sync",
        attributes: {},
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  const markReadMutation = usePostQuery({
    queryKey: USER_NOTIFICATIONS_QUERY_KEY,
  });

  const markAllReadMutation = usePostQuery({
    queryKey: USER_NOTIFICATIONS_QUERY_KEY,
  });

  const markNotificationRead = React.useCallback(
    async (notificationId) =>
      markReadMutation.mutateAsync({
        url: `/users/me/notifications/${encodeURIComponent(notificationId)}/read`,
        attributes: {},
      }),
    [markReadMutation],
  );

  const markAllNotificationsRead = React.useCallback(
    async () =>
      markAllReadMutation.mutateAsync({
        url: "/users/me/notifications/read-all",
        attributes: {},
      }),
    [markAllReadMutation],
  );

  const responseData = get(data, "data.data", {});

  const loadMore = React.useCallback(() => {
    if (responseData.nextCursor) {
      setCursor(responseData.nextCursor);
    }
  }, [responseData.nextCursor]);

  const resetPagination = React.useCallback(() => {
    setCursor(null);
  }, []);

  return {
    ...query,
    items: get(responseData, "items", EMPTY_ITEMS),
    hasMore: responseData.hasMore ?? false,
    nextCursor: responseData.nextCursor ?? null,
    unreadCount: responseData.unreadCount ?? 0,
    loadMore,
    resetPagination,
    markNotificationRead,
    markAllNotificationsRead,
    isUpdatingNotificationState:
      markReadMutation.isPending || markAllReadMutation.isPending,
  };
};

export const useNotificationPreferences = (options = {}) => {
  const enabled = options.enabled ?? true;
  const { data, ...query } = useGetQuery({
    url: "/users/me/notifications/preferences",
    queryProps: {
      queryKey: USER_NOTIFICATIONS_PREFS_KEY,
      enabled,
    },
  });

  const updateMutation = usePatchQuery({
    queryKey: USER_NOTIFICATIONS_PREFS_KEY,
  });

  const updatePreferences = React.useCallback(
    async (preferences) =>
      updateMutation.mutateAsync({
        url: "/users/me/notifications/preferences",
        attributes: { preferences },
      }),
    [updateMutation],
  );

  return {
    ...query,
    preferences: get(data, "data.data", []),
    updatePreferences,
    isUpdating: updateMutation.isPending,
  };
};

export const useQuietHours = (options = {}) => {
  const enabled = options.enabled ?? true;
  const { data, ...query } = useGetQuery({
    url: "/users/me/notifications/quiet-hours",
    queryProps: {
      queryKey: USER_NOTIFICATIONS_QUIET_KEY,
      enabled,
    },
  });

  const updateMutation = usePatchQuery({
    queryKey: USER_NOTIFICATIONS_QUIET_KEY,
  });

  const updateQuietHours = React.useCallback(
    async (quietHoursData) =>
      updateMutation.mutateAsync({
        url: "/users/me/notifications/quiet-hours",
        attributes: quietHoursData,
      }),
    [updateMutation],
  );

  return {
    ...query,
    quietHours: get(data, "data.data", {
      enabled: false,
      start: "22:00",
      end: "08:00",
    }),
    updateQuietHours,
    isUpdating: updateMutation.isPending,
  };
};

export const useCoachNotificationsFeed = (options = {}) => {
  const enabled = options.enabled ?? true;
  const status = options.status ?? "all";
  const limit = options.limit ?? 20;
  const [page, setPage] = React.useState(1);
  const [items, setItems] = React.useState(EMPTY_ITEMS);
  const params = React.useMemo(
    () => ({
      status,
      page,
      limit,
    }),
    [limit, page, status],
  );
  const { data, ...query } = useGetQuery({
    url: "/coach/notifications",
    params,
    queryProps: {
      queryKey: [...COACH_NOTIFICATIONS_QUERY_KEY, params],
      enabled,
      refetchInterval: 15000,
      refetchOnWindowFocus: true,
    },
  });
  const responseData = get(data, "data.data", {});
  const pageItems = get(responseData, "items", EMPTY_ITEMS);
  const meta = get(responseData, "meta", {});
  const hasMore = Number(meta.page || page) < Number(meta.totalPages || 0);

  React.useEffect(() => {
    setPage(1);
    setItems(EMPTY_ITEMS);
  }, [limit, status]);

  React.useEffect(() => {
    if (!enabled || !Array.isArray(pageItems)) {
      return;
    }

    setItems((currentItems) => {
      if (page <= 1) {
        return pageItems;
      }

      const byId = new Map(currentItems.map((item) => [item.id, item]));
      pageItems.forEach((item) => {
        if (item?.id) {
          byId.set(item.id, item);
        }
      });
      return Array.from(byId.values());
    });
  }, [enabled, page, pageItems]);

  const markReadMutation = usePostQuery({
    queryKey: COACH_NOTIFICATIONS_QUERY_KEY,
  });

  const markAllReadMutation = usePostQuery({
    queryKey: COACH_NOTIFICATIONS_QUERY_KEY,
  });

  const markNotificationRead = React.useCallback(
    async (notificationId) =>
      markReadMutation.mutateAsync({
        url: `/coach/notifications/${encodeURIComponent(notificationId)}/read`,
        attributes: {},
      }),
    [markReadMutation],
  );

  const markAllNotificationsRead = React.useCallback(
    async () =>
      markAllReadMutation.mutateAsync({
        url: "/coach/notifications/read-all",
        attributes: {},
      }),
    [markAllReadMutation],
  );

  const loadMore = React.useCallback(() => {
    if (hasMore) {
      setPage((currentPage) => currentPage + 1);
    }
  }, [hasMore]);

  const resetPagination = React.useCallback(() => {
    setPage(1);
    setItems(EMPTY_ITEMS);
  }, []);

  return {
    ...query,
    items,
    meta,
    digest: get(responseData, "digest", null),
    hasMore,
    unreadCount: Number(meta.unread ?? 0),
    loadMore,
    resetPagination,
    markNotificationRead,
    markAllNotificationsRead,
    isUpdatingNotificationState:
      markReadMutation.isPending || markAllReadMutation.isPending,
  };
};

export const useCoachNotificationPreferences = (options = {}) => {
  const enabled = options.enabled ?? true;
  const { data, ...query } = useGetQuery({
    url: "/coach/notifications/preferences",
    queryProps: {
      queryKey: COACH_NOTIFICATIONS_PREFS_KEY,
      enabled,
    },
  });

  const updateMutation = usePatchQuery({
    queryKey: COACH_NOTIFICATIONS_PREFS_KEY,
  });

  const updatePreferences = React.useCallback(
    async (preferences) =>
      updateMutation.mutateAsync({
        url: "/coach/notifications/preferences",
        attributes: { preferences },
      }),
    [updateMutation],
  );

  return {
    ...query,
    preferences: get(data, "data.data", EMPTY_ITEMS),
    updatePreferences,
    isUpdating: updateMutation.isPending,
  };
};
