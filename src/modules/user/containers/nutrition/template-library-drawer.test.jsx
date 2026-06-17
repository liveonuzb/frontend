import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TemplateLibraryDrawer from "./template-library-drawer.jsx";

const useMealPlanTemplatesMock = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/app/use-meal-plan", () => ({
  useMealPlanTemplates: (params) => useMealPlanTemplatesMock(params),
}));

describe("TemplateLibraryDrawer", () => {
  beforeEach(() => {
    useMealPlanTemplatesMock.mockReturnValue({
      templates: [
        {
          id: "compatible",
          title: "30 kunlik balans",
          description: "Mos template",
          goal: "maintenance",
          durationDays: 30,
          daysWithMeals: 30,
          mealCount: 4,
          mealsCount: 120,
          budgetTier: "medium",
          cuisines: ["uzbek"],
          tags: ["halal"],
          appliedTargetCalories: 2200,
          isCompatible: true,
          blockingReasons: [],
        },
        {
          id: "blocked",
          title: "Mos kelmaydigan reja",
          description: "Disliked food bor",
          goal: "maintenance",
          durationDays: 30,
          daysWithMeals: 30,
          mealCount: 4,
          mealsCount: 120,
          tags: [],
          isCompatible: false,
        blockingReasons: [
          { type: "disliked_food", foodId: 12, foodName: "Palov" },
        ],
        },
      ],
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    });
  });

  it("allows compatible templates and disables blocked templates with a reason", () => {
    const onSelectTemplate = vi.fn();

    render(
      <TemplateLibraryDrawer
        open
        onOpenChange={vi.fn()}
        onSelectTemplate={onSelectTemplate}
      />,
    );

    const compatibleCard = screen
      .getByText("30 kunlik balans")
      .closest(".rounded-2xl");
    const blockedCard = screen
      .getByText("Mos kelmaydigan reja")
      .closest(".rounded-2xl");

    fireEvent.click(
      within(compatibleCard).getByRole("button", { name: /Tanlash/i }),
    );
    expect(onSelectTemplate).toHaveBeenCalledWith(
      expect.objectContaining({ id: "compatible" }),
    );

    expect(
      within(blockedCard).getByRole("button", { name: /Mos kelmaydi/i }),
    ).toBeDisabled();
    expect(
      screen.getByText(/Mos emas: Palov yoqtirilmagan ovqatlar ro'yxatida bor/i),
    ).toBeInTheDocument();
  });

  it("sends template library filters to the template query", () => {
    render(
      <TemplateLibraryDrawer
        open
        onOpenChange={vi.fn()}
        onSelectTemplate={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Mushak olish/i }));
    fireEvent.change(screen.getByLabelText("Dietary tag"), {
      target: { value: "halal" },
    });
    fireEvent.change(screen.getByLabelText("Byudjet tier"), {
      target: { value: "medium" },
    });
    fireEvent.change(screen.getByLabelText("Davomiylik"), {
      target: { value: "30" },
    });
    fireEvent.change(screen.getByLabelText("Mahal soni"), {
      target: { value: "4" },
    });
    fireEvent.change(screen.getByLabelText("Oshxona"), {
      target: { value: "uzbek" },
    });
    fireEvent.change(screen.getByLabelText("Maksimal kaloriya"), {
      target: { value: "2400" },
    });

    expect(useMealPlanTemplatesMock).toHaveBeenLastCalledWith({
      goal: "gain_muscle",
      dietaryTag: "halal",
      budgetTier: "medium",
      durationDays: 30,
      mealCount: 4,
      cuisine: "uzbek",
      maxCalories: 2400,
      enabled: true,
    });
  });
});
