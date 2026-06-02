import get from "lodash/get";

const NOTIFICATION_TYPES = new Set(["success", "warning", "error"]);

export const triggerTelegramHapticFeedback = (
  type = "impact",
  impactStyle = "light",
) => {
  const haptics = get(window, "Telegram.WebApp.HapticFeedback");

  if (!haptics) {
    return false;
  }

  if (NOTIFICATION_TYPES.has(type)) {
    haptics.notificationOccurred?.(type);
    return true;
  }

  if (type === "selection") {
    haptics.selectionChanged?.();
    return true;
  }

  haptics.impactOccurred?.(impactStyle);
  return true;
};
