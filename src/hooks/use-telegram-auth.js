import { useCallback, useEffect, useRef, useState } from "react";
import { useTelegram } from "@/hooks/use-telegram";
import { useAuthStore } from "@/store";
import { api } from "@/hooks/api/use-api";
import { getAuthResponseData } from "@/modules/auth/lib/auth-utils.js";
import {
  rememberTelegramCampaignAttribution,
  trackLaunchEvent,
} from "@/lib/analytics.js";
import { buildTelegramAttributionProperties } from "@/lib/telegram-start-param.js";

export function useTelegramAuth() {
  const { isTelegramWebApp, initData, startParam } = useTelegram();
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
      .then((response) => {
        completeAuthentication(getAuthResponseData(response));
        rememberTelegramCampaignAttribution(startParam);
        void trackLaunchEvent("telegram_miniapp_opened", {
          source: "telegram",
          properties: buildTelegramAttributionProperties(startParam),
        });
      })
      .catch((error) => {
        setError(error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [
    attempt,
    isTelegramWebApp,
    initData,
    startParam,
    isAuthenticated,
    completeAuthentication,
  ]);

  return {
    isTelegramAuthLoading: isTelegramWebApp && !isAuthenticated && isLoading,
    telegramAuthError: isTelegramWebApp && !isAuthenticated ? error : null,
    retryTelegramAuth: retry,
  };
}
