import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ListPage from "./index.jsx";

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
  days: 30,
  mealsPerDay: 4,
  totalDays: 30,
  totalMeals: 1,
  dietaryTags: ["high_protein"],
  weeklyKanban: {
    "day-1": [
      {
        id: "breakfast",
        type: "Nonushta",
        time: "08:00",
        items: [{ id: "food-1", name: "Tuxum", cal: 120 }],
      },
    ],
  },
  isActive: true,
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
  useGetQuery: () => ({
    data: {
      data: {
        data: [templateFixture],
        meta: { total: 1, page: 1, pageSize: 100, pageCount: 1 },
      },
    },
    isLoading: false,
    isFetching: false,
    refetch: vi.fn(),
  }),
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

    fireEvent.click(screen.getByRole("button", { name: /ko'rish/i }));

    expect(screen.getByText("30 kunlik preview")).toBeInTheDocument();
    expect(screen.getByText("Tuxum")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("menuitem", { name: /nusxalash/i }));

    await waitFor(() => {
      expect(mockPostMutateAsync).toHaveBeenCalledWith({
        url: "/admin/meal-plans/template-1/clone",
        attributes: { isActive: false },
      });
    });

    fireEvent.click(screen.getByRole("menuitem", { name: /nofaol qilish/i }));

    await waitFor(() => {
      expect(mockPatchMutateAsync).toHaveBeenCalledWith({
        url: "/admin/meal-plans/template-1",
        attributes: { isActive: false },
      });
    });
  });
});
