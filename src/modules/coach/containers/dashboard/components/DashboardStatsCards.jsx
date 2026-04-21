import React from "react";
import { motion } from "framer-motion";
import {
  ActivityIcon,
  BanknoteIcon,
  CircleDollarSignIcon,
  ClockIcon,
  SaladIcon,
  TargetIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react";
import RechartsLine from "@/components/charts/line-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatMoney, revenueChange } from "./dashboard-ui.jsx";

const STAT_CARDS = [
  {
    key: "totalClients",
    label: "Jami mijozlar",
    icon: UsersIcon,
    color: "primary",
  },
  {
    key: "activeClients",
    label: "Faol mijozlar",
    icon: ActivityIcon,
    color: "emerald",
  },
  {
    key: "totalTemplates",
    label: "Template'lar",
    icon: SaladIcon,
    color: "blue",
    hint: "Faol template soni",
  },
  {
    key: "averageProgress",
    label: "O'rtacha progress",
    icon: TargetIcon,
    color: "amber",
    suffix: "%",
    hint: "Barcha mijozlar bo'yicha",
  },
];

const STAT_COLORS = {
  primary: "border-primary/20 bg-primary/20 text-primary",
  emerald: "border-emerald-500/20 bg-emerald-500/20 text-emerald-600",
  blue: "border-blue-500/20 bg-blue-500/20 text-blue-600",
  amber: "border-amber-500/20 bg-amber-500/20 text-amber-600",
};

const StatCard = ({
  icon: Icon,
  label,
  value,
  hint,
  color = "primary",
  index = 0,
}) => {
  const colorClass = STAT_COLORS[color] ?? STAT_COLORS.primary;
  const glowClass = colorClass
    .split(" ")
    .find((item) => item.startsWith("text-"))
    ?.replace("text-", "bg-");

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
    >
      <Card className="group relative overflow-hidden border-none bg-card/60 backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-xl">
        <div
          className={cn(
            "absolute -right-12 -top-12 size-32 rounded-full opacity-10 blur-3xl transition-all group-hover:opacity-20",
            glowClass,
          )}
        />
        <CardContent className="flex flex-col gap-4 p-6">
          <div
            className={cn(
              "flex size-10 items-center justify-center rounded-xl border shadow-sm transition-transform group-hover:scale-110",
              colorClass,
            )}
          >
            <Icon className="size-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
              {label}
            </p>
            <div className="mt-1 flex items-baseline gap-1">
              <div className="text-3xl font-black tracking-tighter">{value}</div>
            </div>
            {hint ? (
              <p className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-muted-foreground/60">
                <ClockIcon className="size-3" />
                {hint}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const RevenueTrendBadge = ({ current = 0, previous = 0 }) => {
  const change = revenueChange(current, previous);

  if (!change) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black",
        change.up
          ? "bg-emerald-500/10 text-emerald-600"
          : "bg-destructive/10 text-destructive",
      )}
    >
      {change.up ? (
        <TrendingUpIcon className="size-3" />
      ) : (
        <TrendingDownIcon className="size-3" />
      )}
      {Math.abs(change.pct)}%
    </div>
  );
};

export const DashboardStatsCards = ({
  metrics = {},
  isLoading = false,
  chartPeriod = "month",
  paymentChartData = [],
  onChartPeriodChange,
}) => (
  <>
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {STAT_CARDS.map((item, index) => (
        <StatCard
          key={item.key}
          index={index}
          icon={item.icon}
          label={item.label}
          color={item.color}
          hint={item.hint}
          value={
            isLoading ? (
              <Skeleton className="h-8 w-16 rounded-lg" />
            ) : (
              `${metrics[item.key] ?? 0}${item.suffix ?? ""}`
            )
          }
        />
      ))}
    </div>

    {!isLoading ? (
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card className="group relative overflow-hidden border-none bg-card/60 backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600">
                  <WalletIcon className="size-5" />
                </div>
                <RevenueTrendBadge
                  current={metrics.monthlyRevenue ?? 0}
                  previous={metrics.prevMonthRevenue ?? 0}
                />
              </div>
              <div className="mt-3">
                <div className="text-xl font-bold tracking-tight">
                  {formatMoney(metrics.monthlyRevenue ?? 0)}
                </div>
                <div className="mt-0.5 text-sm text-muted-foreground">
                  Bu oy daromad
                </div>
                <p className="mt-1 text-xs text-muted-foreground/60">
                  {metrics.monthlyPaymentCount ?? 0} ta to&apos;lov
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-none bg-card/60 backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-600">
                  <BanknoteIcon className="size-5" />
                </div>
                {(metrics.overduePayments ?? 0) > 0 ? (
                  <Badge className="border-red-500/20 bg-red-500/10 text-[10px] font-bold text-red-600">
                    Diqqat
                  </Badge>
                ) : null}
              </div>
              <div className="mt-4">
                <div className="text-3xl font-black tracking-tighter">
                  {metrics.overduePayments ?? 0}
                </div>
                <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                  Kechikkan to&apos;lovlar
                </p>
                <p className="mt-1.5 text-[10px] font-medium text-muted-foreground/60">
                  {metrics.duePayments ?? 0} ta bugun muhlati
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-none bg-card/60 backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-600">
                  <CircleDollarSignIcon className="size-5" />
                </div>
                <span className="rounded-full bg-muted/50 px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                  {metrics.activeClients ?? 0} ta faol
                </span>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-black tracking-tighter">
                  {metrics.averageProgress ?? 0}%
                </div>
                <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                  O&apos;rtacha progress
                </p>
                <p className="mt-1.5 text-[10px] font-medium text-muted-foreground/60">
                  Barcha mijozlar bo&apos;yicha
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden p-0">
          <CardHeader className="flex flex-col gap-4 px-6 pb-2 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">
                To&apos;lovlar dinamikasi
              </CardTitle>
              <CardDescription className="text-xs">
                Statistik ko&apos;rsatkichlarni ko&apos;rish
              </CardDescription>
            </div>
            <Tabs
              value={chartPeriod}
              onValueChange={onChartPeriodChange}
              className="w-full sm:w-auto"
            >
              <TabsList className="grid w-full grid-cols-3 sm:w-[240px]">
                <TabsTrigger value="week" className="text-xs">
                  Hafta
                </TabsTrigger>
                <TabsTrigger value="month" className="text-xs">
                  Oy
                </TabsTrigger>
                <TabsTrigger value="year" className="text-xs">
                  Yillik
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="px-2 pb-6 pt-2">
            <div className="mt-4 h-[280px] w-full">
              <RechartsLine
                data={paymentChartData}
                dataKey="amount"
                xAxisKey="label"
                color="#10b981"
                height={280}
                showGrid
              />
            </div>
          </CardContent>
        </Card>
      </div>
    ) : null}
  </>
);

export default DashboardStatsCards;
