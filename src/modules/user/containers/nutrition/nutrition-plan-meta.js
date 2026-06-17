import toNumber from "lodash/toNumber";
import trim from "lodash/trim";

const DEFAULT_BUDGET_PERIOD = "weekly";
const DEFAULT_BUDGET_CURRENCY = "UZS";

const normalizePositiveNumber = (value) => {
  const normalized = toNumber(value);

  return Number.isFinite(normalized) && normalized > 0 ? normalized : null;
};

const formatInteger = (value) =>
  String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

const formatFactor = (value) => {
  const rounded = Math.round(value * 100) / 100;

  return Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
};

export const getPlanBudgetFormDefaults = (plan = null) => ({
  amount: plan?.budgetTarget?.amount ? String(plan.budgetTarget.amount) : "",
  period: plan?.budgetTarget?.period || DEFAULT_BUDGET_PERIOD,
  currency: plan?.budgetTarget?.currency || DEFAULT_BUDGET_CURRENCY,
});

export const buildPlanMetaBudgetPayload = ({
  amount,
  period = DEFAULT_BUDGET_PERIOD,
  currency = DEFAULT_BUDGET_CURRENCY,
  mode = "create",
} = {}) => {
  const normalizedAmount = toNumber(trim(String(amount ?? "")));
  const normalizedPeriod = period || DEFAULT_BUDGET_PERIOD;
  const normalizedCurrency = currency || DEFAULT_BUDGET_CURRENCY;

  if (Number.isFinite(normalizedAmount) && normalizedAmount > 0) {
    return {
      budgetAmount: normalizedAmount,
      budgetPeriod: normalizedPeriod,
      budgetCurrency: normalizedCurrency,
    };
  }

  if (mode === "edit") {
    return {
      budgetAmount: 0,
      budgetPeriod: normalizedPeriod,
      budgetCurrency: normalizedCurrency,
    };
  }

  return {};
};

export const getPlanRescaleExplanation = (plan = null) => {
  const summary = plan?.rescaleSummary;

  if (!summary) {
    return "";
  }

  const oldTargetCalories = normalizePositiveNumber(summary.oldTargetCalories);
  const newTargetCalories = normalizePositiveNumber(summary.newTargetCalories);
  const averageFactor = normalizePositiveNumber(summary.averageFactor);
  const affectedMeals = normalizePositiveNumber(summary.affectedMeals);
  const reasons = Array.isArray(summary.cannotRescaleReasons)
    ? summary.cannotRescaleReasons
        .map((reason) => trim(String(reason || "")))
        .filter(Boolean)
    : [];
  const parts = [];

  if (oldTargetCalories && newTargetCalories) {
    parts.push(
      `${formatInteger(oldTargetCalories)} -> ${formatInteger(newTargetCalories)} kcal`,
    );
  } else if (newTargetCalories) {
    parts.push(`${formatInteger(newTargetCalories)} kcal target`);
  }

  if (averageFactor) {
    parts.push(`faktor ${formatFactor(averageFactor)}x`);
  }

  if (affectedMeals) {
    parts.push(`${formatInteger(affectedMeals)} ta meal o'zgardi`);
  }

  if (reasons.length > 0) {
    parts.push(`moslanmagan: ${reasons.join(", ")}`);
  }

  return parts.join(", ");
};
