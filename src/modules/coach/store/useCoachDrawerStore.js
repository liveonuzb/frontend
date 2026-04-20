import { create } from "zustand";

export const useCoachDrawerStore = create((set, get) => ({
  drawers: {},

  isDrawerOpen: (drawerKey) => Boolean(get().drawers[drawerKey]?.isOpen),

  getDrawerPayload: (drawerKey) => get().drawers[drawerKey]?.payload ?? null,

  openDrawer: (drawerKey, payload = null) =>
    set((state) => ({
      drawers: {
        ...state.drawers,
        [drawerKey]: {
          isOpen: true,
          payload,
        },
      },
    })),

  closeDrawer: (drawerKey) =>
    set((state) => ({
      drawers: {
        ...state.drawers,
        [drawerKey]: {
          isOpen: false,
          payload: state.drawers[drawerKey]?.payload ?? null,
        },
      },
    })),

  setDrawerPayload: (drawerKey, payload = null) =>
    set((state) => ({
      drawers: {
        ...state.drawers,
        [drawerKey]: {
          isOpen: Boolean(state.drawers[drawerKey]?.isOpen),
          payload,
        },
      },
    })),

  toggleDrawer: (drawerKey, payload = null) => {
    const currentDrawer = get().drawers[drawerKey];

    if (currentDrawer?.isOpen) {
      get().closeDrawer(drawerKey);
      return;
    }

    get().openDrawer(drawerKey, payload);
  },

  resetDrawers: () => set({ drawers: {} }),
}));

export default useCoachDrawerStore;
