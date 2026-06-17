import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUseGetQuery = vi.fn();
const mockPatch = vi.fn();
const mockPost = vi.fn();
const mockPostFile = vi.fn();
const mockDelete = vi.fn();
const mockInvalidateQueries = vi.fn();
const mockSetBreadcrumbs = vi.fn();
let ListPage;

const foodFixture = {
  id: 101,
  name: "Osh",
  translations: { uz: "Osh" },
  imageUrl: null,
  categoryIds: [1],
  cuisineIds: [2],
  nutritionMode: "manual",
  recipeStatus: "draft",
  calories: 430,
  protein: 16,
  carbs: 58,
  fat: 15,
  servingSize: 100,
  servingUnit: "g",
  isOnboarding: false,
  isActive: true,
  dietaryTags: ["halal"],
  allergenTags: [],
};

vi.mock("nuqs", async () => {
  const React = await import("react");
  const { useLocation } = await import("react-router");

  return {
    parseAsString: {
      withDefault: (defaultValue) => ({ defaultValue }),
    },
    parseAsStringEnum: () => ({
      withDefault: (defaultValue) => ({ defaultValue }),
    }),
    useQueryState: (key, parser = {}) => {
      const location = useLocation();
      const params = new URLSearchParams(location.search);
      const [value, setValue] = React.useState(
        params.get(key) ?? parser.defaultValue,
      );

      return [
        value,
        (nextValue) => {
          setValue((current) =>
            String(
              typeof nextValue === "function" ? nextValue(current) : nextValue,
            ),
          );
          return Promise.resolve(new URLSearchParams());
        },
      ];
    },
  };
});

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: mockInvalidateQueries,
    }),
  };
});

vi.mock("@/hooks/api", () => ({
  useGetQuery: (options) => mockUseGetQuery(options),
  usePatchQuery: () => ({
    mutateAsync: mockPatch,
    isPending: false,
  }),
  useDeleteQuery: () => ({
    mutateAsync: mockDelete,
    isPending: false,
  }),
  usePostQuery: () => ({
    mutateAsync: mockPost,
    isPending: false,
  }),
  usePostFileQuery: () => ({
    mutateAsync: mockPostFile,
    isPending: false,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
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
    isSuperAdmin: true,
  }),
}));

const queryByUrl = (options) => {
  if (options.url === "/admin/nutrition/food-categories") {
    return {
      data: {
        data: [
          {
            id: 1,
            name: "Lunch",
            translations: { uz: "Tushlik" },
            isActive: true,
          },
        ],
      },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    };
  }

  if (options.url === "/admin/nutrition/cuisines") {
    return {
      data: {
        data: [
          {
            id: 2,
            name: "Uzbek",
            translations: { uz: "O'zbek" },
            isActive: true,
          },
        ],
      },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    };
  }

  if (options.url === "/admin/languages") {
    return {
      data: {
        data: [{ id: "uz", code: "uz", flag: "UZ", isActive: true }],
      },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    };
  }

  if (options.url === "/admin/food-images/orphans") {
    return {
      data: { data: null },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    };
  }

  return {
    data: {
      data: [foodFixture],
      meta: { total: 1, page: 1, pageSize: 10, totalPages: 1 },
    },
    isLoading: false,
    isFetching: false,
    refetch: vi.fn(),
  };
};

const renderFoodsList = (entry = "/admin/foods/list") =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/admin/foods/list" element={<ListPage />} />
      </Routes>
    </MemoryRouter>,
  );

describe("admin foods list filters and bulk actions", () => {
  beforeEach(async () => {
    mockUseGetQuery.mockClear();
    mockPatch.mockReset();
    mockPatch.mockResolvedValue({
      data: { data: { updatedCount: 1, skippedCount: 0 } },
    });
    mockPost.mockReset();
    mockPostFile.mockReset();
    mockDelete.mockReset();
    mockInvalidateQueries.mockClear();
    mockSetBreadcrumbs.mockClear();
    mockUseGetQuery.mockImplementation(queryByUrl);
    ListPage = (await import("./index.jsx")).default;
  });

  it("passes saved and query-string filters to the backend food catalog query", () => {
    renderFoodsList(
      "/admin/foods/list?q=osh&status=inactive&hasImage=no&lifecycle=all&nutritionMode=recipe&recipeStatus=draft&qualityIssue=missing_image&duplicates=only&sortBy=name&sortDir=desc&page=2&pageSize=25",
    );

    const foodsQuery = mockUseGetQuery.mock.calls.find(
      ([options]) => options.url === "/admin/foods",
    )?.[0];

    expect(foodsQuery).toMatchObject({
      url: "/admin/foods",
      params: {
        name: "osh",
        status: "inactive",
        hasImage: "no",
        lifecycle: "all",
        nutritionMode: "recipe",
        recipeStatus: "draft",
        qualityIssue: "missing_image",
        duplicates: "only",
        sortBy: "name",
        sortDir: "desc",
        page: 2,
        pageSize: 25,
      },
    });
  });

  it("builds canonical selected-food bulk status payloads", async () => {
    const { buildFoodBulkStatusPayload } = await import("./index.jsx");

    expect(buildFoodBulkStatusPayload([101, 102], false)).toEqual({
      ids: [101, 102],
      isActive: false,
    });
    expect(buildFoodBulkStatusPayload([101], true)).toEqual({
      ids: [101],
      isActive: true,
    });
  });
});
