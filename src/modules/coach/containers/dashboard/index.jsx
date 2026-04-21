import React from "react";
import { motion } from "framer-motion";
import { get } from "lodash";
import { useNavigate } from "react-router";
import PageTransition from "@/components/page-transition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore, useBreadcrumbStore } from "@/store";
import { useCoachDashboardStore } from "@/modules/coach/store";
import {
  useCoachDashboard,
  useCoachWorkoutPlans,
} from "@/modules/coach/lib/hooks";
import DashboardStatsCards from "./components/DashboardStatsCards.jsx";
import NotificationsPanel from "./components/NotificationsPanel.jsx";
import QuickActionsPanel from "./components/QuickActionsPanel.jsx";
import RecentActivityPanel from "./components/RecentActivityPanel.jsx";
import ReferralCard from "./components/ReferralCard.jsx";
import { greeting } from "./components/dashboard-ui.jsx";

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
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const user = useAuthStore((state) => state.user);
  const timeRange = useCoachDashboardStore((state) => state.timeRange);
  const timezone = useCoachDashboardStore((state) => state.timezone);
  const chartPeriod = useCoachDashboardStore((state) => state.chartPeriod);
  const setTimeRange = useCoachDashboardStore((state) => state.setTimeRange);
  const setChartPeriod = useCoachDashboardStore((state) => state.setChartPeriod);

  const dashboardParams = React.useMemo(
    () => ({
      timeRange,
      timezone,
    }),
    [timeRange, timezone],
  );

  const {
    dashboard,
    isLoading,
    isError,
    refetch,
    respondToInvitation,
  } = useCoachDashboard(dashboardParams);

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
  const alerts = dashboard.alerts;
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
      <div className="flex flex-col gap-8 pb-24">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[32px] border-none shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-orange-500/10" />
          <div className="absolute -right-24 -top-24 size-96 rounded-full bg-primary/10 blur-[100px]" />
          <div className="absolute -left-20 bottom-10 size-64 rounded-full bg-orange-400/5 blur-[80px]" />

          <div className="relative flex flex-col gap-6 p-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                {greeting()},{" "}
                <span className="animate-gradient bg-gradient-to-r from-primary via-orange-500 to-primary/80 bg-clip-text text-transparent">
                  {coachName}
                </span>
              </h1>
              <p className="mt-2 text-base font-medium text-muted-foreground">
                Mijozlar, to&apos;lovlar va operatsion ogohlantirishlar.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
              {(metrics.pendingInvitations ?? 0) > 0 ? (
                <Badge className="h-7 border-orange-500/20 bg-amber-500/10 px-3 font-bold text-amber-600">
                  {metrics.pendingInvitations} ta so&apos;rov
                </Badge>
              ) : null}
              <Tabs value={timeRange} onValueChange={handleTimeRangeChange}>
                <TabsList className="grid w-full grid-cols-4 sm:w-[292px]">
                  {DASHBOARD_RANGE_OPTIONS.map((item) => (
                    <TabsTrigger
                      key={item.value}
                      value={item.value}
                      className="text-xs"
                    >
                      {item.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <Button onClick={() => navigate("/coach/clients")}>
                Mijozlar ro&apos;yxati
              </Button>
            </div>
          </div>
        </motion.div>

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
