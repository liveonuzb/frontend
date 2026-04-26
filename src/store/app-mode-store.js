import { create } from "zustand";
import { persist } from "zustand/middleware";

export const APP_MODES = {
  FOCUS: "focus",
  ZEN: "zen",
  MADAGASCAR: "madagascar",
};

const useAppModeStore = create()(
  persist(
    (set) => ({
      mode: APP_MODES.MADAGASCAR,
      setMode: (mode) => set({ mode }),
      resetMode: () => set({ mode: APP_MODES.MADAGASCAR }),
    }),
    {
      name: "app-mode-storage",
    },
  ),
);

export default useAppModeStore;
