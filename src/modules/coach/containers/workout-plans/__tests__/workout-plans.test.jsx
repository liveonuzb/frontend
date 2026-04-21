import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  useCoachWorkoutPlans,
  useCoachWorkoutPlansMutations,
} from "@/modules/coach/lib/hooks/useCoachWorkoutPlans";
import { useWorkoutPlanFilters } from "../list/use-filters.js";
import WorkoutPlansListPage from "../list/index.jsx";

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
    <div data-record-count={recordCount} data-testid="workout-plans-data-grid">
      {children}
    </div>
  ),
  DataGridContainer: ({ children }) => <div>{children}</div>,
  DataGridTable: () => <div data-testid="workout-plans-table">table</div>,
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
  DataGridPagination: () => <div data-testid="workout-plans-pagination" />,
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
    <div data-testid="workout-plans-filter">{activeFilters.length}</div>
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
  useWorkoutPlanFilters: vi.fn(),
}));

vi.mock("@/modules/coach/lib/hooks/useCoachWorkoutPlans", () => ({
  useCoachWorkoutPlans: vi.fn(),
  useCoachWorkoutPlansMutations: vi.fn(),
}));

const setLifecycle = vi.fn();
const setPageQuery = vi.fn();
const reorderResources = vi.fn();

const setupFilters = (overrides = {}) => {
  vi.mocked(useWorkoutPlanFilters).mockReturnValue({
    search: "strength",
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
      { id: "q", field: "q", operator: "contains", values: ["strength"] },
    ],
    handleFiltersChange: vi.fn(),
    handleSortingChange: vi.fn(),
    ...overrides,
  });
};

const setupHooks = () => {
  vi.mocked(useCoachWorkoutPlans).mockReturnValue({
    data: {
      data: {
        data: [
          { id: 1, title: "Strength plan" },
          { id: 2, title: "Mobility plan" },
        ],
        meta: { total: 2, page: 2, pageSize: 10, totalPages: 2 },
      },
    },
    isLoading: false,
    isFetching: false,
    refetch: vi.fn(),
  });
  vi.mocked(useCoachWorkoutPlansMutations).mockReturnValue({
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

describe("WorkoutPlansListPage", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("queries workout plans with URL filters and resets page on lifecycle change", () => {
    setupFilters();
    setupHooks();

    render(
      <MemoryRouter initialEntries={["/coach/workout-plans/list"]}>
        <WorkoutPlansListPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Mashq rejalari")).toBeInTheDocument();
    expect(screen.getByTestId("workout-plans-filter")).toHaveTextContent("1");
    expect(useCoachWorkoutPlans).toHaveBeenCalledWith({
      q: "strength",
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
      <MemoryRouter initialEntries={["/coach/workout-plans/list"]}>
        <WorkoutPlansListPage />
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
