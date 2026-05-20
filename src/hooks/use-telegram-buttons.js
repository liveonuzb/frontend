import { useEffect } from "react";
import { get } from "lodash";
import { useTelegram } from "@/hooks/use-telegram";

const getPrimaryTelegramButton = (tg) =>
  get(tg, "BottomButton") || get(tg, "MainButton");

const configureTelegramButton = (
  button,
  { text, isEnabled, isLoading, onClick },
) => {
  if (text) {
    button.setText?.(text);
  }

  if (isLoading) {
    button.showProgress?.();
  } else {
    button.hideProgress?.();
  }

  if (isEnabled) {
    button.enable?.();
  } else {
    button.disable?.();
  }

  button.show?.();

  if (onClick) {
    button.onClick?.(onClick);
  }
};

const cleanupTelegramButton = (button, onClick) => {
  if (onClick) {
    button.offClick?.(onClick);
  }

  button.hideProgress?.();
  button.hide?.();
};

const useTelegramButton = (button, options = {}) => {
  const {
    text,
    isVisible = true,
    isEnabled = true,
    isLoading = false,
    onClick,
  } = options;

  useEffect(() => {
    if (!button) {
      return undefined;
    }

    if (!isVisible) {
      cleanupTelegramButton(button, onClick);
      return undefined;
    }

    configureTelegramButton(button, {
      text,
      isEnabled,
      isLoading,
      onClick,
    });

    return () => cleanupTelegramButton(button, onClick);
  }, [button, text, isVisible, isEnabled, isLoading, onClick]);
};

export const useTelegramMainButton = (options) => {
  const { tg, isTelegramWebApp } = useTelegram();
  const button = isTelegramWebApp ? getPrimaryTelegramButton(tg) : null;

  useTelegramButton(button, options);
};

export const useTelegramSecondaryButton = (options) => {
  const { tg, isTelegramWebApp } = useTelegram();
  const button = isTelegramWebApp ? get(tg, "SecondaryButton") : null;

  useTelegramButton(button, options);
};
