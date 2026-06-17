import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import get from "lodash/get";
import includes from "lodash/includes";
import isPlainObject from "lodash/isPlainObject";
import map from "lodash/map";
import toPairs from "lodash/toPairs";
import { useGetQuery } from "@/hooks/api";
import { getApiResponseData } from "@/lib/api-response";

export const AI_USAGE_STATUS_QUERY_KEY = ["user", "ai-usage", "status"];

export const AI_USAGE_FEATURES = {
  textMealLog: "TEXT_MEAL_LOG",
  voiceMealLog: "VOICE_MEAL_LOG",
  foodPhotoScan: "FOOD_PHOTO_SCAN",
  mealPlan7Day: "MEAL_PLAN_7_DAY",
  mealPlan30Day: "MEAL_PLAN_30_DAY",
  nutritionAnalysis: "NUTRITION_ANALYSIS",
  nutritionPantryScan: "NUTRITION_PANTRY_SCAN",
  nutritionRecipeAssistant: "NUTRITION_RECIPE_ASSISTANT",
  nutritionSubstitutionSuggestions: "NUTRITION_SUBSTITUTION_SUGGESTIONS",
  adminMealTemplateVariant: "ADMIN_MEAL_TEMPLATE_VARIANT",
};

export const AI_USAGE_FEATURE_LABELS = {
  [AI_USAGE_FEATURES.textMealLog]: "Text meal log",
  [AI_USAGE_FEATURES.voiceMealLog]: "Voice meal log",
  [AI_USAGE_FEATURES.foodPhotoScan]: "Food photo scan",
  [AI_USAGE_FEATURES.mealPlan7Day]: "7-day meal plan",
  [AI_USAGE_FEATURES.mealPlan30Day]: "30-day meal plan",
  [AI_USAGE_FEATURES.nutritionAnalysis]: "Nutrition analysis",
  [AI_USAGE_FEATURES.nutritionPantryScan]: "Nutrition pantry scan",
  [AI_USAGE_FEATURES.nutritionRecipeAssistant]: "Nutrition recipe assistant",
  [AI_USAGE_FEATURES.nutritionSubstitutionSuggestions]:
    "Nutrition substitutions",
  [AI_USAGE_FEATURES.adminMealTemplateVariant]: "Admin meal template variant",
};

const toFiniteNumberOrNull = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const next = Number(value);
  return Number.isFinite(next) ? next : null;
};

const toFiniteNumberOrZero = (value) => toFiniteNumberOrNull(value) ?? 0;

export const normalizeAiAccessStatus = (payload = {}) => {
  const responseData = getApiResponseData(payload, undefined);
  const source = isPlainObject(responseData)
    ? responseData
    : isPlainObject(get(payload, "data"))
      ? get(payload, "data")
      : isPlainObject(payload)
        ? payload
        : { status: payload };
  const dailyLimit = toFiniteNumberOrNull(get(source, "dailyLimit"));
  const usedToday = toFiniteNumberOrZero(get(source, "usedToday"));
  const reservedToday = toFiniteNumberOrZero(get(source, "reservedToday"));
  const remainingToday = toFiniteNumberOrNull(get(source, "remainingToday"));
  const status = get(source, "status") ?? "trial_not_started";
  const isPremium =
    get(source, "isPremium") === true || status === "premium_unlimited";

  return {
    ...source,
    isPremium,
    status,
    dailyLimit,
    usedToday,
    reservedToday,
    remainingToday,
    isTrialActive: status === "trial_active",
    isTrialExpired: status === "trial_expired",
    isTrialNotStarted: status === "trial_not_started",
    isLimited:
      !isPremium && remainingToday !== null && remainingToday <= 0,
  };
};

export const getAiUsageFeatureLabel = (feature) =>
  get(AI_USAGE_FEATURE_LABELS, feature, feature);

export const getAiAccessStatus = ({ access, wallet } = {}) => {
  const normalized = normalizeAiAccessStatus(access ?? wallet);
  const remaining = normalized.remainingToday;
  const dailyLimit = normalized.dailyLimit;
  const isDisabled =
    !normalized.isPremium &&
    (normalized.status === "trial_expired" ||
      (remaining !== null && remaining <= 0));
  const label = normalized.isPremium
    ? "Cheksiz AI"
    : normalized.status === "trial_not_started"
      ? "7 kun trial"
      : normalized.status === "trial_expired"
        ? "Limit tugadi"
        : `Bugun ${remaining ?? 0}/${dailyLimit ?? 3} qoldi`;

  return {
    ...normalized,
    label,
    isDisabled,
    reason: isDisabled ? label : null,
  };
};

export const getAiAccessDisabledProps = ({ access, wallet } = {}) => {
  const status = getAiAccessStatus({ access, wallet });

  return {
    disabled: status.isDisabled,
    "aria-disabled": status.isDisabled,
    title: status.isDisabled ? status.reason : status.label,
  };
};

export const isAiAccessLimitError = (error) => {
  const status = get(error, "response.status") ?? get(error, "status");
  const code =
    get(error, "code") ??
    get(error, "response.data.code") ??
    get(error, "response.data.error.code");

  return (
    (status === undefined || status === 402) &&
    includes(
      ["AI_DAILY_LIMIT_REACHED", "AI_TRIAL_EXPIRED", "AI_PREMIUM_REQUIRED"],
      code,
    )
  );
};

export const useAiAccessStatus = (options = {}) => {
  const enabled = options.enabled ?? true;
  const query = useGetQuery({
    url: "/user/ai-usage/status",
    queryProps: {
      queryKey: AI_USAGE_STATUS_QUERY_KEY,
      enabled,
    },
  });
  const access = React.useMemo(
    () => normalizeAiAccessStatus(query.data),
    [query.data],
  );

  return {
    ...query,
    access,
    wallet: access,
    costs: {},
  };
};

export const useAiAccessInvalidation = () => {
  const queryClient = useQueryClient();

  const invalidateAiAccess = React.useCallback(
    async () =>
      queryClient.invalidateQueries({ queryKey: AI_USAGE_STATUS_QUERY_KEY }),
    [queryClient],
  );

  return { invalidateAiAccess };
};

export const normalizeAiAccessStatusForTest = normalizeAiAccessStatus;

export const getAiUsageFeatureOptions = () =>
  map(toPairs(AI_USAGE_FEATURE_LABELS), ([value, label]) => ({
    value,
    label,
  }));
