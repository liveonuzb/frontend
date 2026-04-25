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
      mode: null, // "focus" | "zen" | "madagascar" | null
      setMode: (mode) => set({ mode }),
      resetMode: () => set({ mode: null }),
    }),
    {
      name: "app-mode-storage",
    },
  ),
);

export default useAppModeStore;
