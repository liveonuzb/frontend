import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  useCoachClients,
  useCoachPayments,
  useCoachPaymentStats,
} from "@/modules/coach/lib/hooks";
import CoachEarningsContainer from "../index.jsx";

vi.mock("@/components/page-transition", () => ({
  default: ({ children, className }) => <div className={className}>{children}</div>,
}));

vi.mock("@/components/ui/chart.jsx", () => ({
  ChartContainer: ({ children, className }) => (
    <div className={className} data-testid="chart-container">
      {children}
    </div>
  ),
  ChartTooltip: () => null,
  ChartTooltipContent: () => null,
}));

vi.mock("recharts", async () => {
  const ReactModule = await import("react");
  const Passthrough = ({ children }) =>
    ReactModule.createElement("div", null, children);
  const Empty = () => null;

  return {
    Area: Empty,
    AreaChart: Passthrough,
    Bar: Empty,
    BarChart: Passthrough,
    CartesianGrid: Empty,
    Cell: Empty,
    Pie: Passthrough,
    PieChart: Passthrough,
    XAxis: Empty,
    YAxis: Empty,
  };
});

vi.mock("@/modules/coach/lib/hooks", () => ({
  useCoachClients: vi.fn(),
  useCoachPayments: vi.fn(),
  useCoachPaymentStats: vi.fn(),
}));

const statsFixture = {
  revenue: {
    total: 1500000,
    currentMonth: 900000,
    lastMonth: 600000,
    expectedCurrentMonth: 1100000,
    growth: 50,
  },
  balance: {
    available: 400000,
  },
  counts: {
    completed: 2,
    pending: 1,
    overdue: 1,
    cancelled: 0,
    refunded: 0,
  },
};

const paymentsFixture = [
  {
    id: "pay-1",
    status: "completed",
    amount: 900000,
    method: "cash",
    paidAt: new Date().toISOString(),
    clientId: "client-1",
    client: { id: "client-1", name: "Jasur Karimov" },
  },
  {
    id: "pay-2",
    status: "pending",
    amount: 200000,
    method: "card",
    paidAt: "2026-04-01T08:00:00.000Z",
    clientId: "client-2",
    client: { id: "client-2", name: "Dilnoza Aliyeva" },
  },
];

const clientsFixture = [
  {
    id: "client-2",
    name: "Dilnoza Aliyeva",
    roomId: "room-1",
    paymentSummary: {
      status: "due",
      agreedAmount: 200000,
      dueDate: "2026-04-22T00:00:00.000Z",
    },
  },
];

describe("CoachEarningsContainer", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("keeps earnings as a reporting view with stats, trends, payments, and reminders", () => {
    vi.mocked(useCoachPaymentStats).mockReturnValue({
      stats: statsFixture,
      isLoading: false,
      refetch: vi.fn(),
    });
    vi.mocked(useCoachPayments).mockReturnValue({
      data: { data: { data: paymentsFixture } },
      isLoading: false,
    });
    vi.mocked(useCoachClients).mockReturnValue({
      data: { data: { data: clientsFixture } },
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={["/coach/earnings"]}>
        <CoachEarningsContainer />
      </MemoryRouter>,
    );

    expect(screen.getByText("Daromad")).toBeInTheDocument();
    expect(screen.getByText("Umumiy daromad")).toBeInTheDocument();
    expect(screen.getByText("1 500 000 so'm")).toBeInTheDocument();
    expect(screen.getByText("Joriy oy kunlik daromad")).toBeInTheDocument();
    expect(screen.getByText("Top clientlar")).toBeInTheDocument();
    expect(screen.getAllByText("Jasur Karimov")[0]).toBeInTheDocument();
    expect(screen.getByText("So'nggi to'lovlar")).toBeInTheDocument();
    expect(screen.getByText("To'lov eslatmalari")).toBeInTheDocument();
    expect(screen.getAllByText("Dilnoza Aliyeva")[0]).toBeInTheDocument();
  });
});
