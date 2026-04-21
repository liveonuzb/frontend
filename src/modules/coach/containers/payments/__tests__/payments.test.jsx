import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  useCoachPayments,
  useCoachPaymentsMutations,
  useCoachPaymentStats,
} from "@/modules/coach/lib/hooks/useCoachPayments";
import coachPaymentsApi from "@/modules/coach/lib/api/coach-payments-api";
import { usePaymentFilters } from "../list/use-filters.js";
import PaymentsListPage from "../list/index.jsx";

vi.mock("@/store", () => ({
  useBreadcrumbStore: () => ({ setBreadcrumbs: vi.fn() }),
}));

vi.mock("@/hooks/api/use-api", () => ({
  api: { post: vi.fn() },
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@/components/reui/data-grid", () => ({
  DataGrid: ({ children, recordCount }) => (
    <div data-record-count={recordCount} data-testid="payments-data-grid">
      {children}
    </div>
  ),
  DataGridColumnHeader: ({ title }) => <span>{title}</span>,
  DataGridContainer: ({ children }) => <div>{children}</div>,
  DataGridTable: () => <div data-testid="payments-table">table</div>,
  DataGridTableRowSelect: () => <input aria-label="select row" readOnly />,
  DataGridTableRowSelectAll: () => <input aria-label="select all" readOnly />,
}));

vi.mock("@/components/reui/data-grid/data-grid-pagination", () => ({
  DataGridPagination: () => <div data-testid="payments-pagination" />,
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
  ListHeader: ({ title, description, actions = [], children }) => (
    <header>
      <h1>{title}</h1>
      <p>{description}</p>
      {actions.map((action) => (
        <button
          key={action.key}
          type="button"
          disabled={action.disabled}
          onClick={action.onClick}
        >
          {action.label}
        </button>
      ))}
      {children}
    </header>
  ),
}));

vi.mock("../components/payment-stats-bar", () => ({
  default: () => <div data-testid="payment-stats" />,
}));

vi.mock("../components/payment-add-drawer", () => ({
  default: () => null,
}));

vi.mock("../components/payment-edit-drawer", () => ({
  default: () => null,
}));

vi.mock("../components/payment-cancel-drawer", () => ({
  default: () => null,
}));

vi.mock("../components/payment-refund-drawer", () => ({
  default: () => null,
}));

vi.mock("../list/filter.jsx", () => ({
  Filter: ({ activeFilters }) => (
    <div data-testid="payments-filter">{activeFilters.length}</div>
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
  usePaymentFilters: vi.fn(),
}));

vi.mock("@/modules/coach/lib/hooks/useCoachPayments", () => ({
  useCoachPayments: vi.fn(),
  useCoachPaymentsMutations: vi.fn(),
  useCoachPaymentStats: vi.fn(),
}));

vi.mock("@/modules/coach/lib/api/coach-payments-api", () => ({
  default: {
    exportData: vi.fn(),
  },
}));

const setLifecycle = vi.fn();
const setPageQuery = vi.fn();
const refetch = vi.fn();

const setupFilters = () => {
  vi.mocked(usePaymentFilters).mockReturnValue({
    search: "ali",
    selectedMonth: "2026-04",
    lifecycle: "active",
    setLifecycle,
    status: "completed",
    method: "CASH",
    sortBy: "paidAt",
    sortDir: "desc",
    currentPage: 2,
    pageSize: 10,
    setPageQuery,
    sorting: [{ id: "paidAt", desc: true }],
    filterFields: [],
    activeFilters: [
      { id: "q", field: "q", operator: "contains", values: ["ali"] },
      { id: "month", field: "month", operator: "is", values: ["2026-04"] },
      { id: "status", field: "status", operator: "is", values: ["completed"] },
      { id: "method", field: "method", operator: "is", values: ["CASH"] },
    ],
    handleFiltersChange: vi.fn(),
    handleSortingChange: vi.fn(),
  });
};

const setupHooks = () => {
  vi.mocked(useCoachPayments).mockReturnValue({
    data: {
      data: {
        data: [
          {
            id: 41,
            amount: 250000,
            client: { name: "Ali Valiyev" },
            method: "CASH",
            status: "completed",
            paidAt: "2026-04-17T00:00:00.000Z",
          },
        ],
        meta: { total: 1, page: 2, pageSize: 10, totalPages: 2 },
      },
    },
    isLoading: false,
    isFetching: false,
    refetch,
  });
  vi.mocked(useCoachPaymentsMutations).mockReturnValue({
    createMutation: { isPending: false },
    updateMutation: { isPending: false },
    removeMutation: { isPending: false },
    updateStatusMutation: { isPending: false },
    bulkHardDeleteMutation: { isPending: false },
    isMutating: false,
    bulkHardDeleteResources: vi.fn(),
    bulkRestoreResources: vi.fn(),
    bulkTrashResources: vi.fn(),
    createResource: vi.fn(),
    removeResource: vi.fn(),
    restoreResource: vi.fn(),
    updateResource: vi.fn(),
    updateResourceStatus: vi.fn(),
  });
  vi.mocked(useCoachPaymentStats).mockReturnValue({
    stats: { paid: 250000 },
    isLoading: false,
  });
};

describe("PaymentsListPage", () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => "blob:payments");
    URL.revokeObjectURL = vi.fn();
    HTMLAnchorElement.prototype.click = vi.fn();
    vi.mocked(coachPaymentsApi.exportData).mockResolvedValue({
      data: "id,amount\n41,250000\n",
      headers: { "content-type": "text/csv" },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("queries payments with URL filters and exports current view as CSV", async () => {
    setupFilters();
    setupHooks();

    render(
      <MemoryRouter initialEntries={["/coach/payments/list"]}>
        <PaymentsListPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("To'lovlar")).toBeInTheDocument();
    expect(screen.getByTestId("payments-filter")).toHaveTextContent("4");
    expect(screen.getByTestId("payments-data-grid")).toHaveAttribute(
      "data-record-count",
      "1",
    );
    expect(useCoachPayments).toHaveBeenCalledWith({
      q: "ali",
      month: "2026-04",
      status: "completed",
      method: "CASH",
      lifecycle: "active",
      sortBy: "paidAt",
      sortDir: "desc",
      page: 2,
      pageSize: 10,
    });

    fireEvent.click(screen.getByRole("button", { name: "CSV eksport" }));

    await waitFor(() => {
      expect(coachPaymentsApi.exportData).toHaveBeenCalledWith(
        {
          q: "ali",
          month: "2026-04",
          status: "completed",
          method: "CASH",
          lifecycle: "active",
          sortBy: "paidAt",
          sortDir: "desc",
          page: 2,
          pageSize: 10,
        },
        { responseType: "blob" },
      );
    });
  });

  it("resets pagination when lifecycle changes", () => {
    setupFilters();
    setupHooks();

    render(
      <MemoryRouter initialEntries={["/coach/payments/list"]}>
        <PaymentsListPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Trash tab" }));

    expect(setLifecycle).toHaveBeenCalledWith("trash");
    expect(setPageQuery).toHaveBeenCalledWith("1");
  });
});
