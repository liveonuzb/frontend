import { useCallback, useEffect, useRef, useState } from "react";
import { useTelegram } from "@/hooks/use-telegram";
import { useAuthStore } from "@/store";
import { api } from "@/hooks/api/use-api";

export function useTelegramAuth() {
  const { isTelegramWebApp, initData } = useTelegram();
  const { isAuthenticated, completeAuthentication } = useAuthStore();
  const attemptedRef = useRef(false);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const retry = useCallback(() => {
    attemptedRef.current = false;
    setError(null);
    setAttempt((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!isTelegramWebApp || isAuthenticated || attemptedRef.current) {
      setIsLoading(false);
      return;
    }

    attemptedRef.current = true;
    setIsLoading(true);
    setError(null);

    api
      .post("/auth/login/telegram", { initData })
      .then(({ data }) => {
        completeAuthentication(data);
      })
      .catch((error) => {
        console.error("Telegram auth failed:", error);
        setError(error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [
    attempt,
    isTelegramWebApp,
    initData,
    isAuthenticated,
    completeAuthentication,
  ]);

  return {
    isTelegramAuthLoading: isTelegramWebApp && !isAuthenticated && isLoading,
    telegramAuthError: isTelegramWebApp && !isAuthenticated ? error : null,
    retryTelegramAuth: retry,
  };
}
