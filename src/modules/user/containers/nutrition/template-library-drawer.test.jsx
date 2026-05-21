import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TemplateLibraryDrawer from "./template-library-drawer.jsx";

vi.mock("@/hooks/app/use-meal-plan", () => ({
  useMealPlanTemplates: () => ({
    templates: [
      {
        id: "compatible",
        title: "30 kunlik balans",
        description: "Mos template",
        goal: "maintenance",
        days: 30,
        daysWithMeals: 30,
        mealsCount: 120,
        tags: [],
        isCompatible: true,
        blockingReasons: [],
      },
      {
        id: "blocked",
        title: "Mos kelmaydigan reja",
        description: "Disliked food bor",
        goal: "maintenance",
        days: 30,
        daysWithMeals: 30,
        mealsCount: 120,
        tags: [],
        isCompatible: false,
        blockingReasons: [{ type: "disliked_food", foodId: 12 }],
      },
    ],
    isLoading: false,
    isFetching: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

describe("TemplateLibraryDrawer", () => {
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
      screen.getByText(/Foydalanuvchi cheklovlariga mos emas/i),
    ).toBeInTheDocument();
  });
});
