import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  get,
  includes,
  isArray,
  isFinite,
  isPlainObject,
  map,
  reduce,
  toNumber,
  toLower,
  toPairs,
} from "lodash";
import { useGetQuery } from "@/hooks/api";
import { getApiResponseData } from "@/lib/api-response";

export const AI_CREDIT_WALLET_QUERY_KEY = ["user", "ai-credits", "me"];
export const AI_CREDIT_COSTS_QUERY_KEY = ["user", "ai-credits", "costs"];

export const AI_CREDIT_FEATURES = {
  textMealLog: "TEXT_MEAL_LOG",
  voiceMealLog: "VOICE_MEAL_LOG",
  foodPhotoScan: "FOOD_PHOTO_SCAN",
  mealPlan7Day: "MEAL_PLAN_7_DAY",
  mealPlan30Day: "MEAL_PLAN_30_DAY",
  nutritionAnalysis: "NUTRITION_ANALYSIS",
};

export const AI_CREDIT_FEATURE_LABELS = {
  [AI_CREDIT_FEATURES.textMealLog]: "Text meal log",
  [AI_CREDIT_FEATURES.voiceMealLog]: "Voice meal log",
  [AI_CREDIT_FEATURES.foodPhotoScan]: "Food photo scan",
  [AI_CREDIT_FEATURES.mealPlan7Day]: "7-day meal plan",
  [AI_CREDIT_FEATURES.mealPlan30Day]: "30-day meal plan",
  [AI_CREDIT_FEATURES.nutritionAnalysis]: "Nutrition analysis",
};

const SUPPORTED_AI_CREDIT_FEATURES = [
  AI_CREDIT_FEATURES.textMealLog,
  AI_CREDIT_FEATURES.voiceMealLog,
  AI_CREDIT_FEATURES.foodPhotoScan,
  AI_CREDIT_FEATURES.mealPlan7Day,
  AI_CREDIT_FEATURES.mealPlan30Day,
  AI_CREDIT_FEATURES.nutritionAnalysis,
];

const nullableNumber = (value) => {
  const numberValue = toNumber(value);
  return isFinite(numberValue) ? numberValue : null;
};

const numberOrZero = (value) => nullableNumber(value) ?? 0;

const isPremiumTier = (value) =>
  includes(["premium", "pro", "paid"], toLower(value ?? ""));

const normalizeCostsSource = (payload) => {
  const source =
    getApiResponseData(payload, undefined) ??
    get(payload, "costs") ??
    get(payload, "data.costs") ??
    payload;
  const costs = get(source, "costs", source);

  if (isArray(costs)) {
    return reduce(
      costs,
      (result, item) => ({
        ...result,
        [get(item, "feature")]: get(item, "cost"),
      }),
      {},
    );
  }

  return isPlainObject(costs) ? costs : {};
};

export const normalizeAiCreditCosts = (payload = {}) => {
  const source = normalizeCostsSource(payload);

  return reduce(
    SUPPORTED_AI_CREDIT_FEATURES,
    (result, feature) => ({
      ...result,
      [feature]: nullableNumber(get(source, feature)),
    }),
    {},
  );
};

export const normalizeAiCreditWallet = (payload = {}) => {
  const source =
    getApiResponseData(payload, undefined) ??
    get(payload, "wallet") ??
    get(payload, "data.wallet") ??
    payload;
  const monthlyGrant = numberOrZero(get(source, "monthlyGrant"));
  const used = numberOrZero(get(source, "used"));
  const reserved = numberOrZero(get(source, "reserved"));
  const explicitRemaining = nullableNumber(get(source, "remaining"));
  const hasWalletData =
    get(source, "remaining") != null ||
    get(source, "monthlyGrant") != null ||
    get(source, "used") != null ||
    get(source, "reserved") != null;
  const remaining =
    hasWalletData
      ? explicitRemaining ?? Math.max(monthlyGrant - used - reserved, 0)
      : null;
  const status =
    get(source, "status") ??
    get(source, "accountStatus") ??
    get(source, "tier") ??
    null;
  const accountStatus = get(source, "accountStatus") ?? status;
  const tier = get(source, "tier") ?? null;
  const isPremium =
    get(source, "isPremium") === true ||
    get(source, "premium") === true ||
    isPremiumTier(status) ||
    isPremiumTier(accountStatus) ||
    isPremiumTier(tier);

  return {
    ...source,
    monthlyGrant,
    used,
    reserved,
    remaining,
    resetsAt: get(source, "resetsAt") ?? get(source, "periodEnd") ?? null,
    status,
    tier,
    accountStatus,
    isPremium,
    isExhausted: remaining !== null && remaining <= 0,
  };
};

