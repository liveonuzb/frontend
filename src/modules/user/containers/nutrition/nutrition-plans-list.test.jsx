import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import NutritionPlansList from "./nutrition-plans-list.jsx";

const defaultProps = {
  orderedPlans: [
    {
      id: "plan-30",
      name: "30 kunlik reja",
      status: "draft",
      source: "template",
      mealCount: 3,
      durationDays: 30,
    },
  ],
  currentPlan: null,
  planInsightsMap: {
    "plan-30": {
      filledDays: 28,
      totalItems: 90,
      updatedLabel: "Bugun",
    },
  },
  getPlanStatusMeta: () => ({
    label: "Draft reja",
    badgeClassName: "",
  }),
  getPlanSourceMeta: () => ({
    label: "Template",
    badgeClassName: "",
  }),
  onActivatePlan: vi.fn(),
  onOpenPlanActions: vi.fn(),
  onRemovePlan: vi.fn(),
  onSelectPlanForShopping: vi.fn(),
};

describe("NutritionPlansList duration labels", () => {
  it("shows filled days against the plan duration instead of a hardcoded week", () => {
    render(<NutritionPlansList {...defaultProps} />);

    expect(screen.getByText("28/30")).toBeInTheDocument();
  });

  it("uses localized table headers", () => {
    render(<NutritionPlansList {...defaultProps} variant="table" />);

    expect(screen.getByText("Holat")).toBeInTheDocument();
  });
});
