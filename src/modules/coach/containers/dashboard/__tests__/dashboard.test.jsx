import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/store";
import { useCoachDashboardStore } from "@/modules/coach/store";
import {
  useCoachDashboard,
  useCoachReferralDashboard,
  useCoachWorkoutPlans,
} from "@/modules/coach/lib/hooks";
import CoachDashboardContainer from "../index.jsx";

vi.mock("@/components/page-transition", () => ({
  default: ({ children }) => <>{children}</>,
}));

vi.mock("@/components/charts/line-chart", () => ({
  default: ({ data }) => (
    <div data-testid="payment-chart">
      {data.map((item) => `${item.label}:${item.amount}`).join(",")}
    </div>
  ),
}));

vi.mock("@/modules/coach/lib/hooks", () => ({
  useCoachDashboard: vi.fn(),
  useCoachWorkoutPlans: vi.fn(),
  useCoachReferralDashboard: vi.fn(),
}));

const respondToInvitation = vi.fn();

const dashboardFixture = {
  metrics: {
    totalClients: 8,
    activeClients: 6,
    pendingInvitations: 1,
    totalTemplates: 3,
    averageProgress: 72,
    monthlyRevenue: 1200000,
    prevMonthRevenue: 800000,
    monthlyPaymentCount: 4,
    overduePayments: 0,
    duePayments: 1,
  },
  recentClients: [
    {
      id: "client-1",
      name: "Jasur Karimov",
      status: "active",
      progress: 81,
      goal: "Vazn kamaytirish",
    },
  ],
  overdueClients: [],
  pendingInvitations: [
    {
      id: "invite-1",
      initiatedByCoach: false,
      client: {
        name: "Dilnoza Aliyeva",
        email: "dilnoza@example.com",
      },
    },
  ],
  templates: [
    {
      id: "meal-1",
      title: "Mass gain",
      mealsCount: 4,
      daysWithMeals: 7,
      source: "manual",
    },
  ],
  alerts: [
    {
      id: "alert-1",
      title: "Payment overdue",
      message: "Client needs attention",
      severity: "medium",
      clientId: "client-1",
    },
  ],
  paymentChart: {
    week: [{ label: "Du", amount: 10 }],
    month: [{ label: "1", amount: 20 }],
    year: [{ label: "Yan", amount: 30 }],
  },
};

const renderDashboard = () =>
  render(
    <MemoryRouter initialEntries={["/coach/dashboard"]}>
      <CoachDashboardContainer />
    </MemoryRouter>,
  );

describe("CoachDashboardContainer", () => {
  afterEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: null });
    useCoachDashboardStore.setState({
      timeRange: "30d",
      timezone: "Asia/Tashkent",
      chartPeriod: "month",
    });
  });

  it("uses dashboard store filters with the cached dashboard hook", async () => {
    useAuthStore.setState({
      user: {
        firstName: "Ali",
        lastName: "Valiyev",
        email: "ali@example.com",
      },
    });
    useCoachDashboardStore.setState({
      timeRange: "90d",
      timezone: "Asia/Tashkent",
      chartPeriod: "week",
    });
    vi.mocked(useCoachDashboard).mockReturnValue({
      dashboard: dashboardFixture,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      respondToInvitation,
    });
    vi.mocked(useCoachWorkoutPlans).mockReturnValue({
      data: {
        data: {
          data: [
            {
              id: "workout-1",
              name: "Strength block",
              totalExercises: 12,
              daysWithWorkouts: 4,
              assignedClients: ["client-1"],
            },
          ],
        },
      },
      isLoading: false,
    });
    vi.mocked(useCoachReferralDashboard).mockReturnValue({
      data: {
        data: {
          referralLink: "https://liveon.uz/join?ref=coach",
          stats: { clicks: 5, signups: 2, paidConversions: 1 },
        },
      },
      isLoading: false,
    });

    renderDashboard();

    expect(screen.getByText("Ali Valiyev")).toBeInTheDocument();
    expect(screen.getByText("Jami mijozlar")).toBeInTheDocument();
    expect(screen.getByText("Jasur Karimov")).toBeInTheDocument();
    expect(screen.getByTestId("payment-chart")).toHaveTextContent("Du:10");
    expect(useCoachDashboard).toHaveBeenLastCalledWith({
      timeRange: "90d",
      timezone: "Asia/Tashkent",
    });
  });

  it("responds to pending invitations from the notifications panel", async () => {
    useAuthStore.setState({ user: { email: "coach@example.com" } });
    vi.mocked(useCoachDashboard).mockReturnValue({
      dashboard: dashboardFixture,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      respondToInvitation,
    });
    vi.mocked(useCoachWorkoutPlans).mockReturnValue({
      data: { data: { data: [] } },
      isLoading: false,
    });
    vi.mocked(useCoachReferralDashboard).mockReturnValue({
      data: { data: { referralLink: "", stats: {} } },
      isLoading: false,
    });
    respondToInvitation.mockResolvedValue({});

    renderDashboard();

    fireEvent.click(screen.getByRole("button", { name: /Qabul/i }));

    await waitFor(() => {
      expect(respondToInvitation).toHaveBeenCalledWith("invite-1", "accept");
    });
  });
});
