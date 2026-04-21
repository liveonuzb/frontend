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

const getDefaultTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Tashkent";
  } catch {
    return "Asia/Tashkent";
  }
};

export const useCoachDashboardStore = create(
  persist(
    (set) => ({
      widgetConfigs: DEFAULT_WIDGET_CONFIGS,
      isEditMode: false,
      timeRange: "30d",
      timezone: getDefaultTimezone(),
      chartPeriod: "month",

      setWidgetOrder: (newOrderIds) =>
        set((state) => {
          const newConfigs = map(
            newOrderIds,
            (id) =>
              find(state.widgetConfigs, (config) => config.id === id) || {
                id,
                size: "sm",
              },
          );
          return { widgetConfigs: newConfigs };
        }),

      updateWidgetSize: (id, size) =>
        set((state) => ({
          widgetConfigs: map(state.widgetConfigs, (config) =>
            config.id === id ? { ...config, size } : config,
          ),
        })),

      toggleEditMode: () =>
        set((state) => ({ isEditMode: !state.isEditMode })),

      setEditMode: (value) => set({ isEditMode: value }),

      setTimeRange: (timeRange) => set({ timeRange }),

      setTimezone: (timezone) => set({ timezone }),

      setChartPeriod: (chartPeriod) => set({ chartPeriod }),
    }),
    {
      name: "liveon-dashboard-storage-v6",
    },
  ),
);

export default useCoachDashboardStore;
