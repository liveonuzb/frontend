import { trackLaunchEvent } from "@/lib/analytics.js";

import filter from "lodash/filter";
import isArray from "lodash/isArray";
import mean from "lodash/mean";
import reduce from "lodash/reduce";
import some from "lodash/some";
import toNumber from "lodash/toNumber";

const normalizeItems = (items) => (isArray(items) ? items : []);

const itemNeedsReview = (item) =>
  Boolean(item?.reviewNeeded) ||
  some(item?.ingredients, (ingredient) => Boolean(ingredient?.reviewNeeded));

const itemWasEdited = (item) =>
  Boolean(item?.manualNutritionOverride) ||
  Boolean(item?.manualGramsOverride) ||
  some(item?.ingredients, (ingredient) => Boolean(ingredient?.edited));

export const buildNutritionScanReviewEventProperties = ({
  sourceType = "unknown",
  action = "reviewed",
  items = [],
} = {}) => {
  const normalizedItems = normalizeItems(items);
  const itemCount = normalizedItems.length;
  const needsReviewCount = filter(normalizedItems, itemNeedsReview).length;
  const editedItemCount = filter(normalizedItems, itemWasEdited).length;
  const aiEstimatedIngredientCount = reduce(
    normalizedItems,
    (sum, item) =>
      sum +
      filter(
        item?.ingredients,
        (ingredient) =>
          ingredient?.nutritionSource === "ai" ||
          ingredient?.matchStatus === "ai-estimated",
      ).length,
    0,
  );
  const confidenceValues = filter(
    normalizedItems.map((item) => toNumber(item?.confidence)),
    (value) => Number.isFinite(value) && value > 0,
  );

  return {
    sourceType,
    action,
    itemCount,
    needsReviewCount,
    confirmedItemCount: Math.max(0, itemCount - needsReviewCount),
    editedItemCount,
    aiEstimatedIngredientCount,
    averageConfidence: confidenceValues.length
      ? Math.round(mean(confidenceValues) * 100)
      : 0,
  };
};

export const trackNutritionScanStarted = ({
  sourceType = "unknown",
  mode = "ai",
} = {}) =>
  trackLaunchEvent("nutrition_scan_started", {
    source: "app",
    properties: {
      sourceType,
      mode,
    },
  });

export const trackNutritionScanReviewed = (input = {}) =>
  trackLaunchEvent("nutrition_scan_reviewed", {
    source: "app",
    properties: buildNutritionScanReviewEventProperties(input),
  });

export const trackNutritionScanFailed = ({
  sourceType = "unknown",
  reason = "unknown",
} = {}) =>
  trackLaunchEvent("nutrition_scan_failed", {
    source: "app",
    properties: {
      sourceType,
      reason,
    },
  });
