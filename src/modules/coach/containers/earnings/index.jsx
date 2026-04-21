import React from "react";
import { get } from "lodash";
import { CircleDollarSignIcon, RotateCcwIcon } from "lucide-react";
import PageTransition from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { useBreadcrumbStore } from "@/store";
import {
  useCoachClients,
  useCoachPayments,
  useCoachPaymentStats,
} from "@/modules/coach/lib/hooks";
import { cn } from "@/lib/utils";
import EarningsStatsCards from "./components/EarningsStatsCards.jsx";
import EarningsTrendCharts from "./components/EarningsTrendCharts.jsx";
import PaymentRemindersSection from "./components/PaymentRemindersSection.jsx";
import RecentPaymentsPanel from "./components/RecentPaymentsPanel.jsx";
import TopClientsPanel from "./components/TopClientsPanel.jsx";
import {
  buildCurrentMonthDailyRevenue,
  buildMonthlyRevenueTrend,
  buildRecentPayments,
  buildStatusDistribution,
  buildTopClients,
  calculateAvgPaymentPerClient,
  getGrowthTrend,
  resolveListPayload,
} from "./components/earnings-utils.js";

const CoachEarningsContainer = () => {
  const { setBreadcrumbs } = useBreadcrumbStore();
  const {
    stats,
    isLoading: isStatsLoading,
    refetch: refetchStats,
  } = useCoachPaymentStats();
  const { data: paymentsData, isLoading: isPaymentsLoading } = useCoachPayments(
    { pageSize: 100 },
    { staleTime: 30000 },
  );
  const { data: clientsData, isLoading: isClientsLoading } = useCoachClients(
    { status: "active", pageSize: 50 },
    { staleTime: 30000 },
  );

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/coach", title: "Coach" },
      { url: "/coach/earnings", title: "Daromad" },
    ]);
  }, [setBreadcrumbs]);

  const payments = React.useMemo(
    () => resolveListPayload(paymentsData),
    [paymentsData],
  );
  const clients = React.useMemo(
    () => resolveListPayload(clientsData),
    [clientsData],
  );
  const revenue = get(stats, "revenue", {});
  const balance = get(stats, "balance", {});
  const counts = get(stats, "counts", {});
  const isLoading = isStatsLoading || isPaymentsLoading;

  const growthTrend = React.useMemo(
    () => getGrowthTrend(revenue),
    [revenue],
  );
  const monthlyRevenueTrend = React.useMemo(
    () => buildMonthlyRevenueTrend(payments),
    [payments],
  );
  const statusDistribution = React.useMemo(
    () => buildStatusDistribution(counts),
    [counts],
  );
  const recentPayments = React.useMemo(
    () => buildRecentPayments(payments),
    [payments],
  );
  const currentMonthDailyRevenue = React.useMemo(
    () => buildCurrentMonthDailyRevenue(payments),
    [payments],
  );
  const avgPaymentPerClient = React.useMemo(
    () => calculateAvgPaymentPerClient(payments),
    [payments],
  );
  const topClients = React.useMemo(() => buildTopClients(payments), [payments]);

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            <CircleDollarSignIcon className="size-3.5" />
            Moliyaviy panel
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Daromad</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Earnings alohida reporting view sifatida qoldirildi: tushum,
              status va reminderlar shu yerda nazorat qilinadi.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => refetchStats()}
          disabled={isLoading}
          aria-label="Daromad statistikalarini yangilash"
        >
          <RotateCcwIcon className={cn("size-4", isLoading && "animate-spin")} />
        </Button>
      </div>

      <EarningsStatsCards
        revenue={revenue}
        balance={balance}
        counts={counts}
        growthTrend={growthTrend}
        avgPaymentPerClient={avgPaymentPerClient}
        isStatsLoading={isStatsLoading}
      />

      <EarningsTrendCharts
        currentMonthDailyRevenue={currentMonthDailyRevenue}
        monthlyRevenueTrend={monthlyRevenueTrend}
        statusDistribution={statusDistribution}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <TopClientsPanel clients={topClients} />
        <RecentPaymentsPanel payments={recentPayments} />
      </div>

      <PaymentRemindersSection clients={clients} isLoading={isClientsLoading} />
    </PageTransition>
  );
};

export default CoachEarningsContainer;
