export const formatPremiumPrice = (value, locale = "uz-UZ") =>
  new Intl.NumberFormat(locale).format(Number(value) || 0);

export const getShortestPremiumPlan = (plans = []) => {
  const comparablePlans = plans.filter(
    (plan) => Number(plan?.durationDays) > 0 && Number(plan?.price) > 0,
  );

  if (!comparablePlans.length) {
    return null;
  }

  return [...comparablePlans].sort(
    (left, right) => Number(left.durationDays) - Number(right.durationDays),
  )[0];
};

export const getPlanMonthlyEquivalent = (plan) => {
  const durationDays = Number(plan?.durationDays) || 0;
  const price = Number(plan?.price) || 0;

  if (durationDays <= 30 || price <= 0) {
    return null;
  }

  return Math.round(price / (durationDays / 30));
};

export const getPlanSavings = (plan, basePlan) => {
  const planDurationDays = Number(plan?.durationDays) || 0;
  const baseDurationDays = Number(basePlan?.durationDays) || 0;
  const planPrice = Number(plan?.price) || 0;
  const basePrice = Number(basePlan?.price) || 0;

  if (
    !basePlan ||
    planDurationDays <= baseDurationDays ||
    planPrice <= 0 ||
    basePrice <= 0
  ) {
    return null;
  }

  const comparablePrice = Math.round(
    (basePrice / baseDurationDays) * planDurationDays,
  );
  const savings = comparablePrice - planPrice;

  return savings > 0 ? savings : null;
};
