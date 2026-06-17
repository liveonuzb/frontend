import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MealDraftCard } from "./meal-draft-review.jsx";

vi.mock("./ingredient-edit-drawer.jsx", () => ({
  default: ({ open }) => (open ? <div data-testid="ingredient-editor" /> : null),
}));

vi.mock("@/components/meal-plan-builder/gauge-progress.jsx", () => ({
  default: ({ label }) => <div>{label}</div>,
}));

describe("MealDraftCard i18n labels", () => {
  it("renders manual ingredient review actions in Uzbek", () => {
    render(
      <MealDraftCard
        item={{
          title: "Tushlik",
          confidence: 0.82,
          ingredients: [
            {
              id: "rice",
              name: "Guruch",
              grams: 150,
              matchStatus: "manual",
              nutrition: {
                calories: 180,
                protein: 4,
                carbs: 39,
                fat: 0.3,
              },
            },
          ],
        }}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByText("Qo'lda")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tahrirlash/i })).toBeInTheDocument();
    expect(screen.queryByText("Manual")).not.toBeInTheDocument();
    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
  });
});
