import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { useGetQuery } from "@/hooks/api";
import DashboardOverview from ".";

vi.mock("@/hooks/api", () => ({
  useGetQuery: vi.fn(),
}));

vi.mock("@/store", () => ({
  useBreadcrumbStore: () => ({ setBreadcrumbs: vi.fn() }),
}));

vi.mock("@/modules/admin/lib/permissions.js", () => ({
  useAdminPermissions: () => ({
    roles: ["SUPER_ADMIN"],
    canManageSupport: true,
    canManageSettings: true,
    canReadSupport: true,
    canReadContent: true,
    canReadFinance: true,
    canManageContent: true,
  }),
}));

vi.mock("@/components/page-transition", () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/chart.jsx", () => ({
  ChartContainer: ({ children }) => <div>{children}</div>,
  ChartTooltip: () => null,
  ChartTooltipContent: () => null,
}));

vi.mock("recharts", () => ({
  Area: () => null,
  AreaChart: ({ children }) => <div>{children}</div>,
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

const dashboardResponse = {
  data: {
    data: {
      metrics: {
        totalUsers: 12,
        totalFoods: 80,
        usersToday: 2,
        totalAdmins: 1,
        totalLanguages: 3,
      },
      recentActivities: [],
      recentAuditLogs: [],
      systemHealth: [],
      premium: {
        stats: {
          activeSubscribers: 4,
          mrr: 120000,
          monthlySubscribers: 3,
          churnRate: 2.5,
        },
        plans: [],
        trend: [],
      },
      growthFunnel: {
        rangeDays: 30,
        onboardingStarted: 10,
        onboardingCompleted: 7,
        onboardingCompletionRate: 70,
        events: {
          landingCtaClicked: 30,
          signupStarted: 18,
          otpVerified: 14,
          personalizationSucceeded: 9,
          premiumCheckoutOpened: 4,
          premiumCheckoutSucceeded: 2,
        },
      },
      retention: {
        activeUsers: {
          day1: 3,
          day3: 7,
          day7: 11,
        },
      },
      referrals: {
        total: 9,
        active: 4,
        activationRate: 44.4,
      },
    },
  },
};

describe("Admin dashboard launch overview", () => {
  it("renders launch funnel, retention, and referral snapshots", () => {
    vi.mocked(useGetQuery)
      .mockReturnValueOnce({ data: dashboardResponse, isLoading: false })
      .mockReturnValueOnce({
        data: { data: { status: "ok", version: "test" } },
        isLoading: false,
        isError: false,
      });

    render(
      <MemoryRouter>
        <DashboardOverview />
      </MemoryRouter>,
    );

    expect(screen.getByText("Launch funnel")).toBeInTheDocument();
    expect(screen.getByText("Landing CTA")).toBeInTheDocument();
    expect(screen.getByText("D7 active")).toBeInTheDocument();
    expect(screen.getByText("Referral activation")).toBeInTheDocument();
  });
});
