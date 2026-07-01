import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DailyMetricDetailPage from "./index.jsx";

const mocks = vi.hoisted(() => ({
  setBreadcrumbs: vi.fn(),
  setSteps: vi.fn(),
  setSleep: vi.fn(),
  setGoal: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  useGetQuery: vi.fn(),
  useHealthSync: vi.fn(),
  useDailyTrackingDay: vi.fn(),
  useDailyTrackingActions: vi.fn(),
  useHealthGoals: vi.fn(),
}));

vi.mock("@/store", () => ({
  useBreadcrumbStore: () => ({ setBreadcrumbs: mocks.setBreadcrumbs }),
}));

vi.mock("@/components/page-transition", () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock("@/components/charts/bar-chart.jsx", () => ({
  default: ({ dataKey, data }) => (
    <div data-testid={`bar-chart-${dataKey}`}>{data.length}</div>
  ),
}));

vi.mock("@/hooks/api", () => ({
  useGetQuery: (...args) => mocks.useGetQuery(...args),
}));

vi.mock("@/hooks/app/use-health-sync", () => ({
  default: (...args) => mocks.useHealthSync(...args),
}));

vi.mock("@/hooks/app/use-daily-tracking", () => ({
  useDailyTrackingDay: (...args) => mocks.useDailyTrackingDay(...args),
  useDailyTrackingActions: (...args) => mocks.useDailyTrackingActions(...args),
}));

vi.mock("@/hooks/app/use-health-goals", () => ({
  default: (...args) => mocks.useHealthGoals(...args),
}));

vi.mock("sonner", () => ({
  toast: {
    success: (...args) => mocks.toastSuccess(...args),
    error: (...args) => mocks.toastError(...args),
  },
}));

const report = {
  period: {
    days: 30,
    startDate: "2026-05-20",
    endDate: "2026-06-18",
  },
  daysCalendar: [
    { date: "2026-06-16" },
    { date: "2026-06-17" },
    { date: "2026-06-18" },
  ],
  trends: {
    steps: [5000, 8200, 9000],
    sleepHours: [6.5, 7.25, 8],
  },
  averages: {
    steps: { value: 7400, goal: 10000, unit: "qadam", deltaPct: 12 },
    sleep: { value: 7.3, goal: 8, unit: "soat", deltaPct: 4 },
  },
};

const setupHookMocks = ({
  steps = 6400,
  sleepHours = 7.25,
  goals = { steps: 10000, sleepHours: 8 },
} = {}) => {
  mocks.useDailyTrackingDay.mockReturnValue({
    dayData: { date: "2026-06-18", steps, sleepHours },
    isLoading: false,
  });
  mocks.useDailyTrackingActions.mockReturnValue({
    setSteps: mocks.setSteps,
    setSleep: mocks.setSleep,
  });
  mocks.useHealthGoals.mockReturnValue({
    goals,
    setGoal: mocks.setGoal,
    isSaving: false,
  });
  mocks.useHealthSync.mockReturnValue({
    status: {
      google: {
        connected: false,
        status: "disconnected",
        lastSyncAt: null,
        lastError: null,
      },
    },
    isLoading: false,
    isConnecting: false,
    isSyncing: false,
    isDisconnecting: false,
    connectGoogle: vi.fn(),
    syncGoogle: vi.fn(),
    disconnectGoogle: vi.fn(),
  });
  mocks.useGetQuery.mockReturnValue({
    data: { data: report },
    isLoading: false,
  });
};

const renderMetricPage = (metric) =>
  render(
    <MemoryRouter initialEntries={[`/user/${metric}?date=2026-06-18`]}>
      <DailyMetricDetailPage metric={metric} />
    </MemoryRouter>,
  );

describe("DailyMetricDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupHookMocks();
  });

  it("renders and saves the step detail page with goal editing", async () => {
    renderMetricPage("steps");

    expect(screen.getByRole("heading", { name: "Qadamlar" })).toBeInTheDocument();
    expect(screen.getByText("6,400")).toBeInTheDocument();
    expect(screen.getByText("30 kunlik trend")).toBeInTheDocument();
    expect(screen.getByTestId("bar-chart-steps")).toHaveTextContent("3");
    expect(screen.getByText("Google Health")).toBeInTheDocument();
    expect(screen.getByText("Apple Health")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Google Health ulash" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "iOS app bilan keyingi bosqichda" })).toBeDisabled();
    expect(screen.getByText("Maqsad bajarilgan kunlar")).toBeInTheDocument();
    expect(screen.queryByLabelText("Bugungi qadamlar")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Kiritish" }));
    fireEvent.change(screen.getByLabelText("Bugungi qadamlar"), {
      target: { value: "9000" },
    });
    fireEvent.change(screen.getByLabelText("Kunlik qadam maqsadi"), {
      target: { value: "11000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Saqlash" }));

    await waitFor(() => {
      expect(mocks.setSteps).toHaveBeenCalledWith("2026-06-18", 9000);
      expect(mocks.setGoal).toHaveBeenCalledWith("steps", 11000);
    });
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Qadamlar saqlandi");
  });

  it("starts Google Health connection from the metric sync card", async () => {
    const connectGoogle = vi.fn().mockResolvedValue({});
    mocks.useHealthSync.mockReturnValue({
      status: {
        google: {
          connected: false,
          status: "disconnected",
          lastSyncAt: null,
          lastError: null,
        },
      },
      isLoading: false,
      isConnecting: false,
      isSyncing: false,
      isDisconnecting: false,
      connectGoogle,
      syncGoogle: vi.fn(),
      disconnectGoogle: vi.fn(),
    });
    renderMetricPage("steps");
    fireEvent.click(screen.getByRole("button", { name: "Google Health ulash" }));

    await waitFor(() => {
      expect(connectGoogle).toHaveBeenCalled();
    });
  });

  it("renders and saves the sleep detail page with goal editing", async () => {
    renderMetricPage("sleep");

    expect(screen.getByRole("heading", { name: "Uyqu" })).toBeInTheDocument();
    expect(screen.getAllByText("7 soat 15 daq").length).toBeGreaterThan(0);
    expect(screen.getByTestId("bar-chart-sleepHours")).toHaveTextContent("3");
    expect(screen.getByText("Eng yaxshi tun")).toBeInTheDocument();
    expect(screen.queryByLabelText("Bugungi uyqu")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Kiritish" }));
    fireEvent.change(screen.getByLabelText("Bugungi uyqu"), {
      target: { value: "8" },
    });
    fireEvent.change(screen.getByLabelText("Uyqu maqsadi"), {
      target: { value: "8.5" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Saqlash" }));

    await waitFor(() => {
      expect(mocks.setSleep).toHaveBeenCalledWith("2026-06-18", 8);
      expect(mocks.setGoal).toHaveBeenCalledWith("sleepHours", 8.5);
    });
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Uyqu saqlandi");
  });
});
