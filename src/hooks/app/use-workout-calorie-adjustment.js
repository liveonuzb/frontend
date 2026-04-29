import React from "react";

const STORAGE_KEY = "liveon:nutrition:workout-calorie-adjustment-enabled:v1";

const readPreference = () => {
  if (typeof window === "undefined") {
    return true;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === null ? true : stored === "true";
};

export const useWorkoutCalorieAdjustmentPreference = () => {
  const [enabled, setEnabledState] = React.useState(readPreference);

  const setEnabled = React.useCallback((nextValue) => {
    const normalized = Boolean(nextValue);
    setEnabledState(normalized);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, String(normalized));
    }
  }, []);

  return {
    enabled,
    setEnabled,
  };
};

export default useWorkoutCalorieAdjustmentPreference;
