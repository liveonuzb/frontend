import { useAppModeStore } from "@/store";
import { getAppModeTheme } from "@/lib/app-mode-theme";

/**
 * Returns the visual theme tokens for the currently selected app mode.
 * Falls back to the Zen theme when no mode has been chosen yet.
 */
const useAppModeTheme = () => {
  const mode = useAppModeStore((state) => state.mode);
  return getAppModeTheme(mode);
};

export default useAppModeTheme;
