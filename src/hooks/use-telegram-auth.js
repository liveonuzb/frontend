import { useEffect, useRef } from "react";
import { useTelegram } from "@/hooks/use-telegram";
import { useAuthStore } from "@/store";
import { api } from "@/hooks/api/use-api";

export function useTelegramAuth() {
  const { isTelegramWebApp, initData } = useTelegram();
  const { isAuthenticated, completeAuthentication } = useAuthStore();
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (!isTelegramWebApp || isAuthenticated || attemptedRef.current) return;
    attemptedRef.current = true;

    api
      .post("/auth/login/telegram", { initData })
      .then(({ data }) => {
        completeAuthentication(data);
      })
      .catch((error) => {
        console.error("Telegram auth failed:", error);
      });
  }, [isTelegramWebApp, initData, isAuthenticated, completeAuthentication]);
}
