import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  useCoachChallenges,
  useCoachChallengesMutations,
} from "@/modules/coach/lib/hooks/useCoachChallenges";
import { useChallengeFilters } from "../list/use-filters.js";
import ChallengesListPage from "../list/index.jsx";

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
    <div data-record-count={recordCount} data-testid="challenges-data-grid">
      {children}
    </div>
  ),
  DataGridContainer: ({ children }) => <div>{children}</div>,
  DataGridTable: () => <div data-testid="challenges-table">table</div>,
}));

vi.mock("@/components/reui/data-grid/data-grid-pagination", () => ({
  DataGridPagination: () => <div data-testid="challenges-pagination" />,
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
    <div data-testid="challenges-filter">{activeFilters.length}</div>
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
  useChallengeFilters: vi.fn(),
}));

vi.mock("@/modules/coach/lib/hooks/useCoachChallenges", () => ({
  useCoachChallenges: vi.fn(),
  useCoachChallengesMutations: vi.fn(),
}));

const setLifecycle = vi.fn();
const setPageQuery = vi.fn();

const setupFilters = () => {
  vi.mocked(useChallengeFilters).mockReturnValue({
    search: "summer",
    lifecycle: "active",
    setLifecycle,
    statusFilter: "ACTIVE",
    sortBy: "startDate",
    sortDir: "asc",
    currentPage: 2,
    pageSize: 10,
    setPageQuery,
    sorting: [{ id: "startDate", desc: false }],
    canReorder: false,
    filterFields: [],
    activeFilters: [
      { id: "q", field: "q", operator: "contains", values: ["summer"] },
      { id: "status", field: "status", operator: "is", values: ["ACTIVE"] },
    ],
    handleFiltersChange: vi.fn(),
    handleSortingChange: vi.fn(),
  });
};

const setupHooks = () => {
  vi.mocked(useCoachChallenges).mockReturnValue({
    data: {
      data: {
        data: [{ id: 8, title: "Summer challenge", status: "ACTIVE" }],
        meta: { total: 1, page: 2, pageSize: 10, totalPages: 2 },
      },
    },
    isLoading: false,
    isFetching: false,
    refetch: vi.fn(),
  });
  vi.mocked(useCoachChallengesMutations).mockReturnValue({
    removeMutation: { isPending: false },
    bulkHardDeleteMutation: { isPending: false },
    isMutating: false,
    bulkHardDeleteResources: vi.fn(),
    bulkRestoreResources: vi.fn(),
    bulkTrashResources: vi.fn(),
    removeResource: vi.fn(),
    restoreResource: vi.fn(),
  });
};

describe("ChallengesListPage", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("queries challenges with status filters and resets page on lifecycle change", () => {
    setupFilters();
    setupHooks();

    render(
      <MemoryRouter initialEntries={["/coach/challenges/list"]}>
        <ChallengesListPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Musobaqalar")).toBeInTheDocument();
    expect(screen.getByTestId("challenges-filter")).toHaveTextContent("2");
    expect(useCoachChallenges).toHaveBeenCalledWith({
      q: "summer",
      lifecycle: "active",
      status: "ACTIVE",
      sortBy: "startDate",
      sortDir: "asc",
      page: 2,
      pageSize: 10,
    });

    fireEvent.click(screen.getByRole("button", { name: "Trash tab" }));

    expect(setLifecycle).toHaveBeenCalledWith("trash");
    expect(setPageQuery).toHaveBeenCalledWith("1");
  });
});
