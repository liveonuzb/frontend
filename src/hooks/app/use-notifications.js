import React from "react";
import get from "lodash/get";
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
const EMPTY_ITEMS = [];

export const useUserNotificationsFeed = (options = {}) => {
  const enabled = options.enabled ?? true;
  const category = options.category;
  const filter = options.filter ?? "unread";
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
