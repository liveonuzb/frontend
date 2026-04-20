import { create } from "zustand";

const getSelectionMap = (state, resourceKey) => state.selections[resourceKey] || {};

const normalizeSelectedIds = (selectedIds = []) =>
  selectedIds.reduce((acc, id) => {
    if (id !== undefined && id !== null && id !== "") {
      acc[id] = true;
    }
    return acc;
  }, {});

export const useCoachSelectionStore = create((set, get) => ({
  selections: {},

  getSelectedIds: (resourceKey) => {
    const selectionMap = getSelectionMap(get(), resourceKey);
    return Object.keys(selectionMap).filter((id) => selectionMap[id]);
  },

  setSelectedIds: (resourceKey, selectedIds = []) =>
    set((state) => ({
      selections: {
        ...state.selections,
        [resourceKey]: normalizeSelectedIds(selectedIds),
      },
    })),

  toggleSelectedId: (resourceKey, selectedId) =>
    set((state) => {
      const currentSelection = getSelectionMap(state, resourceKey);
      const isSelected = Boolean(currentSelection[selectedId]);

      if (isSelected) {
        const restSelection = { ...currentSelection };
        delete restSelection[selectedId];
        return {
          selections: {
            ...state.selections,
            [resourceKey]: restSelection,
          },
        };
      }

      return {
        selections: {
          ...state.selections,
          [resourceKey]: {
            ...currentSelection,
            [selectedId]: true,
          },
        },
      };
    }),

  clearSelection: (resourceKey) =>
    set((state) => ({
      selections: {
        ...state.selections,
        [resourceKey]: {},
      },
    })),

  clearAllSelections: () => set({ selections: {} }),
}));

export default useCoachSelectionStore;
