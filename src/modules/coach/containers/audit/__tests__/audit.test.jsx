import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCoachAuditLogs } from "@/modules/coach/lib/hooks";
import AuditLogsListPage from "../list/index.jsx";
import { useAuditFilters } from "../list/use-filters";

vi.mock("@/components/reui/data-grid", () => ({
  DataGrid: ({ children, recordCount }) => (
    <div data-record-count={recordCount} data-testid="audit-data-grid">
      {children}
    </div>
  ),
  DataGridColumnHeader: ({ title }) => <span>{title}</span>,
  DataGridContainer: ({ children }) => <div>{children}</div>,
  DataGridTable: () => <div data-testid="audit-table">table</div>,
}));

vi.mock("@/components/reui/data-grid/data-grid-pagination", () => ({
  DataGridPagination: () => <div data-testid="audit-pagination" />,
}));

vi.mock("@/modules/coach/components/data-grid-helpers", () => ({
  ListHeader: ({ title, description }) => (
    <header>
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  ),
}));

vi.mock("../list/filter.jsx", () => ({
  Filter: ({ activeFilters }) => (
    <div data-testid="audit-filter">{activeFilters.length}</div>
  ),
}));

vi.mock("../list/use-filters", () => ({
  useAuditFilters: vi.fn(),
}));

vi.mock("@/modules/coach/lib/hooks", () => ({
  useCoachAuditLogs: vi.fn(),
}));

describe("AuditLogsListPage", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("queries coach audit logs with URL filters", () => {
    vi.mocked(useAuditFilters).mockReturnValue({
      search: "payment",
      entityType: "PAYMENT",
      action: "UPDATE",
      sortBy: "createdAt",
      sortDir: "desc",
      currentPage: 2,
      pageSize: 10,
      setPageQuery: vi.fn(),
      sorting: [{ id: "createdAt", desc: true }],
      filterFields: [],
      activeFilters: [
        { id: "q", field: "q", operator: "contains", values: ["payment"] },
        { id: "entityType", field: "entityType", operator: "eq", values: ["PAYMENT"] },
        { id: "action", field: "action", operator: "eq", values: ["UPDATE"] },
      ],
      handleFiltersChange: vi.fn(),
      handleSortingChange: vi.fn(),
    });
    vi.mocked(useCoachAuditLogs).mockReturnValue({
      data: {
        data: {
          data: [
            {
              id: "log-1",
              entityType: "PAYMENT",
              action: "UPDATE",
              summary: "Payment updated",
              createdAt: "2026-04-20T08:00:00.000Z",
            },
          ],
          meta: { total: 1, page: 2, pageSize: 10, totalPages: 2 },
        },
      },
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={["/coach/audit-logs/list"]}>
        <AuditLogsListPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Audit loglari")).toBeInTheDocument();
    expect(screen.getByTestId("audit-filter")).toHaveTextContent("3");
    expect(screen.getByTestId("audit-data-grid")).toHaveAttribute(
      "data-record-count",
      "1",
    );
    expect(useCoachAuditLogs).toHaveBeenCalledWith({
      q: "payment",
      entityType: "PAYMENT",
      action: "UPDATE",
      sortBy: "createdAt",
      sortDir: "desc",
      page: 2,
      pageSize: 10,
    });
  });
});
