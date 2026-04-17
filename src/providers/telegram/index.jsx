import { useEffect } from "react";
import { useTelegram } from "@/hooks/use-telegram";

const TelegramProvider = ({ children }) => {
  const { tg, isTelegramWebApp } = useTelegram();

  useEffect(() => {
    if (!isTelegramWebApp) return;

    tg.ready();
    tg.expand();

    const colorScheme = tg.colorScheme;
    document.documentElement.classList.toggle("dark", colorScheme === "dark");
  }, [tg, isTelegramWebApp]);

  return children;
};

export default TelegramProvider;
