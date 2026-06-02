const getFoodLabel = (reason) => reason?.foodName || reason?.name || null;
const getIngredientLabel = (reason) =>
  reason?.ingredientName || reason?.name || null;

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
  const reasons = Array.isArray(template?.blockingReasons)
    ? template.blockingReasons
    : [];

  return reasons.map(getBlockingReasonLabel).filter(Boolean);
};

export const getTemplateBlockingReasonLabel = (template) =>
  getTemplateBlockingReasonLabels(template)[0] || null;

export const getTemplateBlockingReasonSummary = (template) => {
  const labels = getTemplateBlockingReasonLabels(template);

  if (!labels.length) return null;

  const visibleLabels = labels.slice(0, 3);
  const extraCount = labels.length - visibleLabels.length;

  return [
    ...visibleLabels,
    extraCount > 0 ? `Yana ${extraCount} ta conflict bor.` : null,
  ]
    .filter(Boolean)
    .join(" ");
};

export const extractTemplateBlockingReasonsFromError = (error) => {
  const data = error?.response?.data || error;
  const candidates = [
    data?.blockingReasons,
    data?.message?.blockingReasons,
    data?.error?.blockingReasons,
  ];

  return (
    candidates.find((value) => Array.isArray(value) && value.length > 0) || []
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
