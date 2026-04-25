import React from "react";
import { APP_MODES, useAppModeStore } from "@/store";

const MODE_DATASET_MAP = {
  [APP_MODES.FOCUS]: "focus",
  [APP_MODES.ZEN]: "zen",
  [APP_MODES.MADAGASCAR]: "madagascar",
};

const DEFAULT_APP_MODE = APP_MODES.FOCUS;

const AppModeProvider = ({ children }) => {
  const mode = useAppModeStore((state) => state.mode);

  React.useEffect(() => {
    const root = document.documentElement;

    root.dataset.appMode =
      MODE_DATASET_MAP[mode] ?? MODE_DATASET_MAP[DEFAULT_APP_MODE];

    return () => {
      delete root.dataset.appMode;
    };
  }, [mode]);

  return <>{children}</>;
};

export default AppModeProvider;