export const getAiCreditFeatureLabel = (feature) =>
  get(AI_CREDIT_FEATURE_LABELS, feature, feature);

export const getAiCreditStatus = ({ wallet, costs, feature } = {}) => {
  const cost = nullableNumber(get(costs, feature));
  const remaining = nullableNumber(get(wallet, "remaining"));
  const isExhausted = remaining !== null && remaining <= 0;
  const isDisabled =
    isExhausted || (cost !== null && remaining !== null && remaining < cost);

  return {
    cost,
    remaining,
    isExhausted,
    isDisabled,
    label: getAiCreditFeatureLabel(feature),
    reason: isDisabled ? "AI credits exhausted" : null,
  };
};

export const getAiCreditDisabledProps = ({ feature, wallet, costs } = {}) => {
  const status = getAiCreditStatus({ feature, wallet, costs });

  return {
    disabled: status.isDisabled,
    "aria-disabled": status.isDisabled,
    title: status.isDisabled
      ? "Not enough AI credits remaining"
      : getAiCreditFeatureLabel(feature),
  };
};

export const isAiCreditsExhaustedError = (error) => {
  const status = get(error, "response.status") ?? get(error, "status");

  return (
    (status === undefined || status === 402) &&
    includes(
      [
        get(error, "code"),
        get(error, "response.data.code"),
        get(error, "response.data.error.code"),
      ],
      "AI_CREDITS_EXHAUSTED",
    )
  );
};

export const useAiCreditWallet = (options = {}) => {
  const enabled = options.enabled ?? true;
  const query = useGetQuery({
    url: "/user/ai-credits/me",
    queryProps: {
      queryKey: AI_CREDIT_WALLET_QUERY_KEY,
      enabled,
    },
  });
  const wallet = React.useMemo(
    () => normalizeAiCreditWallet(query.data),
    [query.data],
  );

  return {
    ...query,
    wallet,
  };
};

export const useAiCreditCosts = (options = {}) => {
  const enabled = options.enabled ?? true;
  const query = useGetQuery({
    url: "/user/ai-credits/costs",
    queryProps: {
      queryKey: AI_CREDIT_COSTS_QUERY_KEY,
      enabled,
    },
  });
  const costs = React.useMemo(
    () => normalizeAiCreditCosts(query.data),
    [query.data],
  );

  return {
    ...query,
    costs,
  };
};

export const useAiCreditInvalidation = () => {
  const queryClient = useQueryClient();

  const invalidateAiCredits = React.useCallback(
    async () =>
      Promise.all(
        map([AI_CREDIT_WALLET_QUERY_KEY, AI_CREDIT_COSTS_QUERY_KEY], (queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      ),
    [queryClient],
  );

  return { invalidateAiCredits };
};

export const normalizeAiCreditWalletForTest = normalizeAiCreditWallet;
export const normalizeAiCreditCostsForTest = normalizeAiCreditCosts;

export const getSupportedAiCreditFeatures = () => [
  ...SUPPORTED_AI_CREDIT_FEATURES,
];

export const getAiCreditFeatureOptions = () =>
  map(toPairs(AI_CREDIT_FEATURE_LABELS), ([value, label]) => ({
    value,
    label,
  }));
