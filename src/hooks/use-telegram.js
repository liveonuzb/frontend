import { useMemo } from "react";
import get from "lodash/get";

export function useTelegram() {
  const tg = window.Telegram?.WebApp;

  const isTelegramWebApp = useMemo(() => {
    return Boolean(tg?.initData && tg.initData.length > 0);
  }, [tg]);

  return {
    tg,
    isTelegramWebApp,
    initData: get(tg, "initData") || null,
    startParam: get(tg, "initDataUnsafe.start_param") || null,
    user: get(tg, "initDataUnsafe.user") || null,
    colorScheme: get(tg, "colorScheme") || "light",
  };
}
