import { config } from "@/config.js";
import { parseTelegramCampaignAttribution } from "@/lib/telegram-start-param.js";

const SESSION_KEY = "liveon.launchSessionId";
const TELEGRAM_CAMPAIGN_ATTRIBUTION_KEY = "liveon.telegramCampaignAttribution";
const MAX_PROPERTY_BYTES = 8 * 1024;

const createSessionId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `launch-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export const getLaunchSessionId = () => {
  if (typeof window === "undefined") {
    return createSessionId();
  }

  try {
    const existing = window.localStorage.getItem(SESSION_KEY);

    if (existing) {
      return existing;
    }

    const next = createSessionId();
    window.localStorage.setItem(SESSION_KEY, next);
    return next;
  } catch {
    return createSessionId();
  }
};

const normalizeProperties = (properties = {}) => {
  const json = JSON.stringify(properties ?? {});

  if (new Blob([json]).size > MAX_PROPERTY_BYTES) {
    return {};
  }

  return JSON.parse(json);
};

export const buildLaunchAnalyticsPayload = (
  eventName,
  { source = "app", path, properties = {} } = {},
) => ({
  eventName,
  source,
  sessionId: getLaunchSessionId(),
  path:
    path ??
    (typeof window === "undefined"
      ? undefined
      : `${window.location.pathname}${window.location.search}`),
  properties: normalizeProperties(properties),
});

export const trackLaunchEvent = async (eventName, options = {}) => {
  try {
    const baseURL = String(config.baseURL || "").replace(/\/$/, "");
    const response = await fetch(`${baseURL}/analytics/events`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-Analytics-Event": eventName,
      },
      body: JSON.stringify(buildLaunchAnalyticsPayload(eventName, options)),
    });

    return response.ok;
  } catch {
    return false;
  }
};

export const rememberTelegramCampaignAttribution = (startParam) => {
  const attribution = parseTelegramCampaignAttribution(startParam);

  if (!attribution) {
    return null;
  }

  const value = {
    ...attribution,
    source: "telegram",
    rememberedAt: new Date().toISOString(),
  };

  if (typeof window === "undefined") {
    return value;
  }

  try {
    window.localStorage.setItem(
      TELEGRAM_CAMPAIGN_ATTRIBUTION_KEY,
      JSON.stringify(value),
    );
  } catch {
    return value;
  }

  return value;
};

export const getTelegramCampaignAttribution = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(TELEGRAM_CAMPAIGN_ATTRIBUTION_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    return parsed?.campaignJobId ? parsed : null;
  } catch {
    return null;
  }
};

export const trackCampaignConversion = async (
  conversionType,
  properties = {},
) => {
  const attribution = getTelegramCampaignAttribution();

  if (!attribution?.campaignJobId) {
    return false;
  }

  return trackLaunchEvent("campaign_conversion", {
    source: "telegram",
    properties: {
      ...attribution,
      conversionType,
      ...properties,
    },
  });
};
