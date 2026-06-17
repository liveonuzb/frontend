import React from "react";
import { mealPlanDaysToKanban } from "@/hooks/app/use-meal-plan";

import filter from "lodash/filter";
import find from "lodash/find";
import isArray from "lodash/isArray";
import map from "lodash/map";
import orderBy from "lodash/orderBy";
import reduce from "lodash/reduce";
import some from "lodash/some";
import lodashValues from "lodash/values";

export const getPlanInsights = (plan) => {
  const dayColumns = isArray(plan?.days)
    ? filter(map(plan.days, (day) => day?.meals), isArray)
    : filter(lodashValues(plan?.weeklyKanban || {}), isArray);

  const filledDays = filter(dayColumns, (columns) =>
    some(
      columns,
      (column) => isArray(column?.items) && column.items.length > 0,
    ),
  ).length;

  const totalItems = reduce(
    dayColumns,
    (sum, columns) => {
      return (
        sum +
        reduce(
          columns,
          (columnSum, column) => {
            return (
              columnSum + (isArray(column?.items) ? column.items.length : 0)
            );
          },
          0,
        )
      );
    },
    0,
  );

  return {
    filledDays,
    totalItems,
    updatedLabel: plan?.updatedAt
      ? new Date(plan.updatedAt).toLocaleDateString("uz-UZ")
      : null,
  };
};

export const getPlanBuilderData = (plan) =>
  mealPlanDaysToKanban(plan?.days || plan?.weeklyKanban || []);

export const getPlanStatusMeta = (status) => {
  if (status === "active") {
    return {
      label: "Faol reja",
      chipClassName: "text-green-600 dark:text-green-400",
      badgeClassName: "bg-green-500/10 text-green-600 dark:text-green-400",
    };
  }

  if (status === "archived") {
    return {
      label: "Arxivlangan reja",
      chipClassName: "text-slate-600 dark:text-slate-400",
      badgeClassName: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
    };
  }

  return {
    label: "Saqlangan reja",
    chipClassName: "text-amber-600 dark:text-amber-400",
    badgeClassName: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  };
};

export const getPlanSourceMeta = (source) => {
  if (source === "ai") {
    return {
      label: "AI reja",
      badgeClassName:
        "border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-300",
    };
  }

  return {
    label: "Manual reja",
    badgeClassName:
      "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300",
  };
};

export const useNutritionPlanSelection = ({
  activePlan,
  draftPlan,
  plans,
}) => {
  const [selectedPlanId, setSelectedPlanId] = React.useState(null);

  React.useEffect(() => {
    if (plans.length === 0) {
      setSelectedPlanId(null);
      return;
    }

    if (selectedPlanId && some(plans, (plan) => plan.id === selectedPlanId)) {
      return;
    }

    setSelectedPlanId(activePlan?.id || draftPlan?.id || plans[0]?.id || null);
  }, [activePlan?.id, draftPlan?.id, plans, selectedPlanId]);

  const currentPlan = React.useMemo(() => {
    if (!plans.length) {
      return null;
    }

    return (
      find(plans, (plan) => plan.id === selectedPlanId) ||
      activePlan ||
      draftPlan ||
      plans[0] ||
      null
    );
  }, [activePlan, draftPlan, plans, selectedPlanId]);

  const planInsightsMap = React.useMemo(() => {
    return reduce(
      plans,
      (acc, plan) => {
        acc[plan.id] = getPlanInsights(plan);
        return acc;
      },
      {},
    );
  }, [plans]);

  const orderedPlans = React.useMemo(() => {
    const getStatusPriority = (plan) =>
      plan.status === "active" ? 0 : plan.status === "draft" ? 1 : 2;

    return orderBy(
      plans,
      [
        getStatusPriority,
        (plan) => new Date(plan.updatedAt || plan.createdAt || 0).getTime(),
      ],
      ["asc", "desc"],
    );
  }, [plans]);

  return {
    currentPlan,
    orderedPlans,
    planInsightsMap,
    selectedPlanId,
    setSelectedPlanId,
  };
};
