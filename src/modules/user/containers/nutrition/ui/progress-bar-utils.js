import clamp from "lodash/clamp";
import round from "lodash/round";

export const getProgressPercent = (value, target) => {
  if (!target || target <= 0) {
    return 0;
  }

  return clamp(round((value / target) * 100), 0, 100);
};
