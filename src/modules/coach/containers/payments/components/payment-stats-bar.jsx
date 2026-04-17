import React from "react";
import _ from "lodash";
import {
  BanknoteIcon,
  CalendarIcon,
  CheckCircle2Icon,
  TrendingDownIcon,
  TrendingUpIcon,
  WalletCardsIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const DEFAULT_PAYMENT_STATS = {
  revenue: {
    total: 0,
    currentMonth: 0,
    growth: 0,
  },
  counts: {
    pending: 0,
    overdue: 0,
    completed: 0,
    refunded: 0,
  },
};

const formatMoney = (value) => {
  const normalized = Number(value);
  if (!Number.isFinite(normalized) || normalized <= 0) {
    return "Kelishiladi";
  }
  return `${new Intl.NumberFormat("uz-UZ").format(normalized)} so'm`;
};

const StatCard = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
  trendType = "up",
  variant = "default",
  isLoading,
}) => {
  if (isLoading) {
    return (
      <Card className="border-none bg-card/50 backdrop-blur-sm shadow-sm">
        <CardContent className="p-6">
          <Skeleton className="h-4 w-24 mb-2" />
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
    <Card className="group transition-all hover:shadow-md border-none bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden relative">
      <CardContent className="p-6 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("p-2 rounded-xl border", variants[variant])}>
            <Icon className="size-5" />
          </div>
          {trend && (
            <div
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold",
                trendType === "up"
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-destructive/10 text-destructive",
              )}
            >
              {trendType === "up" ? (
                <TrendingUpIcon className="size-3" />
              ) : (
                <TrendingDownIcon className="size-3" />
              )}
              {trend}
            </div>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            {title}
          </p>
          <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
          {description && (
            <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1 font-medium">
              {description}
            </p>
          )}
        </div>
      </CardContent>
      <div
        className={cn(
          "absolute -right-8 -bottom-8 size-24 rounded-full opacity-5 blur-2xl",
          variant === "default"
            ? "bg-primary"
            : variant === "warning"
              ? "bg-orange-500"
              : "bg-destructive",
        )}
      />
    </Card>
  );
};

const PaymentStatsBar = ({ stats, isLoading }) => {
  const safeStats = _.defaultsDeep({}, stats, DEFAULT_PAYMENT_STATS);
  const totalRevenue = _.get(safeStats, "revenue.total", 0);
  const currentMonthRevenue = _.get(safeStats, "revenue.currentMonth", 0);
  const revenueGrowth = _.get(safeStats, "revenue.growth", 0);
  const pendingCount = _.get(safeStats, "counts.pending", 0);
  const overdueCount = _.get(safeStats, "counts.overdue", 0);
  const completedCount = _.get(safeStats, "counts.completed", 0);
  const refundedCount = _.get(safeStats, "counts.refunded", 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        title="Jami tushum"
        value={formatMoney(totalRevenue)}
        icon={WalletCardsIcon}
        description="Barcha vaqtlar uchun"
        trend={
          revenueGrowth > 0
            ? `+${revenueGrowth}%`
            : revenueGrowth < 0
              ? `${revenueGrowth}%`
              : null
        }
        trendType={revenueGrowth >= 0 ? "up" : "down"}
        isLoading={isLoading}
      />
      <StatCard
        title="Shu oylik tushum"
        value={formatMoney(currentMonthRevenue)}
        icon={BanknoteIcon}
        description={`${new Date().toLocaleString("uz-UZ", { month: "long" })} oyi uchun`}
        isLoading={isLoading}
      />
      <StatCard
        title="To'lov kutilmoqda"
        value={pendingCount + overdueCount}
        icon={CalendarIcon}
        description={`${overdueCount} ta kechikkan to'lov`}
        variant={overdueCount > 0 ? "warning" : "default"}
        isLoading={isLoading}
      />
      <StatCard
        title="Muvaffaqiyatli to'lovlar"
        value={completedCount}
        icon={CheckCircle2Icon}
        description={`${refundedCount} ta qaytarilgan`}
        isLoading={isLoading}
      />
    </div>
  );
};

export default PaymentStatsBar;
