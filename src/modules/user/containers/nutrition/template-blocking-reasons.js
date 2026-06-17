import {
  filter,
  find,
  includes,
  isArray,
  isPlainObject,
  join,
  map,
  slice,
  trim,
  uniqBy,
} from "lodash";

const BLOCKING_REASON_TYPES = [
  "disliked_food",
  "avoided_ingredient",
  "excluded_allergen_tag",
  "empty_or_zero_calorie_day",
];

const normalizeLabel = (value) => trim(String(value || "")) || null;

const getFoodLabel = (reason) =>
  normalizeLabel(reason?.foodName || reason?.name);
const getIngredientLabel = (reason) =>
  normalizeLabel(reason?.ingredientName || reason?.name);

const normalizeBlockingReason = (reason) => {
  if (!isPlainObject(reason) || !includes(BLOCKING_REASON_TYPES, reason.type)) {
    return null;
  }

  if (reason.type === "disliked_food") {
    const foodName = getFoodLabel(reason);
    return foodName ? { ...reason, foodName, name: foodName } : null;
  }

  if (reason.type === "avoided_ingredient") {
    const ingredientName = getIngredientLabel(reason);
    return ingredientName
      ? { ...reason, ingredientName, name: ingredientName }
      : null;
  }

  if (reason.type === "excluded_allergen_tag") {
    const tag = normalizeLabel(reason.tag);
    return tag ? { ...reason, tag } : null;
  }

  return {
    ...reason,
    dayKey: normalizeLabel(reason.dayKey),
  };
};

const getReasonKey = (reason) =>
  join(
    [
      reason.type,
      reason.foodName,
      reason.ingredientName,
      reason.tag,
      reason.dayKey,
    ],
    ":",
  );

export const getBlockingReasonLabel = (reason) => {
  if (reason?.type === "disliked_food") {
    const foodLabel = getFoodLabel(reason);
    return foodLabel
      ? `Mos emas: ${foodLabel} yoqtirilmagan ovqatlar ro'yxatida bor.`
      : "Mos emas: yoqtirilmagan ovqat bor.";
  }

  if (reason?.type === "avoided_ingredient") {
    const ingredientLabel = getIngredientLabel(reason);
    return ingredientLabel
      ? `Mos emas: ${ingredientLabel} allergiya yoki cheklovlarda bor.`
      : "Mos emas: allergiya yoki yoqtirilmagan ingredient bor.";
  }

  if (reason?.type === "excluded_allergen_tag") {
    return reason?.tag
      ? `Mos emas: ${reason.tag} diet chekloviga zid.`
      : "Mos emas: diet cheklovlariga zid tarkib bor.";
  }

  if (reason?.type === "empty_or_zero_calorie_day") {
    return reason?.dayKey
      ? `Mos emas: ${reason.dayKey} kunida kaloriya to'ldirilmagan.`
      : "Mos emas: template ichida kaloriyasi to'ldirilmagan kun bor.";
  }

  return "Mos emas: foydalanuvchi cheklovlariga mos kelmaydi.";
};

export const getTemplateBlockingReasonLabels = (template) => {
  if (template?.isCompatible !== false) return [];
  const reasons = isArray(template?.blockingReasons)
    ? template.blockingReasons
    : [];
  const normalizedReasons = uniqBy(
    filter(map(reasons, normalizeBlockingReason), Boolean),
    getReasonKey,
  );

  return filter(map(normalizedReasons, getBlockingReasonLabel), Boolean);
};

export const getTemplateBlockingReasonLabel = (template) =>
  getTemplateBlockingReasonLabels(template)[0] || null;

export const getTemplateBlockingReasonSummary = (template) => {
  const labels = getTemplateBlockingReasonLabels(template);

  if (!labels.length) return null;

  const visibleLabels = slice(labels, 0, 3);
  const extraCount = labels.length - visibleLabels.length;

  return join(
    filter(
      [
        ...visibleLabels,
        extraCount > 0 ? `Yana ${extraCount} ta conflict bor.` : null,
      ],
      Boolean,
    ),
    " ",
  );
};

export const extractTemplateBlockingReasonsFromError = (error) => {
  const data = error?.response?.data || error;
  const candidates = [
    data?.blockingReasons,
    data?.message?.blockingReasons,
    data?.error?.blockingReasons,
  ];

  return (
    find(candidates, (value) => isArray(value) && value.length > 0) || []
  );
};

export const getTemplateBlockingErrorMessage = (error, fallback) => {
  const blockingReasons = extractTemplateBlockingReasonsFromError(error);
  const summary = getTemplateBlockingReasonSummary({
    isCompatible: false,
    blockingReasons,
  });

  return summary || fallback;
};
