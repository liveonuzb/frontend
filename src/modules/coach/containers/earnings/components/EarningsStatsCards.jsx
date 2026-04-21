import React from "react";
import { get, toNumber } from "lodash";
import {
  BanknoteIcon,
  CheckCircle2Icon,
  CircleDollarSignIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  WalletIcon,
  XCircleIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatMoney } from "./earnings-utils.js";

const StatCard = ({
  title,
  value,
  icon: Icon,
  variant = "default",
  trend,
  isLoading,
}) => {
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
    default: "border-primary/20 bg-primary/10 text-primary",
    warning: "border-orange-500/20 bg-orange-500/10 text-orange-600",
    destructive: "border-destructive/20 bg-destructive/10 text-destructive",
    success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600",
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

const SummaryCard = ({ title, value, description, trend }) => (
  <Card className="border-none bg-card/50 py-6 text-center shadow-sm backdrop-blur-sm">
    <CardContent className="px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <div className="mt-2 flex items-center justify-center gap-2">
        <span className="text-xl font-black">{value}</span>
        {trend ? (
          <span
            className={cn(
              "text-xs font-bold",
              trend.up ? "text-emerald-600" : "text-red-500",
            )}
          >
            {trend.up ? "+" : "-"}
            {trend.pct}%
          </span>
        ) : null}
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

const CountCard = ({ title, value, icon: Icon, className }) => (
  <Card className="border-none bg-card/50 py-6 text-center shadow-sm backdrop-blur-sm">
    <CardContent className="px-6">
      <div
        className={cn(
          "mx-auto mb-3 flex size-11 items-center justify-center rounded-2xl",
          className,
        )}
      >
        <Icon className="size-5" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <h3 className="mt-1 text-2xl font-bold">{value}</h3>
    </CardContent>
  </Card>
);

export const EarningsStatsCards = ({
  revenue = {},
  balance = {},
  counts = {},
  growthTrend,
  avgPaymentPerClient = 0,
  isStatsLoading = false,
}) => (
  <>
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
        variant={
          toNumber(get(counts, "overdue", 0)) > 0 ? "destructive" : "default"
        }
        isLoading={isStatsLoading}
      />
    </div>

    <div className="grid gap-4 md:grid-cols-3">
      <SummaryCard
        title="Joriy oy / O'tgan oy"
        value={formatMoney(get(revenue, "currentMonth"))}
        trend={growthTrend}
        description={`o'tgan oy: ${formatMoney(get(revenue, "lastMonth"))}`}
      />
      <SummaryCard
        title="Client bo'yicha o'rtacha"
        value={formatMoney(avgPaymentPerClient)}
        description="har bir client uchun"
      />
      <SummaryCard
        title="To'lov statistikasi"
        value={toNumber(get(counts, "completed", 0))}
        description={`to'langan | ${toNumber(get(counts, "pending", 0))} kutilmoqda`}
      />
    </div>

    <div className="grid gap-4 md:grid-cols-3">
      <CountCard
        title="To'langan"
        value={toNumber(get(counts, "completed", 0))}
        icon={CheckCircle2Icon}
        className="bg-emerald-500/10 text-emerald-600"
      />
      <CountCard
        title="Kutilmoqda"
        value={toNumber(get(counts, "pending", 0))}
        icon={BanknoteIcon}
        className="bg-amber-500/10 text-amber-600"
      />
      <CountCard
        title="Bekor/Qaytarilgan"
        value={
          toNumber(get(counts, "cancelled", 0)) +
          toNumber(get(counts, "refunded", 0))
        }
        icon={XCircleIcon}
        className="bg-rose-500/10 text-rose-600"
      />
    </div>
  </>
);

export default EarningsStatsCards;
