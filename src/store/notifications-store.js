import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { every, map, filter, union } from "lodash";

const areNotificationsEqual = (left = [], right = []) => {
  if (left === right) return true;
  if (left.length !== right.length) return false;

  return every(left, (item, index) => {
    const next = right[index];
    return (
      item?.id === next?.id &&
      item?.title === next?.title &&
      item?.message === next?.message &&
      item?.time === next?.time &&
      item?.read === next?.read &&
      item?.color === next?.color &&
      item?.icon === next?.icon &&
      item?.target === next?.target &&
      item?.category === next?.category
    );
  });
};

const useNotificationsStore = create()(
  persist(
    (set, get) => ({
      notifications: [],
      deletedIds: [],
      readIds: [],

      setInitialNotifications: (list) => {
        const { deletedIds, notifications, readIds } = get();
        const filtered = map(
          filter(list, (n) => !deletedIds.includes(n.id)),
          (n) => ({ ...n, read: readIds.includes(n.id) ? true : n.read }),
        );

        if (areNotificationsEqual(notifications, filtered)) {
          return;
        }

        set({ notifications: filtered });
      },

      markRead: (id) => {
        set((state) => ({
          notifications: map(state.notifications, (n) => n.id === id ? { ...n, read: true } : n),
          readIds: union(state.readIds, [id]),
        }));
      },

      markAllRead: () => {
        set((state) => ({
          notifications: map(state.notifications, (n) => ({ ...n, read: true })),
          readIds: union(state.readIds, map(state.notifications, (n) => n.id)),
        }));
      },

      deleteNotification: (id) => {
        set((state) => ({
          notifications: filter(state.notifications, (n) => n.id !== id),
          deletedIds: union(state.deletedIds, [id]),
        }));
      },

      getUnreadCount: () => filter(get().notifications, (n) => !n.read).length,
    }),
    {
      name: "notifications-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        deletedIds: state.deletedIds,
        readIds: state.readIds,
      }),
    },
  ),
);

export default useNotificationsStore;
