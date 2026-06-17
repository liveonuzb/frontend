import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ListPage from "./index.jsx";

const mockUseGetQuery = vi.fn();
const mockPatchRecipeReview = vi.fn();
const mockSetBreadcrumbs = vi.fn();

const recipeFixture = {
  id: 41,
  name: "Tovuqli bowl",
  translations: { uz: "Tovuqli bowl" },
  calories: 520,
  protein: 38,
  carbs: 48,
  fat: 14,
  cookingMinutes: 25,
  servings: 2,
  isActive: true,
  recipeStatus: "draft",
  readiness: {
    score: 88,
    status: "warning",
    readyToPublish: true,
    issues: [
      {
        code: "not_published",
        label: "Recipe is not published yet.",
        blocker: false,
      },
    ],
  },
  recipeItems: [
    { id: 1, grams: 120 },
    { id: 2, grams: 80 },
  ],
  recipeInstructions: [{ id: 1 }, { id: 2 }, { id: 3 }],
  categories: [{ name: "Lunch", translations: { uz: "Tushlik" } }],
  cuisines: [{ name: "Fitness", translations: { uz: "Fitness" } }],
};

const recognitionJobFixture = {
  id: "job-1",
  status: "failed",
  source: "product_images",
  imageUploadIds: ["upload-1"],
  recognizedProducts: [{ name: "Pomidor" }, { name: "Tuxum" }],
  suggestions: [{ id: "suggestion-1", title: "Pomidorli omlet" }],
  moderation: { status: "pending", note: null },
  error: "AI failed once",
  user: { id: "user-1", phone: "+998901234567", firstName: "Ali" },
  createdAt: "2026-06-08T08:00:00.000Z",
};

vi.mock("@/hooks/api", () => ({
  useGetQuery: (options) => mockUseGetQuery(options),
  usePatchQuery: () => ({
    mutateAsync: mockPatchRecipeReview,
    isPending: false,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/store", () => ({
  useBreadcrumbStore: () => ({
    setBreadcrumbs: mockSetBreadcrumbs,
  }),
  useLanguageStore: (selector) => selector({ currentLanguage: "uz" }),
}));

vi.mock("@/modules/admin/lib/permissions.js", () => ({
  useAdminPermissions: () => ({
    canManageContent: true,
  }),
}));

describe("admin recipes list", () => {
  beforeEach(() => {
    mockSetBreadcrumbs.mockClear();
    mockUseGetQuery.mockClear();
    mockPatchRecipeReview.mockClear();
    mockPatchRecipeReview.mockResolvedValue({});
    mockUseGetQuery.mockImplementation((options) => {
      if (options.url === "/admin/nutrition/recipes/product-recognition-jobs") {
        return {
          data: {
            data: {
              data: [recognitionJobFixture],
              meta: { total: 1, page: 1, pageSize: 5, totalPages: 1 },
            },
          },
          isLoading: false,
          isFetching: false,
          refetch: vi.fn(),
        };
      }

      return {
        data: {
          data: {
            data: [recipeFixture],
            meta: { total: 1, page: 1, pageSize: 12, totalPages: 1 },
          },
        },
        isLoading: false,
        isFetching: false,
        refetch: vi.fn(),
      };
    });
  });

  it("loads only recipe foods and opens the existing recipe editor", async () => {
    render(
      <MemoryRouter initialEntries={["/admin/recipes/list"]}>
        <Routes>
          <Route path="/admin/recipes/list" element={<ListPage />} />
          <Route
            path="/admin/recipes/list/recipe/:id"
            element={<div>Recipe drawer route</div>}
          />
          <Route
            path="/admin/recipes/list/preview/:id"
            element={<div>Recipe preview route</div>}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(mockUseGetQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/admin/nutrition/recipes",
        params: expect.objectContaining({
          nutritionMode: "recipe",
          page: 1,
          pageSize: 12,
          sortBy: "createdAt",
          sortDir: "desc",
        }),
        queryProps: expect.objectContaining({
          queryKey: expect.arrayContaining(["admin", "recipes"]),
        }),
      }),
    );
    expect(mockSetBreadcrumbs).toHaveBeenCalledWith([
      { url: "/admin", title: "Admin" },
      { url: "/admin/recipes/list", title: "Retseptlar" },
    ]);
    expect(screen.getByText("Tovuqli bowl")).toBeInTheDocument();
    expect(screen.getByText("2 ingredient")).toBeInTheDocument();
    expect(screen.getByText("3 qadam")).toBeInTheDocument();
    expect(screen.getByText("520 kcal")).toBeInTheDocument();
    expect(screen.getByText("Readiness 88%")).toBeInTheDocument();
    expect(screen.getByText("Publish uchun tayyor")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /tarkib/i }));

    expect(screen.getByText("Recipe drawer route")).toBeInTheDocument();
  });

  it("opens the recipe preview drawer from the list", () => {
    render(
      <MemoryRouter initialEntries={["/admin/recipes/list"]}>
        <Routes>
          <Route path="/admin/recipes/list" element={<ListPage />} />
          <Route
            path="/admin/recipes/list/preview/:id"
            element={<div>Recipe preview route</div>}
          />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /ko'rish/i }));

    expect(screen.getByText("Recipe preview route")).toBeInTheDocument();
  });

  it("publishes and archives recipes through canonical nutrition endpoints", async () => {
    render(
      <MemoryRouter initialEntries={["/admin/recipes/list"]}>
        <Routes>
          <Route path="/admin/recipes/list" element={<ListPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Draft")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /publish/i }));

    await waitFor(() => {
      expect(mockPatchRecipeReview).toHaveBeenCalledWith({
        url: "/admin/nutrition/recipes/41/publish",
      });
    });

    fireEvent.click(screen.getByRole("button", { name: /archive/i }));

    await waitFor(() => {
      expect(mockPatchRecipeReview).toHaveBeenCalledWith({
        url: "/admin/nutrition/recipes/41/archive",
      });
    });
  });

  it("renders the AI product recognition review queue and moderation actions", async () => {
    render(
      <MemoryRouter initialEntries={["/admin/recipes/list"]}>
        <Routes>
          <Route path="/admin/recipes/list" element={<ListPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(mockUseGetQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/admin/nutrition/recipes/product-recognition-jobs",
        params: { status: "needs_review", page: 1, pageSize: 5 },
      }),
    );
    expect(screen.getByText("AI product recognition review")).toBeInTheDocument();
    expect(screen.getByText("1 job review kerak")).toBeInTheDocument();
    expect(screen.getByText("Pomidor, Tuxum")).toBeInTheDocument();
    expect(screen.getByText("Pomidorli omlet")).toBeInTheDocument();
    expect(screen.getByText("AI failed once")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /suggestionni saqlash/i }));

    await waitFor(() => {
      expect(mockPatchRecipeReview).toHaveBeenCalledWith({
        url: "/admin/nutrition/recipes/product-recognition-jobs/job-1/suggestions",
        attributes: {
          suggestions: [{ id: "suggestion-1", title: "Pomidorli omlet" }],
        },
      });
    });

    fireEvent.click(screen.getByRole("button", { name: /approve/i }));

    await waitFor(() => {
      expect(mockPatchRecipeReview).toHaveBeenCalledWith({
        url: "/admin/nutrition/recipes/product-recognition-jobs/job-1/review",
        attributes: { status: "approved" },
      });
    });
  });
});
