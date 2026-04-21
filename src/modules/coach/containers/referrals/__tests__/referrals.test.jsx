import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  useCoachReferralDashboard,
  useCoachReferrals,
  useCoachReferralsMutations,
} from "@/modules/coach/lib/hooks/useCoachReferrals";
import { useReferralFilters } from "../list/use-filters.js";
import ReferralsListPage from "../list/index.jsx";

vi.mock("@/components/reui/data-grid", () => ({
  DataGrid: ({ children, recordCount }) => (
    <div data-record-count={recordCount} data-testid="referrals-data-grid">
      {children}
    </div>
  ),
  DataGridColumnHeader: ({ title }) => <span>{title}</span>,
  DataGridContainer: ({ children }) => <div>{children}</div>,
  DataGridTable: () => <div data-testid="referrals-table">table</div>,
  DataGridTableRowSelect: () => <input aria-label="select row" readOnly />,
  DataGridTableRowSelectAll: () => <input aria-label="select all" readOnly />,
}));

vi.mock("@/components/reui/data-grid/data-grid-pagination", () => ({
  DataGridPagination: () => <div data-testid="referrals-pagination" />,
}));

vi.mock("@/modules/coach/components/data-grid-helpers", () => ({
  ListHeader: ({ title, description, actions = [], children }) => (
    <header>
      <h1>{title}</h1>
      <p>{description}</p>
      {actions.map((action) => (
        <button
          key={action.key}
          type="button"
          onClick={action.onClick}
          disabled={action.disabled}
        >
          {action.label}
        </button>
      ))}
      {children}
    </header>
  ),
}));

vi.mock("../list/filter.jsx", () => ({
  Filter: ({ activeFilters }) => (
    <div data-testid="referrals-filter">{activeFilters.length}</div>
  ),
}));

vi.mock("../list/delete-alert.jsx", () => ({
  HardDeleteAlert: () => null,
  SoftDeleteAlert: () => null,
}));

vi.mock("../list/use-filters.js", () => ({
  useReferralFilters: vi.fn(),
}));

vi.mock("@/modules/coach/lib/hooks/useCoachReferrals", () => ({
  useCoachReferralDashboard: vi.fn(),
  useCoachReferrals: vi.fn(),
  useCoachReferralsMutations: vi.fn(),
}));

const setPageQuery = vi.fn();

describe("ReferralsListPage", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("queries referrals with coach referral filters and renders dashboard link", () => {
    vi.mocked(useReferralFilters).mockReturnValue({
      search: "ali",
      status: "active",
      event: "SIGNUP",
      sortBy: "createdAt",
      sortDir: "desc",
      currentPage: 3,
      pageSize: 10,
      setPageQuery,
      sorting: [{ id: "createdAt", desc: true }],
      filterFields: [],
      activeFilters: [
        { id: "q", field: "q", operator: "contains", values: ["ali"] },
        { id: "status", field: "status", operator: "eq", values: ["active"] },
        { id: "event", field: "event", operator: "eq", values: ["SIGNUP"] },
      ],
      handleFiltersChange: vi.fn(),
      handleSortingChange: vi.fn(),
    });
    vi.mocked(useCoachReferrals).mockReturnValue({
      data: {
        data: {
          data: [
            {
              id: "attr-7",
              referralCode: "ALI7",
              status: "ACTIVE",
              event: "SIGNUP",
            },
          ],
          meta: { total: 1, page: 3, pageSize: 10, totalPages: 3 },
        },
      },
      isLoading: false,
    });
    vi.mocked(useCoachReferralDashboard).mockReturnValue({
      data: {
        data: {
          referralCode: "coach-code",
          referralLink: "https://app.liveon.test/r/coach-code",
        },
      },
      isLoading: false,
    });
    vi.mocked(useCoachReferralsMutations).mockReturnValue({
      cancelMutation: { isPending: false },
      resendMutation: { isPending: false },
      cancelReferral: vi.fn(),
      resendReferral: vi.fn(),
      isMutating: false,
    });

    render(
      <MemoryRouter initialEntries={["/coach/referrals/list"]}>
        <ReferralsListPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Takliflar")).toBeInTheDocument();
    expect(
      screen.getByText("https://app.liveon.test/r/coach-code"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("referrals-filter")).toHaveTextContent("3");
    expect(screen.getByTestId("referrals-data-grid")).toHaveAttribute(
      "data-record-count",
      "1",
    );
    expect(useCoachReferrals).toHaveBeenCalledWith({
      q: "ali",
      status: "active",
      event: "SIGNUP",
      sortBy: "createdAt",
      sortDir: "desc",
      page: 3,
      pageSize: 10,
    });
  });
});
