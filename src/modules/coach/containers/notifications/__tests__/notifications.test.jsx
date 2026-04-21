import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  useCoachNotifications,
  useCoachNotificationsMutations,
} from "@/modules/coach/lib/hooks/useCoachNotifications";
import { useNotificationFilters } from "../list/use-filters.js";
import NotificationsListPage from "../list/index.jsx";

vi.mock("@/components/reui/data-grid", () => ({
  DataGrid: ({ children, recordCount }) => (
    <div data-record-count={recordCount} data-testid="notifications-data-grid">
      {children}
    </div>
  ),
  DataGridColumnHeader: ({ title }) => <span>{title}</span>,
  DataGridContainer: ({ children }) => <div>{children}</div>,
  DataGridTable: () => <div data-testid="notifications-table">table</div>,
  DataGridTableRowSelect: () => <input aria-label="select row" readOnly />,
  DataGridTableRowSelectAll: () => <input aria-label="select all" readOnly />,
}));

vi.mock("@/components/reui/data-grid/data-grid-pagination", () => ({
  DataGridPagination: () => <div data-testid="notifications-pagination" />,
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
    <div data-testid="notifications-filter">{activeFilters.length}</div>
  ),
}));

vi.mock("../list/delete-alert.jsx", () => ({
  HardDeleteAlert: () => null,
  SoftDeleteAlert: () => null,
}));

vi.mock("../list/use-filters.js", () => ({
  useNotificationFilters: vi.fn(),
}));

vi.mock("@/modules/coach/lib/hooks/useCoachNotifications", () => ({
  useCoachNotifications: vi.fn(),
  useCoachNotificationsMutations: vi.fn(),
}));

const setLifecycle = vi.fn();
const setPageQuery = vi.fn();

const setupFilters = () => {
  vi.mocked(useNotificationFilters).mockReturnValue({
    search: "pay",
    type: "PAYMENT_REMINDER",
    read: "unread",
    lifecycle: "active",
    setLifecycle,
    sortBy: "createdAt",
    sortDir: "desc",
    currentPage: 2,
    pageSize: 10,
    setPageQuery,
    sorting: [{ id: "createdAt", desc: true }],
    filterFields: [],
    activeFilters: [
      { id: "q", field: "q", operator: "contains", values: ["pay"] },
      { id: "type", field: "type", operator: "eq", values: ["PAYMENT_REMINDER"] },
      { id: "read", field: "read", operator: "eq", values: ["unread"] },
    ],
    handleFiltersChange: vi.fn(),
    handleSortingChange: vi.fn(),
  });
};

const setupHooks = () => {
  vi.mocked(useCoachNotifications).mockReturnValue({
    data: {
      data: {
        data: [
          {
            id: 11,
            type: "PAYMENT_REMINDER",
            title: "To'lov muddati",
            message: "Mijozga eslatma yuboring",
            createdAt: "2026-04-20T10:00:00.000Z",
          },
        ],
        meta: { total: 1, page: 2, pageSize: 10, totalPages: 2 },
      },
    },
    isLoading: false,
    isFetching: false,
  });
  vi.mocked(useCoachNotificationsMutations).mockReturnValue({
    bulkHardDeleteMutation: { isPending: false },
    removeMutation: { isPending: false },
    isMutating: false,
    bulkHardDeleteResources: vi.fn(),
    bulkRestoreResources: vi.fn(),
    bulkTrashResources: vi.fn(),
    bulkUpdateStatus: vi.fn(),
    removeResource: vi.fn(),
    restoreResource: vi.fn(),
    updateResourceStatus: vi.fn(),
  });
};

describe("NotificationsListPage", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("queries notifications with unread/type/lifecycle filters and resets page on lifecycle change", () => {
    setupFilters();
    setupHooks();

    render(
      <MemoryRouter initialEntries={["/coach/notifications/list"]}>
        <NotificationsListPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Bildirishnomalar")).toBeInTheDocument();
    expect(screen.getByTestId("notifications-filter")).toHaveTextContent("3");
    expect(screen.getByTestId("notifications-data-grid")).toHaveAttribute(
      "data-record-count",
      "1",
    );
    expect(useCoachNotifications).toHaveBeenCalledWith({
      q: "pay",
      type: "PAYMENT_REMINDER",
      read: "unread",
      lifecycle: "active",
      sortBy: "createdAt",
      sortDir: "desc",
      page: 2,
      pageSize: 10,
    });

    fireEvent.click(screen.getByRole("button", { name: "Trash tab" }));

    expect(setLifecycle).toHaveBeenCalledWith("trash");
    expect(setPageQuery).toHaveBeenCalledWith("1");
  });
});
