import { map, find } from "lodash";
import { create } from "zustand";
import { persist } from "zustand/middleware";

const DEFAULT_WIDGET_CONFIGS = [
  { id: "calorie-gauge", size: "sm" },
  { id: "meals", size: "md" },
  { id: "water", size: "sm" },
  { id: "mood", size: "sm" },
  { id: "workout", size: "md" },
  { id: "weight", size: "sm" },
  { id: "bmi", size: "sm" },
  { id: "ai-tip", size: "md" },
];

const useDashboardStore = create(
  persist(
    (set) => ({
      widgetConfigs: DEFAULT_WIDGET_CONFIGS,
      isEditMode: false,

      setWidgetOrder: (newOrderIds) =>
        set((state) => {
          const newConfigs = map(newOrderIds,
            (id) =>
              find(state.widgetConfigs, (c) => c.id === id) || {
                id,
                size: "sm",
              },
          );
          return { widgetConfigs: newConfigs };
        }),

      updateWidgetSize: (id, size) =>
        set((state) => ({
          widgetConfigs: map(state.widgetConfigs, (c) =>
            c.id === id ? { ...c, size } : c,
          ),
        })),

      toggleEditMode: () => set((state) => ({ isEditMode: !state.isEditMode })),
      setEditMode: (val) => set({ isEditMode: val }),
    }),
    {
      name: "liveon-dashboard-storage-v6",
    },
  ),
);

export default useDashboardStore;
