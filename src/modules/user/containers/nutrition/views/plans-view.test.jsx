import React from "react";
import i18n from "@/lib/i18n";

i18n.changeLanguage("uz");
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NutritionPlansView from "./plans-view.jsx";

const conflictPreviewState = vi.hoisted(() => ({
  preview: {
    templateId: "meal-template-30-day-weight-loss",
    isCompatible: true,
    canApply: true,
    canActivate: true,
    blockingReasons: [],
    requiresSubstitution: false,
    substitutionCount: 0,
  },
  isLoading: false,
  isFetching: false,
  isError: false,
  refetch: vi.fn(),
}));

const templateDetailState = vi.hoisted(() => ({
  template: {
    id: "meal-template-30-day-weight-loss",
    title: "30 kunlik vazn kamaytirish rejasi",
    durationDays: 30,
    daysWithMeals: 2,
    mealsCount: 3,
    appliedTargetCalories: 1850,
    days: [
      {
        dayNumber: 1,
        dayKey: "day-1",
        meals: [
          { id: "meal-1", calories: 500 },
          { id: "meal-2", calories: 350 },
        ],
      },
      {
        dayNumber: 2,
        dayKey: "day-2",
        meals: [{ id: "meal-3", calories: 520 }],
      },
    ],
  },
  isLoading: false,
  isFetching: false,
}));

vi.mock("@/hooks/app/use-app-mode-theme", () => ({
  default: () => ({
    assets: {
      nutritionPlanHero: "/zen/meals/lunch.webp",
    },
  }),
}));

vi.mock("@/hooks/app/use-meal-plan", () => ({
  useMealPlanTemplateConflictPreview: () => conflictPreviewState,
  useMealPlanTemplateDetail: () => templateDetailState,
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
  beforeEach(() => {
    conflictPreviewState.preview = {
      templateId: "meal-template-30-day-weight-loss",
      isCompatible: true,
      canApply: true,
      canActivate: true,
      blockingReasons: [],
      requiresSubstitution: false,
      substitutionCount: 0,
    };
    conflictPreviewState.isLoading = false;
    conflictPreviewState.isFetching = false;
    conflictPreviewState.isError = false;
    conflictPreviewState.refetch = vi.fn();
    templateDetailState.template = {
      id: "meal-template-30-day-weight-loss",
      title: "30 kunlik vazn kamaytirish rejasi",
      durationDays: 30,
      daysWithMeals: 2,
      mealsCount: 3,
      appliedTargetCalories: 1850,
      days: [
        {
          dayNumber: 1,
          dayKey: "day-1",
          meals: [
            { id: "meal-1", calories: 500 },
            { id: "meal-2", calories: 350 },
          ],
        },
        {
          dayNumber: 2,
          dayKey: "day-2",
          meals: [{ id: "meal-3", calories: 520 }],
        },
      ],
    };
    templateDetailState.isLoading = false;
    templateDetailState.isFetching = false;
  });

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
      screen.getByRole("button", { name: /Barchasini ko'rish/i }),
    );
    expect(onCreateFromTemplate).toHaveBeenCalledTimes(1);

    fireEvent.click(
      within(templateCard).getByRole("button", { name: /Ko'rish/i }),
    );
    expect(screen.getByRole("dialog")).toHaveTextContent("Shablon mosligi");
    expect(screen.getByRole("dialog")).toHaveTextContent("Bu shablon mos");
    expect(screen.getByRole("dialog")).toHaveTextContent("2/30");
    expect(screen.getByRole("dialog")).toHaveTextContent("30 kunlik preview");
    expect(screen.getByTestId("template-day-preview-grid")).toBeInTheDocument();
    expect(screen.getByTestId("template-day-preview-1")).toHaveTextContent(
      "2 ta",
    );
    expect(screen.getByTestId("template-day-preview-1")).toHaveTextContent(
      "850",
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Shablonni tanlash" }),
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

  it("separates paused plans in the status filter", () => {
    render(
      <NutritionPlansView
        {...baseProps}
        orderedPlans={[
          {
            id: "plan-active",
            status: "active",
            name: "Faol reja",
            source: "manual",
            durationDays: 7,
            mealCount: 4,
          },
          {
            id: "plan-paused",
            status: "paused",
            name: "Pauzadagi reja",
            source: "template",
            durationDays: 14,
            mealCount: 3,
          },
        ]}
        currentPlan={{ id: "plan-active", status: "active" }}
        getPlanStatusMeta={(status) => ({
          label:
            status === "paused"
              ? "Pauzadagi reja"
              : status === "active"
                ? "Faol reja"
                : "Qoralama reja",
          badgeClassName: "",
        })}
      />,
    );

    expect(screen.getAllByText("Faol reja").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Pauzadagi reja").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("tab", { name: "Pauza" }));

    expect(
      screen.queryByRole("row", { name: /Faol reja 7 kunlik/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("row", { name: /Pauzadagi reja 14 kunlik/i }),
    ).toBeInTheDocument();
  });

  it("shows why an incompatible admin template cannot be selected", () => {
    conflictPreviewState.preview = {
      templateId: "blocked-template",
      isCompatible: false,
      canApply: false,
      canActivate: false,
      blockingReasons: [
        {
          type: "avoided_ingredient",
          ingredientName: "Yong'oq",
        },
      ],
      requiresSubstitution: false,
      substitutionCount: 0,
    };
    templateDetailState.template = {
      id: "blocked-template",
      title: "Mos kelmaydigan reja",
      durationDays: 30,
      daysWithMeals: 1,
      mealsCount: 1,
      appliedTargetCalories: 1850,
      isCompatible: false,
      blockingReasons: [
        {
          type: "avoided_ingredient",
          ingredientName: "Yong'oq",
        },
      ],
      days: [
        {
          dayNumber: 1,
          dayKey: "day-1",
          meals: [{ id: "meal-1", calories: 450 }],
        },
        {
          dayNumber: 2,
          dayKey: "day-2",
          meals: [],
        },
      ],
    };

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

    fireEvent.click(
      within(templateCard).getByRole("button", { name: /Ko'rish/i }),
    );

    expect(screen.getByRole("dialog")).toHaveTextContent("Bu shablon mos emas");
    expect(screen.getByRole("dialog")).toHaveTextContent(
      "Mos emas: Yong'oq allergiya yoki cheklovlarda bor.",
    );
    expect(screen.getByRole("dialog")).toHaveTextContent(
      "Nima qilish mumkin?",
    );
    expect(screen.getByRole("dialog")).toHaveTextContent(
      "Boshqa shablon tanlang",
    );
    expect(screen.getByRole("dialog")).toHaveTextContent(
      "Sparse kunlar: 2-kun",
    );
    expect(
      screen.getByRole("button", { name: "Shablonni tanlash" }),
    ).toBeDisabled();
  });
});
