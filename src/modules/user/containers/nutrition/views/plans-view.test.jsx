import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import NutritionPlansView from "./plans-view.jsx";

vi.mock("@/hooks/app/use-app-mode-theme", () => ({
  default: () => ({
    assets: {
      nutritionPlanHero: "/zen/meals/lunch.webp",
    },
  }),
}));

const baseProps = {
  orderedPlans: [],
  currentPlan: null,
  goals: { calories: 2200 },
  currentPlanDayStatus: null,
  planInsightsMap: {},
  getPlanStatusMeta: () => ({
    label: "Qoralama reja",
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
  onCreateAI: vi.fn(),
  onCreateFromTemplate: vi.fn(),
  onActivateTemplate: vi.fn(),
};

describe("NutritionPlansView", () => {
  it("renders backend admin templates and activates the selected template", () => {
    const onActivateTemplate = vi.fn();
    const onCreateFromTemplate = vi.fn();

    render(
      <NutritionPlansView
        {...baseProps}
        onCreateFromTemplate={onCreateFromTemplate}
        templates={[
          {
            id: "meal-template-30-day-weight-loss",
            title: "30 kunlik vazn kamaytirish rejasi",
            description: "Admin tomonidan yaratilgan template",
            appliedTargetCalories: 1850,
            days: 30,
            mealsPerDay: 4,
            mealsCount: 120,
            isCompatible: true,
          },
        ]}
        onActivateTemplate={onActivateTemplate}
      />,
    );

    const templateCard = screen
      .getByText("30 kunlik vazn kamaytirish rejasi")
      .closest("article");

    expect(within(templateCard).getByText("30 kunlik")).toBeInTheDocument();
    expect(within(templateCard).getByText("4 mahal / kun")).toBeInTheDocument();
    expect(within(templateCard).getByText("120 ta ovqat")).toBeInTheDocument();
    expect(within(templateCard).getByText("Mos")).toBeInTheDocument();

    fireEvent.click(
      within(templateCard).getByRole("button", { name: /Ko'rish/i }),
    );
    expect(onCreateFromTemplate).toHaveBeenCalledTimes(1);

    fireEvent.click(
      within(templateCard).getByRole("button", { name: /Tanlash/i }),
    );

    expect(onActivateTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "meal-template-30-day-weight-loss",
      }),
    );
    expect(screen.queryByText("Mushak massasi")).not.toBeInTheDocument();
  });

  it("shows useful plan metadata in the plans table", () => {
    render(
      <NutritionPlansView
        {...baseProps}
        currentPlan={{ id: "plan-1", status: "active" }}
        orderedPlans={[
          {
            id: "plan-1",
            status: "active",
            name: "Qo'lda reja 2026-05-26",
            source: "manual",
            durationDays: 30,
            mealCount: 4,
            appliedTargetCalories: 1850,
            updatedAt: "2026-05-26T00:00:00.000Z",
          },
        ]}
        planInsightsMap={{
          "plan-1": {
            filledDays: 30,
            totalItems: 120,
            updatedLabel: "2026-05-26",
          },
        }}
      />,
    );

    expect(
      screen.getAllByText("Qo'lda reja 2026-05-26").length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("30 kunlik").length).toBeGreaterThan(0);
    expect(screen.getAllByText("4 mahal / kun").length).toBeGreaterThan(0);
    expect(screen.getAllByText("120 ta ovqat").length).toBeGreaterThan(0);
    expect(screen.getAllByText("1,850 kcal").length).toBeGreaterThan(0);
  });

  it("shows why an incompatible admin template cannot be selected", () => {
    render(
      <NutritionPlansView
        {...baseProps}
        templates={[
          {
            id: "blocked-template",
            title: "Mos kelmaydigan reja",
            description: "Cheklov bor",
            appliedTargetCalories: 1850,
            days: 30,
            mealsCount: 120,
            isCompatible: false,
            blockingReasons: [
              {
                type: "avoided_ingredient",
                ingredientName: "Yong'oq",
              },
            ],
          },
        ]}
      />,
    );

    const templateCard = screen
      .getByText("Mos kelmaydigan reja")
      .closest("article");

    expect(
      within(templateCard).getByRole("button", { name: /Mos emas/i }),
    ).toBeDisabled();
    expect(
      within(templateCard).getByText(
        /Mos emas: Yong'oq allergiya yoki cheklovlarda bor/i,
      ),
    ).toBeInTheDocument();
  });
});
