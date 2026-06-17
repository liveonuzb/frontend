import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ListPage, { getTemplateDayEntries } from "./index.jsx";

const mockInvalidateQueries = vi.fn();
const mockPostMutateAsync = vi.fn();
const mockPatchMutateAsync = vi.fn();
const mockDeleteMutateAsync = vi.fn();

const templateFixture = {
  id: "template-1",
  name: "Sog'lom turmush",
  description: "Balansli haftalik menyu",
  translations: {
    uz: "Sog'lom turmush",
  },
  descriptionTranslations: {
    uz: "Balansli haftalik menyu",
  },
  goal: "wellness",
  durationDays: 30,
  mealsPerDay: 4,
  totalDays: 30,
  totalMeals: 1,
  dietaryTags: ["high_protein"],
  source: "ai_variant",
  sourceTemplateId: "source-template-1",
  version: 2,
  versionMetadata: {
    version: 2,
    sourceTemplateId: "source-template-1",
    clonedFromTemplateId: "source-template-1",
    changedFields: [
      {
        field: "name",
        from: "Original plan",
        to: "Sog'lom turmush",
      },
      {
        field: "isActive",
        from: false,
        to: true,
      },
    ],
  },
  validation: {
    status: "warning",
    score: 92,
    errorCount: 0,
    warningCount: 2,
    issues: [
      {
        code: "sparse_day",
        message: "day-1 has 1/4 meals.",
        dayKey: "day-1",
      },
    ],
  },
  shoppingListEstimate: {
    knownCost: 12000,
    unknownPriceCount: 1,
    itemCount: 1,
  },
  days: [
    {
      dayNumber: 1,
      meals: [
        {
          id: "breakfast",
          type: "Nonushta",
          time: "08:00",
          items: [{ id: "food-1", name: "Tuxum", cal: 120 }],
        },
      ],
    },
  ],
  isActive: true,
};

const impactFixture = {
  templateId: "template-1",
  activeUserPlans: 3,
  totalUserPlans: 5,
  existingPlansUnaffected: true,
};

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
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
    setBreadcrumbs: vi.fn(),
  }),
  useLanguageStore: (selector) =>
    selector({
      currentLanguage: "uz",
    }),
}));

vi.mock("@/modules/admin/lib/permissions.js", () => ({
  useAdminPermissions: () => ({
    canManageContent: true,
  }),
}));

vi.mock("@/hooks/api", () => ({
  useGetQuery: ({ url }) =>
    url?.includes("/user-impact")
      ? {
          data: { data: { data: impactFixture } },
          isLoading: false,
          isFetching: false,
          refetch: vi.fn(),
        }
      : {
          data: {
            data: {
              data: [templateFixture],
              meta: { total: 1, page: 1, pageSize: 100, pageCount: 1 },
            },
          },
          isLoading: false,
          isFetching: false,
          refetch: vi.fn(),
        },
  usePostQuery: () => ({
    mutateAsync: mockPostMutateAsync,
    isPending: false,
  }),
  usePatchQuery: () => ({
    mutateAsync: mockPatchMutateAsync,
    isPending: false,
  }),
  useDeleteQuery: () => ({
    mutateAsync: mockDeleteMutateAsync,
    isPending: false,
  }),
}));

vi.mock("@/components/ui/drawer", () => ({
  Drawer: ({ children, open }) => (open ? <div>{children}</div> : null),
  DrawerContent: ({ children }) => <section>{children}</section>,
  DrawerDescription: ({ children }) => <p>{children}</p>,
  DrawerFooter: ({ children }) => <footer>{children}</footer>,
  DrawerHeader: ({ children }) => <header>{children}</header>,
  DrawerTitle: ({ children }) => <h2>{children}</h2>,
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }) => (
    <button type="button" role="menuitem" onClick={onClick}>
      {children}
    </button>
  ),
  DropdownMenuTrigger: ({ children }) => <div>{children}</div>,
}));

vi.mock("@/components/meal-plan-builder/index.jsx", () => ({
  default: () => <div data-testid="meal-plan-builder" />,
}));

describe("admin meal plan list", () => {
  beforeEach(() => {
    mockInvalidateQueries.mockClear();
    mockPostMutateAsync.mockResolvedValue({ data: { data: {} } });
    mockPatchMutateAsync.mockResolvedValue({ data: { data: {} } });
    mockDeleteMutateAsync.mockResolvedValue({ data: { data: {} } });
    mockPostMutateAsync.mockClear();
    mockPatchMutateAsync.mockClear();
    mockDeleteMutateAsync.mockClear();
  });

  it("previews, clones, and toggles publish status for an admin template", async () => {
    render(<ListPage />);

    expect(screen.getByText("Sog'lom turmush")).toBeInTheDocument();
    expect(screen.getByText("AI variant")).toBeInTheDocument();
    expect(screen.getByText("v2")).toBeInTheDocument();
    expect(screen.getByText("2 o'zgarish")).toBeInTheDocument();
    expect(screen.getByText("QA 92%")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /ko'rish/i }));

    expect(screen.getByText("30 kunlik preview")).toBeInTheDocument();
    expect(screen.getByText("Validation 92%")).toBeInTheDocument();
    expect(screen.getByText("Version 2")).toBeInTheDocument();
    expect(
      screen.getByText("Nomi: Original plan -> Sog'lom turmush"),
    ).toBeInTheDocument();
    expect(screen.getByText("Status: false -> true")).toBeInTheDocument();
    expect(screen.getByText("Tuxum")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("menuitem", { name: /nusxalash/i }));

    await waitFor(() => {
      expect(mockPostMutateAsync).toHaveBeenCalledWith({
        url: "/admin/nutrition/meal-plan-templates/template-1/clone",
        attributes: { isActive: false },
      });
    });

    fireEvent.click(screen.getByRole("menuitem", { name: /nofaol qilish/i }));

    expect(
      screen.getByText(
        "3 active user plan - 5 total. Existing user plans o'zgarmaydi.",
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^nofaol qilish$/i }));

    await waitFor(() => {
      expect(mockPatchMutateAsync).toHaveBeenCalledWith({
        url: "/admin/nutrition/meal-plan-templates/template-1",
        attributes: { isActive: false },
      });
    });
  });

  it("sorts weekly kanban day keys with deterministic tie-breakers", () => {
    const days = getTemplateDayEntries({
      weeklyKanban: {
        "z-extra": [],
        "day-2": [],
        "a-extra": [],
        "day-1": [],
      },
    });

    expect(days.map(([dayKey]) => dayKey)).toEqual([
      "day-1",
      "day-2",
      "a-extra",
      "z-extra",
    ]);
  });
});
