import get from "lodash/get";
import includes from "lodash/includes";
import replace from "lodash/replace";
import startsWith from "lodash/startsWith";
import toLower from "lodash/toLower";
import trim from "lodash/trim";

const TELEGRAM_CONNECT_PREFIX = "connect_";
const TELEGRAM_CAMPAIGN_PREFIX = "campaign_";
const TELEGRAM_REFERRAL_PREFIX = "ref_";
const START_PARAM_PATTERN = /^[a-z0-9_:-]{1,80}$/;
const ROUTE_BY_START_PARAM = {
  dashboard: "/user/dashboard",
  water: "/user/water",
  meal_plan: "/user/nutrition/overview",
  meal: "/user/nutrition/overview",
  nutrition: "/user/nutrition/overview",
  workout: "/user/workout/overview",
  progress: "/user/measurements",
};
const ROUTE_START_PARAMS = [
  "dashboard",
  "water",
  "meal_plan",
  "meal",
  "nutrition",
  "workout",
  "progress",
];

export const normalizeTelegramStartParam = (startParam) => {
  const raw = toLower(trim(startParam ?? ""));

  if (!raw) {
    return null;
  }

  if (startsWith(raw, TELEGRAM_CONNECT_PREFIX)) {
    return "connect";
  }

  if (!START_PARAM_PATTERN.test(raw)) {
    return "other";
  }

  if (get(ROUTE_BY_START_PARAM, raw)) {
    return raw;
  }

  const routeAlias = replace(raw, /-/g, "_");

  if (get(ROUTE_BY_START_PARAM, routeAlias)) {
    return routeAlias;
  }

  return raw;
};

export const resolveTelegramStartParamRoute = (startParam) => {
  const normalized = normalizeTelegramStartParam(startParam);
  return get(ROUTE_BY_START_PARAM, normalized, null);
};

export const resolveTelegramStartParamKind = (startParam) => {
  const normalized = normalizeTelegramStartParam(startParam);

  if (!normalized) {
    return null;
  }

  if (includes(ROUTE_START_PARAMS, normalized)) {
    return normalized === "meal" || normalized === "nutrition"
      ? "meal_plan"
      : normalized;
  }

  if (normalized === "connect") {
    return "connect";
  }

  if (startsWith(normalized, TELEGRAM_CAMPAIGN_PREFIX)) {
    return "campaign";
  }

  if (startsWith(normalized, TELEGRAM_REFERRAL_PREFIX)) {
    return "referral";
  }

  return "other";
};

export const parseTelegramCampaignAttribution = (startParam) => {
  const normalized = normalizeTelegramStartParam(startParam);

  if (!normalized || !startsWith(normalized, TELEGRAM_CAMPAIGN_PREFIX)) {
    return null;
  }

  const campaignJobId = normalized.slice(TELEGRAM_CAMPAIGN_PREFIX.length);

  if (!campaignJobId) {
    return null;
  }

  return {
    campaignJobId,
    campaignStartParam: normalized,
  };
};

export const parseTelegramReferralAttribution = (startParam) => {
  const normalized = normalizeTelegramStartParam(startParam);

  if (!normalized || !startsWith(normalized, TELEGRAM_REFERRAL_PREFIX)) {
    return null;
  }

  const referralCode = normalized.slice(TELEGRAM_REFERRAL_PREFIX.length);

  if (!referralCode) {
    return null;
  }

  return {
    referralCode,
    referralStartParam: normalized,
  };
};

export const buildTelegramAttributionProperties = (startParam) => {
  const normalized = normalizeTelegramStartParam(startParam);
  const campaignAttribution = parseTelegramCampaignAttribution(normalized);
  const referralAttribution = parseTelegramReferralAttribution(normalized);

  return {
    hasStartParam: Boolean(trim(startParam ?? "")),
    startParam: normalized,
    startParamKind: resolveTelegramStartParamKind(normalized),
    startParamRoute: resolveTelegramStartParamRoute(normalized),
    ...(campaignAttribution ?? {}),
    ...(referralAttribution ?? {}),
  };
};
