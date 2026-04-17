import { useMemo } from "react";

export function useTelegram() {
  const tg = window.Telegram?.WebApp;

  const isTelegramWebApp = useMemo(() => {
    return Boolean(tg?.initData && tg.initData.length > 0);
  }, [tg]);

  return {
    tg,
    isTelegramWebApp,
    initData: tg?.initData || null,
    user: tg?.initDataUnsafe?.user || null,
    colorScheme: tg?.colorScheme || "light",
  };
}
