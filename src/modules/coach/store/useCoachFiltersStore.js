import { create } from "zustand";

const resolveNextFilters = (currentFilters, nextFilters) =>
  typeof nextFilters === "function"
    ? nextFilters(currentFilters)
    : { ...currentFilters, ...nextFilters };

export const useCoachFiltersStore = create((set, get) => ({
  filters: {},

  getFilters: (resourceKey) => get().filters[resourceKey] || {},

  setFilters: (resourceKey, nextFilters = {}) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [resourceKey]: resolveNextFilters(
          state.filters[resourceKey] || {},
          nextFilters,
        ),
      },
    })),

  patchFilters: (resourceKey, patch = {}) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [resourceKey]: {
          ...(state.filters[resourceKey] || {}),
          ...patch,
        },
      },
    })),

  resetFilters: (resourceKey) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [resourceKey]: {},
      },
    })),

  resetAllFilters: () => set({ filters: {} }),
}));

export default useCoachFiltersStore;
