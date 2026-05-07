import React from "react";
import { get } from "lodash";
import PageTransition from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthStore, useBreadcrumbStore } from "@/store";
import { useCoachDashboardStore } from "@/modules/coach/store";
import {
  useCoachDashboard,
  useCoachWorkoutPlans,
} from "@/modules/coach/lib/hooks";
import DashboardStatsCards from "./components/DashboardStatsCards.jsx";
import NotificationsPanel from "./components/NotificationsPanel.jsx";
import OperationsWorkspace from "./components/OperationsWorkspace.jsx";
import QuickActionsPanel from "./components/QuickActionsPanel.jsx";
import RecentActivityPanel from "./components/RecentActivityPanel.jsx";
import ReferralCard from "./components/ReferralCard.jsx";

const DASHBOARD_RANGE_OPTIONS = [
  { value: "7d", label: "7 kun" },
  { value: "30d", label: "30 kun" },
  { value: "90d", label: "90 kun" },
  { value: "12m", label: "12 oy" },
];

const resolveListPayload = (data) => {
  const nestedList = get(data, "data.data");
  if (Array.isArray(nestedList)) return nestedList;

  const directList = get(data, "data");
  if (Array.isArray(directList)) return directList;

  return [];
};

export default function CoachDashboardContainer() {
  const { setBreadcrumbs } = useBreadcrumbStore();
  const user = useAuthStore((state) => state.user);
  const timeRange = useCoachDashboardStore((state) => state.timeRange);
  const timezone = useCoachDashboardStore((state) => state.timezone);
  const chartPeriod = useCoachDashboardStore((state) => state.chartPeriod);
  const setTimeRange = useCoachDashboardStore((state) => state.setTimeRange);
  const setChartPeriod = useCoachDashboardStore(
    (state) => state.setChartPeriod,
  );

  const dashboardParams = React.useMemo(
    () => ({
      timeRange,
      timezone,
    }),
    [timeRange, timezone],
  );

  const { dashboard, isLoading, isError, refetch, respondToInvitation } =
    useCoachDashboard(dashboardParams);

  const { data: workoutPlansData, isLoading: isWorkoutPlansLoading } =
    useCoachWorkoutPlans({ pageSize: 3 }, { staleTime: 30000 });

  React.useEffect(() => {
    setBreadcrumbs([{ url: "/coach", title: "Dashboard" }]);
  }, [setBreadcrumbs]);

  const metrics = dashboard.metrics;
  const recentClients = dashboard.recentClients;
  const overdueClients = dashboard.overdueClients;
  const templates = dashboard.templates;
  const pendingInvitations = dashboard.pendingInvitations;
  const recentCheckIns = dashboard.recentCheckIns;
  const alerts = dashboard.alerts;
  const operationalKpis = dashboard.operationalKpis;
  const paymentCharts = dashboard.paymentChart;
  const paymentChartData = paymentCharts[chartPeriod] || [];
  const workoutPlans = resolveListPayload(workoutPlansData);

  const coachName =
    [get(user, "firstName"), get(user, "lastName")]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    get(user, "email") ||
    "Coach";

  const handleTimeRangeChange = React.useCallback(
    (nextTimeRange) => {
      React.startTransition(() => {
        setTimeRange(nextTimeRange);
      });
    },
    [setTimeRange],
  );

  const handleChartPeriodChange = React.useCallback(
    (nextChartPeriod) => {
      React.startTransition(() => {
        setChartPeriod(nextChartPeriod);
      });
    },
    [setChartPeriod],
  );

  if (isError) {
    return (
      <Card className="mx-auto mt-10 max-w-md rounded-3xl p-6 text-center">
        <CardHeader>
          <CardTitle>Xatolik yuz berdi</CardTitle>
          <CardDescription>
            Ma&apos;lumotlarni yuklab bo&apos;lmadi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => refetch()}>Qayta urinish</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <PageTransition mode="slide-up">
      <div className="flex flex-col gap-6 pb-24">
        <OperationsWorkspace
          coachName={coachName}
          metrics={metrics}
          operationalKpis={operationalKpis}
          alerts={alerts}
          pendingInvitations={pendingInvitations}
          recentCheckIns={recentCheckIns}
          isLoading={isLoading}
          timeRange={timeRange}
          rangeOptions={DASHBOARD_RANGE_OPTIONS}
          onTimeRangeChange={handleTimeRangeChange}
        />

        <NotificationsPanel
          alerts={alerts}
          pendingInvitations={pendingInvitations}
          isLoading={isLoading}
          respondToInvitation={respondToInvitation}
        />

        <DashboardStatsCards
          metrics={metrics}
          isLoading={isLoading}
          chartPeriod={chartPeriod}
          paymentChartData={paymentChartData}
          onChartPeriodChange={handleChartPeriodChange}
        />

        <div className="grid gap-4 lg:grid-cols-7">
          <div className="space-y-4 lg:col-span-4">
            <RecentActivityPanel
              recentClients={recentClients}
              overdueClients={overdueClients}
              isLoading={isLoading}
            />
          </div>

          <div className="space-y-4 lg:col-span-3">
            <QuickActionsPanel
              templates={templates}
              workoutPlans={workoutPlans}
              isLoading={isLoading}
              isWorkoutPlansLoading={isWorkoutPlansLoading}
            />
            <ReferralCard />
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
