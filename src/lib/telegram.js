import forEach from "lodash/forEach";
import get from "lodash/get";
import isFiniteNumber from "lodash/isFinite";
import isString from "lodash/isString";
import toNumber from "lodash/toNumber";

const FALLBACK_TELEGRAM_CHROME_COLOR = "#0b0f0c";
const HEX_COLOR_PATTERN = /^#[0-9a-f]{3,8}$/i;
const TELEGRAM_THEME_VARIABLES = [
  ["bg_color", "--tg-theme-bg-color"],
  ["text_color", "--tg-theme-text-color"],
  ["hint_color", "--tg-theme-hint-color"],
  ["link_color", "--tg-theme-link-color"],
  ["button_color", "--tg-theme-button-color"],
  ["button_text_color", "--tg-theme-button-text-color"],
  ["secondary_bg_color", "--tg-theme-secondary-bg-color"],
  ["header_bg_color", "--tg-theme-header-bg-color"],
  ["section_bg_color", "--tg-theme-section-bg-color"],
  ["section_separator_color", "--tg-theme-section-separator-color"],
];
const APP_THEME_VARIABLES = [
  ["bg_color", "--background"],
  ["text_color", "--foreground"],
  ["secondary_bg_color", "--card"],
  ["text_color", "--card-foreground"],
  ["secondary_bg_color", "--popover"],
  ["text_color", "--popover-foreground"],
  ["secondary_bg_color", "--muted"],
  ["hint_color", "--muted-foreground"],
  ["button_color", "--primary"],
  ["button_text_color", "--primary-foreground"],
  ["section_separator_color", "--border"],
  ["section_separator_color", "--input"],
  ["button_color", "--ring"],
];
const INSET_KEYS = ["top", "right", "bottom", "left"];

export const getTelegramWebApp = () => get(window, "Telegram.WebApp", null);
export const tg = getTelegramWebApp();

const readTelegramColor = (themeParams, key) => {
  const value = get(themeParams, key);
  const normalized = isString(value) ? value.trim() : "";

  return HEX_COLOR_PATTERN.test(normalized) ? normalized : null;
};

const setStyleColor = (style, name, value) => {
  if (value) {
    style.setProperty(name, value);
  }
};

const setStylePx = (style, name, value) => {
  const numericValue = toNumber(value);

  if (isFiniteNumber(numericValue)) {
    style.setProperty(name, `${numericValue}px`);
  }
};

const applyTelegramTheme = (webApp) => {
  const root = document.documentElement;
  const style = root.style;
  const themeParams = get(webApp, "themeParams", {});

  root.classList.toggle("dark", get(webApp, "colorScheme") === "dark");

  forEach(TELEGRAM_THEME_VARIABLES, ([key, cssVariable]) => {
    setStyleColor(style, cssVariable, readTelegramColor(themeParams, key));
  });

  forEach(APP_THEME_VARIABLES, ([key, cssVariable]) => {
    setStyleColor(style, cssVariable, readTelegramColor(themeParams, key));
  });

  const backgroundColor =
    readTelegramColor(themeParams, "bg_color") ||
    readTelegramColor(themeParams, "secondary_bg_color") ||
    FALLBACK_TELEGRAM_CHROME_COLOR;
  const headerColor =
    readTelegramColor(themeParams, "header_bg_color") || backgroundColor;

  webApp.setHeaderColor?.(headerColor);
  webApp.setBackgroundColor?.(backgroundColor);
};

const applyTelegramViewport = (webApp) => {
  const style = document.documentElement.style;
  const viewportHeight = get(webApp, "viewportHeight");
  const viewportStableHeight = get(webApp, "viewportStableHeight");

  setStylePx(style, "--tg-viewport-height", viewportHeight);
  setStylePx(style, "--tg-viewport-stable-height", viewportStableHeight);

  forEach(INSET_KEYS, (key) => {
    setStylePx(
      style,
      `--tg-safe-area-inset-${key}`,
      get(webApp, `safeAreaInset.${key}`),
    );
    setStylePx(
      style,
      `--tg-content-safe-area-inset-${key}`,
      get(webApp, `contentSafeAreaInset.${key}`),
    );
  });
};

export function initTelegramWebApp() {
  const webApp = getTelegramWebApp();

  if (!webApp) return;

  document.documentElement.dataset.telegramWebapp = "true";
  webApp.ready();
  webApp.expand();

  applyTelegramTheme(webApp);
  applyTelegramViewport(webApp);

  webApp.onEvent?.("themeChanged", () => {
    applyTelegramTheme(webApp);
  });

  webApp.onEvent?.("viewportChanged", () => {
    applyTelegramViewport(webApp);
  });
}
