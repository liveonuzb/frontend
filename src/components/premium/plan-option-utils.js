import { filter, orderBy, toNumber } from "lodash";
export const formatPremiumPrice = (value, locale = "uz-UZ") =>
  new Intl.NumberFormat(locale).format(toNumber(value) || 0);

export const getShortestPremiumPlan = (plans = []) => {
  const comparablePlans = filter(plans, (plan) => toNumber(plan?.durationDays) > 0 && toNumber(plan?.price) > 0);

  if (!comparablePlans.length) {
    return null;
  }

  return orderBy(
    comparablePlans,
    [(plan) => toNumber(plan.durationDays)],
    ["asc"],
  )[0];
};

export const getPlanMonthlyEquivalent = (plan) => {
  const durationDays = toNumber(plan?.durationDays) || 0;
  const price = toNumber(plan?.price) || 0;

  if (durationDays <= 30 || price <= 0) {
    return null;
  }

  return Math.round(price / (durationDays / 30));
};

export const getPlanSavings = (plan, basePlan) => {
  const planDurationDays = toNumber(plan?.durationDays) || 0;
  const baseDurationDays = toNumber(basePlan?.durationDays) || 0;
  const planPrice = toNumber(plan?.price) || 0;
  const basePrice = toNumber(basePlan?.price) || 0;

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
