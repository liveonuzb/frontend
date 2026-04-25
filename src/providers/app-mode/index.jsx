import React from "react";
import { useAppModeStore, APP_MODES } from "@/store";

/**
 * Syncs the selected app mode to a `data-app-mode` attribute on <html>
 * so CSS can switch the shadcn color palette per mode.
 *
 *  - `focus`      → shadcn default neutral palette (clean, minimal)
 *  - `zen`        → soft sage green palette (calm, nature-inspired)
 *  - `madagascar` → warm orange palette (wild, energetic — site default)
 *  - no mode yet  → falls back to Madagascar (site default)
 */
const AppModeProvider = ({ children }) => {
  const mode = useAppModeStore((state) => state.mode);

  React.useEffect(() => {
    const root = document.documentElement;
    const resolved =
      mode === APP_MODES.FOCUS
        ? "focus"
        : mode === APP_MODES.ZEN
          ? "zen"
          : "madagascar";
    root.dataset.appMode = resolved;

    return () => {
      delete root.dataset.appMode;
    };
  }, [mode]);

  return children;
};

export default AppModeProvider;
