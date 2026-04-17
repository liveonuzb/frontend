import {
  filter,
  get,
  groupBy,
  map,
  orderBy,
  reduce,
  round,
  size,
  split,
  take,
  toNumber,
  toUpper,
} from "lodash";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  BanknoteIcon,
  CheckCircle2Icon,
  CircleDollarSignIcon,
  RotateCcwIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  WalletIcon,
  XCircleIcon,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { useBreadcrumbStore } from "@/store";
import {
  useCoachClients,
  useCoachPayments,
  useCoachPaymentStats,
} from "@/hooks/app/use-coach";
import PaymentRemindersSection from "./payment-reminders-section";
import PageTransition from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart.jsx";
import { cn } from "@/lib/utils";

const formatMoney = (value, locale = "uz-UZ") => {
  const normalized = toNumber(value);
  if (!Number.isFinite(normalized) || normalized <= 0) return "0 so'm";
  return `${new Intl.NumberFormat(locale).format(round(normalized))} so'm`;
};

const formatDate = (value, locale = "uz-UZ") => {
  if (!value) return "\u2014";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "\u2014";
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
};

const STATUS_COLORS = {
  completed: "hsl(var(--primary))",
  pending: "var(--color-amber-500)",
  overdue: "var(--color-rose-500)",
  cancelled: "var(--color-zinc-400)",
  refunded: "var(--color-sky-500)",
};

const STATUS_LABELS = {
  completed: "To'langan",
  pending: "Kutilmoqda",
  overdue: "Muddati o'tgan",
  cancelled: "Bekor qilingan",
  refunded: "Qaytarilgan",
};

const revenueChartConfig = {
  revenue: { label: "Daromad", color: "hsl(var(--primary))" },
};

const statusChartConfig = {
  value: { label: "Soni", color: "hsl(var(--primary))" },
};

const StatCard = ({ title, value, icon: Icon, variant = "default", trend, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="border-none bg-card/50 shadow-sm backdrop-blur-sm">
        <CardContent className="p-6">
          <Skeleton className="mb-2 h-4 w-24" />
          <Skeleton className="h-8 w-32" />
        </CardContent>
      </Card>
    );
  }

  const variants = {
    default: "bg-primary/10 text-primary border-primary/20",
    warning: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    destructive: "bg-destructive/10 text-destructive border-destructive/20",
    success: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  };

  return (
    <Card className="group relative overflow-hidden border-none bg-card/50 py-6 shadow-sm backdrop-blur-sm transition-all hover:shadow-md">
      <CardContent className="relative z-10 px-6">
        <div className="mb-4 flex items-center justify-between">
          <div className={cn("rounded-xl border p-2", variants[variant])}>
            <Icon className="size-5" />
          </div>
          {trend ? (
            <div
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold",
                trend.up
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-destructive/10 text-destructive",
              )}
            >
              {trend.up ? (
                <TrendingUpIcon className="size-3" />
              ) : (
                <TrendingDownIcon className="size-3" />
              )}
              {trend.pct}%
            </div>
          ) : null}
        </div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
      </CardContent>
    </Card>
  );
};

const SectionCard = ({ title, description, children, className }) => (
  <Card className={cn("rounded-[32px] border-border/60 bg-card/95 py-6", className)}>
    <CardHeader className="space-y-2 px-6">
      <CardTitle className="text-lg font-black tracking-tight">{title}</CardTitle>
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
    </CardHeader>
    <CardContent className="px-6">{children}</CardContent>
  </Card>
);

