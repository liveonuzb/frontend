import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  useCoachPrograms,
  useCoachProgramsMutations,
} from "@/modules/coach/lib/hooks/useCoachPrograms";
import { useProgramFilters } from "../list/use-filters.js";
import ProgramsListPage from "../list/index.jsx";

vi.mock("@/store", () => ({
  useBreadcrumbStore: () => ({ setBreadcrumbs: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@/components/reui/data-grid", () => ({
  DataGrid: ({ children, recordCount }) => (
    <div data-record-count={recordCount} data-testid="programs-data-grid">
      {children}
    </div>
  ),
  DataGridContainer: ({ children }) => <div>{children}</div>,
  DataGridTable: () => <div data-testid="programs-table">table</div>,
  DataGridTableDndRows: ({ handleDragEnd }) => (
    <button
      type="button"
      onClick={() =>
        handleDragEnd({ active: { id: "1" }, over: { id: "2" } })
      }
    >
      Drag reorder
    </button>
  ),
}));

vi.mock("@/components/reui/data-grid/data-grid-pagination", () => ({
  DataGridPagination: () => <div data-testid="programs-pagination" />,
}));

vi.mock("@/modules/coach/components/data-grid-helpers", () => ({
  BulkActionsBar: ({ selectedCount }) => (
    <div data-testid="bulk-actions">{selectedCount}</div>
  ),
  LifecycleTabs: ({ onValueChange }) => (
    <button type="button" onClick={() => onValueChange("trash")}>
      Trash tab
    </button>
  ),
  ListHeader: ({ title, description, children }) => (
    <header>
      <h1>{title}</h1>
      <p>{description}</p>
      {children}
    </header>
  ),
}));

vi.mock("../list/filter.jsx", () => ({
  Filter: ({ activeFilters }) => (
    <div data-testid="programs-filter">{activeFilters.length}</div>
  ),
}));

vi.mock("../list/delete-alert.jsx", () => ({
  HardDeleteAlert: () => null,
  SoftDeleteAlert: () => null,
}));

vi.mock("../list/columns.jsx", () => ({
  useColumns: vi.fn(() => []),
}));

vi.mock("../list/use-filters.js", () => ({
  useProgramFilters: vi.fn(),
}));

vi.mock("@/modules/coach/lib/hooks/useCoachPrograms", () => ({
  useCoachPrograms: vi.fn(),
  useCoachProgramsMutations: vi.fn(),
}));

const setLifecycle = vi.fn();
const setPageQuery = vi.fn();
const reorderResources = vi.fn();

const setupFilters = (overrides = {}) => {
  vi.mocked(useProgramFilters).mockReturnValue({
    search: "hypertrophy",
    lifecycle: "active",
    setLifecycle,
    sortBy: "updatedAt",
    sortDir: "desc",
    currentPage: 2,
    pageSize: 10,
    setPageQuery,
    sorting: [{ id: "updatedAt", desc: true }],
    canReorder: false,
    filterFields: [],
    activeFilters: [
      { id: "q", field: "q", operator: "contains", values: ["hypertrophy"] },
    ],
    handleFiltersChange: vi.fn(),
    handleSortingChange: vi.fn(),
    ...overrides,
  });
};

const setupHooks = () => {
  vi.mocked(useCoachPrograms).mockReturnValue({
    data: {
      data: {
        data: [
          { id: 1, title: "Hypertrophy" },
          { id: 2, title: "Cutting" },
        ],
        meta: { total: 2, page: 2, pageSize: 10, totalPages: 2 },
      },
    },
    isLoading: false,
    isFetching: false,
    refetch: vi.fn(),
  });
  vi.mocked(useCoachProgramsMutations).mockReturnValue({
    removeMutation: { isPending: false },
    bulkHardDeleteMutation: { isPending: false },
    isMutating: false,
    bulkHardDeleteResources: vi.fn(),
    bulkRestoreResources: vi.fn(),
    bulkTrashResources: vi.fn(),
    removeResource: vi.fn(),
    reorderResources,
    restoreResource: vi.fn(),
  });
};

describe("ProgramsListPage", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("queries programs with URL filters and resets page on lifecycle change", () => {
    setupFilters();
    setupHooks();

    render(
      <MemoryRouter initialEntries={["/coach/programs/list"]}>
        <ProgramsListPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Dasturlar")).toBeInTheDocument();
    expect(screen.getByTestId("programs-filter")).toHaveTextContent("1");
    expect(useCoachPrograms).toHaveBeenCalledWith({
      q: "hypertrophy",
      lifecycle: "active",
      sortBy: "updatedAt",
      sortDir: "desc",
      page: 2,
      pageSize: 10,
    });

    fireEvent.click(screen.getByRole("button", { name: "Trash tab" }));

    expect(setLifecycle).toHaveBeenCalledWith("trash");
    expect(setPageQuery).toHaveBeenCalledWith("1");
  });

  it("sends reorder payload when drag sorting is enabled", async () => {
    setupFilters({
      search: "",
      sortBy: "orderKey",
      sortDir: "asc",
      currentPage: 1,
      sorting: [],
      canReorder: true,
      activeFilters: [],
    });
    setupHooks();

    render(
      <MemoryRouter initialEntries={["/coach/programs/list"]}>
        <ProgramsListPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Drag reorder" }));

    await waitFor(() => {
      expect(reorderResources).toHaveBeenCalledWith({
        movedId: "1",
        prevId: "2",
        nextId: undefined,
      });
    });
  });
});
