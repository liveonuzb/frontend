import filter from "lodash/filter";
import get from "lodash/get";
import isArray from "lodash/isArray";
import map from "lodash/map";
import round from "lodash/round";
import size from "lodash/size";
import toNumber from "lodash/toNumber";
import trim from "lodash/trim";

const normalizeConfidence = (value, fallback = 1) => {
  const number = toNumber(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return number > 1 ? Math.min(1, number / 100) : Math.max(0, number);
};

export const confidenceToPercent = (value) =>
  Math.round(normalizeConfidence(value) * 100);

export const normalizeUploadedRecipeProductImages = (payload = []) => {
  const items = isArray(payload)
    ? payload
    : isArray(get(payload, "data"))
      ? get(payload, "data")
      : isArray(get(payload, "uploads"))
        ? get(payload, "uploads")
        : [];

  return filter(
    map(items, (item, index) => {
      const id = trim(
        item?.id || item?.uploadId || item?.imageUploadId || "",
      );

      if (!id) {
        return null;
      }

      return {
        id,
        url: item.url || item.imageUrl || item.publicUrl || "",
        fileName:
          item.originalName ||
          item.fileName ||
          item.name ||
          `Ingredient rasmi ${index + 1}`,
      };
    }),
    Boolean,
  );
};

export const normalizeRecognizedProductsForUi = (products = []) =>
  filter(
    map(products, (product, index) => {
      const name = trim(product?.name || "");

      if (!name) {
        return null;
      }

      return {
        id: product.id || `recognized-${index}-${name}`,
        name,
        quantity:
          product.quantity === null || product.quantity === undefined
            ? ""
            : product.quantity,
        unit: product.unit || "g",
        confidence: normalizeConfidence(product.confidence),
        ingredientId: product.ingredientId || null,
        source: product.source || "image_upload_review",
      };
    }),
    Boolean,
  );

export const buildRecognizedProductPayload = (products = []) =>
  filter(
    map(products, (product) => {
      const name = trim(product?.name || "");
      const quantity = toNumber(product?.quantity);
      const ingredientId = toNumber(product?.ingredientId);

      if (!name) {
        return null;
      }

      return {
        name,
        ...(Number.isFinite(quantity) && quantity > 0 ? { quantity } : {}),
        ...(trim(product?.unit || "") ? { unit: trim(product.unit) } : {}),
        confidence: normalizeConfidence(product?.confidence),
        ...(Number.isInteger(ingredientId) && ingredientId > 0
          ? { ingredientId }
          : {}),
      };
    }),
    Boolean,
  );

export const getRecipeGenerationJob = (payload = {}) =>
  get(payload, "job", payload);

export const getRecipeGenerationSuggestions = (job = {}) =>
  isArray(job?.suggestions) ? job.suggestions : [];

export const canGenerateRecipeFromImage = ({
  uploadedImages = [],
  products = [],
  isBusy = false,
}) =>
  !isBusy &&
  size(uploadedImages) > 0 &&
  size(buildRecognizedProductPayload(products)) > 0;

export const getSuggestionNutritionBadges = (suggestion = {}) => [
  {
    key: "time",
    label: `${round(toNumber(suggestion.cookingTimeMinutes) || 0)} daq`,
  },
  {
    key: "calories",
    label: `${round(toNumber(suggestion.calories) || 0)} kkal`,
  },
  {
    key: "protein",
    label: `${round(toNumber(suggestion.protein) || 0, 1)}g protein`,
  },
  {
    key: "servings",
    label: `${round(toNumber(suggestion.servings) || 1)} porsiya`,
  },
];
