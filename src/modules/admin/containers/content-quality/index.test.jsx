import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Index from "./index.jsx";
import { getIssueActionPath } from "./content-quality-utils.js";

const mockPost = vi.fn();
const mockGet = vi.fn();
const mockUseGetQuery = vi.fn(() => ({
  data: {
    data: {
      summary: { totalIssues: 0 },
      sections: [],
      activeLanguages: [],
    },
  },
  isLoading: false,
  isFetching: false,
  refetch: mockRefetch,
}));
const mockRefetch = vi.fn();
const mockSetBreadcrumbs = vi.fn();

vi.mock("@/hooks/api", () => ({
  useGetQuery: (...args) => mockUseGetQuery(...args),
}));

vi.mock("@/hooks/api/use-api.js", () => ({
  default: () => ({
    request: {
      get: mockGet,
      post: mockPost,
    },
  }),
}));

vi.mock("@/store", () => ({
  useBreadcrumbStore: () => ({
    setBreadcrumbs: mockSetBreadcrumbs,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

beforeEach(() => {
  mockPost.mockReset();
  mockGet.mockReset();
  mockUseGetQuery.mockClear();
  mockRefetch.mockReset();
  mockSetBreadcrumbs.mockReset();
});

describe("content quality issue actions", () => {
  it("routes meal plan template QA issues to admin meal plans", () => {
    expect(
      getIssueActionPath({
        sectionKey: "nutrition",
        groupKey: "mealPlanTemplatesWithCalorieIssues",
        issueId: "template-1",
      }),
    ).toBe("/admin/meal-plans/list");

    expect(
      getIssueActionPath({
        sectionKey: "safety",
        groupKey: "mealPlanTemplateDietaryConflicts",
        issueId: "template-1",
      }),
    ).toBe("/admin/meal-plans/list");
  });

  it("prefers explicit backend action paths for exact filters and drawers", () => {
    expect(
      getIssueActionPath({
        sectionKey: "nutrition",
        groupKey: "foodsWithImpossibleCalories",
        issueId: 7,
        action: {
          path: "/admin/foods/list/edit/7?qualityIssue=macro_warning",
        },
      }),
    ).toBe("/admin/foods/list/edit/7?qualityIssue=macro_warning");
  });

  it("routes import preview quality groups back to their import surfaces", () => {
    expect(
      getIssueActionPath({
        sectionKey: "nutrition",
        groupKey: "foodImportValidationFailed",
        issueId: "food-import-row-3-validation",
      }),
    ).toBe("/admin/foods/list");

    expect(
      getIssueActionPath({
        sectionKey: "prices",
        groupKey: "ingredientImportMissingPrices",
        issueId: "ingredient-import-row-2-price",
      }),
    ).toBe("/admin/ingredients/list");
  });

  it("runs recipe recalculation bulk action from the toolbar", async () => {
    mockPost.mockResolvedValue({
      data: {
        data: {
          recalculated: 3,
          skipped: 1,
        },
      },
    });

    render(<Index />);

    expect(mockUseGetQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/admin/nutrition/content-quality",
      }),
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Recipe qayta hisoblash/i }),
    );

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(
        "/admin/nutrition/content-quality/actions/recalculate-recipes",
        {},
      );
    });
    expect(
      screen.getByText(/3 ta recipe qayta hisoblandi/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/1 ta o'tkazildi/i)).toBeInTheDocument();
    expect(mockRefetch).toHaveBeenCalled();
  });
});
