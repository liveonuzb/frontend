const getFoodLabel = (reason) => reason?.foodName || reason?.name || null;
const getIngredientLabel = (reason) =>
  reason?.ingredientName || reason?.name || null;

export const getTemplateBlockingReasonLabel = (template) => {
  if (template?.isCompatible !== false) return null;
  const reason = template?.blockingReasons?.[0];

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
