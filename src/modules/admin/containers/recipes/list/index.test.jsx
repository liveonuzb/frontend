import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ListPage from "./index.jsx";

const mockUseGetQuery = vi.fn();
const mockPatchRecipeReview = vi.fn();
const mockUploadGalleryImage = vi.fn();
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
  recipeStatus: "pending_review",
  publicationRequestedAt: "2026-06-02T08:00:00.000Z",
  recipeItems: [
    { id: 1, grams: 120 },
    { id: 2, grams: 80 },
  ],
  recipeInstructions: [{ id: 1 }, { id: 2 }, { id: 3 }],
  categories: [{ name: "Lunch", translations: { uz: "Tushlik" } }],
  cuisines: [{ name: "Fitness", translations: { uz: "Fitness" } }],
};

vi.mock("@/hooks/api", () => ({
  useGetQuery: (options) => mockUseGetQuery(options),
  usePatchQuery: () => ({
    mutateAsync: mockPatchRecipeReview,
    isPending: false,
  }),
  usePostFileQuery: () => ({
    mutateAsync: mockUploadGalleryImage,
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
    mockUploadGalleryImage.mockClear();
    mockPatchRecipeReview.mockResolvedValue({});
    mockUploadGalleryImage.mockResolvedValue({});
    mockUseGetQuery.mockImplementation((options) => {
      if (options.url === "/admin/recipes/gallery/images") {
        return {
          data: {
            data: {
              images: [
                {
                  id: "gallery-1",
                  label: "Seed salad",
                  url: "https://cdn.liveon.test/gallery/salad.webp",
                  isActive: true,
                },
              ],
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
        url: "/admin/foods",
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

  it("uploads recipe gallery images for user recipe selection", async () => {
    render(
      <MemoryRouter initialEntries={["/admin/recipes/list"]}>
        <Routes>
          <Route path="/admin/recipes/list" element={<ListPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Seed salad")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Recipe gallery image label"), {
      target: { value: "Salad fallback" },
    });
    fireEvent.change(screen.getByLabelText("Recipe gallery image file"), {
      target: {
        files: [new File(["image"], "salad.webp", { type: "image/webp" })],
      },
    });

    await waitFor(() => {
      expect(mockUploadGalleryImage).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/admin/recipes/gallery/images",
          attributes: expect.any(FormData),
        }),
      );
    });

    const formData = mockUploadGalleryImage.mock.calls[0][0].attributes;
    expect(formData.get("label")).toBe("Salad fallback");
    expect(formData.get("image")).toEqual(expect.any(File));
  });

  it("approves and rejects pending public recipe requests", async () => {
    render(
      <MemoryRouter initialEntries={["/admin/recipes/list"]}>
        <Routes>
          <Route path="/admin/recipes/list" element={<ListPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Public review")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /public qilish/i }));

    await waitFor(() => {
      expect(mockPatchRecipeReview).toHaveBeenCalledWith({
        url: "/admin/recipes/41/approve-publication",
      });
    });

    fireEvent.change(screen.getByLabelText("Tovuqli bowl rad sababi"), {
      target: { value: "Macros incomplete" },
    });
    fireEvent.click(screen.getByRole("button", { name: /rad etish/i }));

    await waitFor(() => {
      expect(mockPatchRecipeReview).toHaveBeenCalledWith({
        url: "/admin/recipes/41/reject-publication",
        attributes: { reason: "Macros incomplete" },
      });
    });
  });
});