const CoachEarningsContainer = () => {
  const { t } = useTranslation();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const { stats, isLoading: isStatsLoading, refetch: refetchStats } = useCoachPaymentStats();
  const { payments, isLoading: isPaymentsLoading } = useCoachPayments({ pageSize: 100 });
  const { clients, isLoading: isClientsLoading } = useCoachClients({ status: "active", pageSize: 50 });

  const isLoading = isStatsLoading || isPaymentsLoading;

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/coach", title: "Coach" },
      { url: "/coach/earnings", title: "Daromad" },
    ]);
  }, [setBreadcrumbs]);

  const revenue = get(stats, "revenue", {});
  const balance = get(stats, "balance", {});
  const counts = get(stats, "counts", {});

  const growthTrend = React.useMemo(() => {
    const growth = toNumber(get(revenue, "growth", 0));
    if (growth === 0) return null;
    return { pct: Math.abs(growth), up: growth >= 0 };
  }, [revenue]);

  const monthlyRevenueTrend = React.useMemo(() => {
    const completedPayments = filter(payments, (p) => get(p, "status") === "completed" && get(p, "paidAt"));
    const grouped = groupBy(completedPayments, (p) => {
      const date = new Date(get(p, "paidAt"));
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    });

    const sortedKeys = orderBy(Object.keys(grouped));
    return map(take(orderBy(sortedKeys, [], ["desc"]), 6).reverse(), (key) => {
      const [year, month] = split(key, "-");
      const label = new Intl.DateTimeFormat("uz-UZ", { month: "short" }).format(
        new Date(Number(year), Number(month) - 1),
      );
      const total = reduce(grouped[key], (sum, p) => sum + toNumber(get(p, "amount", 0)), 0);
      return { name: label, revenue: round(total) };
    });
  }, [payments]);

  const statusDistribution = React.useMemo(() => {
    const entries = [
      { name: STATUS_LABELS.completed, status: "completed", value: toNumber(get(counts, "completed", 0)), fill: STATUS_COLORS.completed },
      { name: STATUS_LABELS.pending, status: "pending", value: toNumber(get(counts, "pending", 0)), fill: STATUS_COLORS.pending },
      { name: STATUS_LABELS.overdue, status: "overdue", value: toNumber(get(counts, "overdue", 0)), fill: STATUS_COLORS.overdue },
      { name: STATUS_LABELS.cancelled, status: "cancelled", value: toNumber(get(counts, "cancelled", 0)), fill: STATUS_COLORS.cancelled },
      { name: STATUS_LABELS.refunded, status: "refunded", value: toNumber(get(counts, "refunded", 0)), fill: STATUS_COLORS.refunded },
    ];
    return filter(entries, (e) => e.value > 0);
  }, [counts]);

  const recentPayments = React.useMemo(
    () => take(orderBy(payments, [(p) => new Date(get(p, "paidAt", 0))], ["desc"]), 8),
    [payments],
  );

  const currentMonthDailyRevenue = React.useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const completedThisMonth = filter(
      payments,
      (p) => {
        if (get(p, "status") !== "completed" || !get(p, "paidAt")) return false;
        const d = new Date(get(p, "paidAt"));
        return d.getFullYear() === year && d.getMonth() === month;
      },
    );
    const byDay = groupBy(completedThisMonth, (p) => new Date(get(p, "paidAt")).getDate());
    return map(Array.from({ length: daysInMonth }, (_, i) => i + 1), (day) => ({
      day: `${day}`,
      revenue: round(reduce(byDay[day] || [], (sum, p) => sum + toNumber(get(p, "amount", 0)), 0)),
    }));
  }, [payments]);

  const avgPaymentPerClient = React.useMemo(() => {
    const completedPayments = filter(payments, { status: "completed" });
    if (!size(completedPayments)) return 0;
    const totalRevenue = reduce(completedPayments, (sum, p) => sum + toNumber(get(p, "amount", 0)), 0);
    const uniqueClients = new Set(completedPayments.map((p) => get(p, "client.id") || get(p, "clientId")));
    return uniqueClients.size > 0 ? round(totalRevenue / uniqueClients.size) : 0;
  }, [payments]);

  const topClients = React.useMemo(() => {
    const completedPayments = filter(payments, { status: "completed" });
    const grouped = groupBy(completedPayments, (p) => get(p, "client.id") || get(p, "clientId"));
    const clientRevenues = map(grouped, (clientPayments, clientId) => {
      const sample = clientPayments[0];
      return {
        id: clientId,
        name: get(sample, "client.fullName") || get(sample, "client.name") || "Noma'lum",
        avatar: get(sample, "client.avatar"),
        total: reduce(clientPayments, (sum, p) => sum + toNumber(get(p, "amount", 0)), 0),
        count: size(clientPayments),
      };
    });
    return take(orderBy(clientRevenues, ["total"], ["desc"]), 5);
  }, [payments]);

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
              Oylik daromad, to'lov statistikasi va client bo'yicha tushum tahlili.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => refetchStats()}
          disabled={isLoading}
        >
          <RotateCcwIcon className={cn("size-4", isLoading && "animate-spin")} />
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <StatCard
          title="Umumiy daromad"
          value={formatMoney(get(revenue, "total"))}
          icon={WalletIcon}
          isLoading={isStatsLoading}
        />
        <StatCard
          title="Joriy oy"
          value={formatMoney(get(revenue, "currentMonth"))}
          icon={BanknoteIcon}
          trend={growthTrend}
          variant="success"
          isLoading={isStatsLoading}
        />
        <StatCard
          title="Expected"
          value={formatMoney(get(revenue, "expectedCurrentMonth"))}
          icon={CircleDollarSignIcon}
          variant="warning"
          isLoading={isStatsLoading}
        />
        <StatCard
          title="Available"
          value={formatMoney(get(balance, "available"))}
          icon={WalletIcon}
          variant="success"
          isLoading={isStatsLoading}
        />
        <StatCard
          title="O'tgan oy"
          value={formatMoney(get(revenue, "lastMonth"))}
          icon={BanknoteIcon}
          isLoading={isStatsLoading}
        />
        <StatCard
          title="Muddati o'tgan"
          value={toNumber(get(counts, "overdue", 0))}
          icon={XCircleIcon}
          variant={toNumber(get(counts, "overdue", 0)) > 0 ? "destructive" : "default"}
          isLoading={isStatsLoading}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-none bg-card/50 py-6 shadow-sm backdrop-blur-sm">
          <CardContent className="px-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Joriy oy / O&apos;tgan oy
            </p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="text-xl font-black">{formatMoney(get(revenue, "currentMonth"))}</span>
              {growthTrend ? (
                <span className={cn("text-xs font-bold", growthTrend.up ? "text-emerald-600" : "text-red-500")}>
                  {growthTrend.up ? "+" : "-"}{growthTrend.pct}%
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              o&apos;tgan oy: {formatMoney(get(revenue, "lastMonth"))}
            </p>
          </CardContent>
        </Card>
        <Card className="border-none bg-card/50 py-6 shadow-sm backdrop-blur-sm">
          <CardContent className="px-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Client bo&apos;yicha o&apos;rtacha
            </p>
            <p className="mt-2 text-xl font-black">{formatMoney(avgPaymentPerClient)}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">har bir client uchun</p>
          </CardContent>
        </Card>
        <Card className="border-none bg-card/50 py-6 shadow-sm backdrop-blur-sm">
          <CardContent className="px-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              To&apos;lov statistikasi
            </p>
            <p className="mt-2 text-xl font-black">{toNumber(get(counts, "completed", 0))}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              to&apos;langan | {toNumber(get(counts, "pending", 0))} kutilmoqda
            </p>
          </CardContent>
        </Card>
      </div>

      <SectionCard
        title="Joriy oy kunlik daromad"
        description={`${new Intl.DateTimeFormat("uz-UZ", { month: "long", year: "numeric" }).format(new Date())} bo'yicha kunlik tushum.`}
      >
        {size(filter(currentMonthDailyRevenue, (d) => d.revenue > 0)) > 0 ? (
          <ChartContainer
            config={{ revenue: { label: "Daromad", color: "hsl(var(--primary))" } }}
            className="aspect-auto h-[200px] w-full"
          >
            <BarChart data={currentMonthDailyRevenue} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="hsl(var(--muted-foreground) / 0.1)" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} interval={4} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} tickFormatter={(v) => v > 0 ? `${Math.round(v / 1000)}k` : "0"} />
              <ChartTooltip content={<ChartTooltipContent formatter={(v) => formatMoney(v)} />} />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} opacity={0.85} />
            </BarChart>
          </ChartContainer>
        ) : null}
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <SectionCard
          title="Oylik daromad trendi"
          description="Oxirgi oylar bo'yicha daromad oqimini ko'ring."
        >
          {size(monthlyRevenueTrend) ? (
            <ChartContainer
              config={revenueChartConfig}
              className="aspect-auto h-[300px] w-full"
            >
              <AreaChart
                data={monthlyRevenueTrend}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="earningsRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={10} />
                <YAxis tickLine={false} axisLine={false} width={28} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-revenue)"
                  fill="url(#earningsRevenue)"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ChartContainer>
          ) : null}
        </SectionCard>

        <SectionCard
          title="To'lov holatlari"
          description="Barcha to'lovlarning status bo'yicha taqsimoti."
        >
          {size(statusDistribution) ? (
            <>
              <ChartContainer config={statusChartConfig} className="aspect-auto h-[200px] w-full">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {map(statusDistribution, (entry) => (
                      <Cell key={entry.status} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel indicator="dot" />}
                  />
                </PieChart>
              </ChartContainer>
              <div className="mt-4 space-y-2">
                {map(statusDistribution, (item) => (
                  <div
                    key={item.status}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: item.fill }}
                      />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Top clientlar"
          description="Eng ko'p daromad keltirgan clientlar."
        >
          {size(topClients) ? (
            <div className="space-y-3">
              {map(topClients, (client, index) => (
                <div
                  key={get(client, "id")}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold">{get(client, "name")}</div>
                      <div className="text-xs text-muted-foreground">
                        {get(client, "count")} ta to'lov
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold">
                    {formatMoney(get(client, "total"))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </SectionCard>

        <SectionCard
          title="So'nggi to'lovlar"
          description="Eng oxirgi qayd etilgan to'lovlar."
        >
          {size(recentPayments) ? (
            <div className="space-y-3">
              {map(recentPayments, (payment) => (
                <div
                  key={get(payment, "id")}
                  className="rounded-2xl border border-border/60 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold">
                      {get(payment, "client.fullName") || get(payment, "client.name") || "Noma'lum"}
                    </div>
                    <div className="text-sm font-semibold">
                      {formatMoney(get(payment, "amount"))}
                    </div>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {toUpper(get(payment, "method", ""))} &bull; {formatDate(get(payment, "paidAt"))}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        get(payment, "status") === "completed" && "bg-emerald-500/10 text-emerald-600",
                        get(payment, "status") === "pending" && "bg-amber-500/10 text-amber-600",
                        get(payment, "status") === "overdue" && "bg-rose-500/10 text-rose-600",
                        get(payment, "status") === "cancelled" && "bg-zinc-500/10 text-zinc-500",
                        get(payment, "status") === "refunded" && "bg-sky-500/10 text-sky-600",
                      )}
                    >
                      {STATUS_LABELS[get(payment, "status")] || get(payment, "status")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </SectionCard>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-none bg-card/50 py-6 shadow-sm backdrop-blur-sm">
          <CardContent className="px-6 text-center">
            <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
              <CheckCircle2Icon className="size-5" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">To'langan</p>
            <h3 className="mt-1 text-2xl font-bold">{toNumber(get(counts, "completed", 0))}</h3>
          </CardContent>
        </Card>
        <Card className="border-none bg-card/50 py-6 shadow-sm backdrop-blur-sm">
          <CardContent className="px-6 text-center">
            <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
              <BanknoteIcon className="size-5" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kutilmoqda</p>
            <h3 className="mt-1 text-2xl font-bold">{toNumber(get(counts, "pending", 0))}</h3>
          </CardContent>
        </Card>
        <Card className="border-none bg-card/50 py-6 shadow-sm backdrop-blur-sm">
          <CardContent className="px-6 text-center">
            <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600">
              <XCircleIcon className="size-5" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bekor/Qaytarilgan</p>
            <h3 className="mt-1 text-2xl font-bold">
              {toNumber(get(counts, "cancelled", 0)) + toNumber(get(counts, "refunded", 0))}
            </h3>
          </CardContent>
        </Card>
      </div>

      <PaymentRemindersSection clients={clients} isLoading={isClientsLoading} />
    </PageTransition>
  );
};

export default CoachEarningsContainer;
