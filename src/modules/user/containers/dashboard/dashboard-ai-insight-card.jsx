import React from "react";
import { Link } from "react-router";
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  SparklesIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import useDashboardAiInsights from "./use-dashboard-ai-insights.js";
import { getDashboardAiInsightViewModel } from "./dashboard-ai-insight-view-model.js";

const DashboardAiInsightSkeleton = () => (
  <Card className="border-primary/15 bg-card/95 py-5">
    <CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center">
      <div className="space-y-3">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <Skeleton className="h-10 w-40" />
    </CardContent>
  </Card>
);

const InsightMetric = ({ label, value, tone = "default" }) => {
  if (!value) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2",
        tone === "good"
          ? "border-emerald-500/20 bg-emerald-500/10"
          : "border-border bg-muted/25",
      )}
    >
      <p className="text-[11px] font-semibold uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold">{value}</p>
    </div>
  );
};

export const DashboardAiInsightCardView = ({
  dateKey,
  insights = {},
  user = null,
  className,
}) => {
  const viewModel = React.useMemo(
    () => getDashboardAiInsightViewModel(insights, dateKey, user),
    [dateKey, insights, user],
  );

  if (insights.isLoading) {
    return <DashboardAiInsightSkeleton />;
  }

  return (
    <Card
      className={cn(
        "border-primary/15 bg-card/95 py-5 shadow-sm",
        className,
      )}
    >
      <CardHeader className="px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base font-black">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <SparklesIcon className="size-4" />
              </span>
              AI Health Snapshot
            </CardTitle>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Daily review va AI reportlar uchun tezkor kirish.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={viewModel.isPremium ? "default" : "secondary"}>
              {viewModel.badgeLabel}
            </Badge>
            {viewModel.hasTodayCachedReport ? (
              <Badge variant="outline">
                <CheckCircle2Icon data-icon="inline-start" />
                Cached today
              </Badge>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 px-5">
        {insights.hasError ? (
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-100">
            <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
            <span>AI snapshot to&apos;liq yangilanmadi</span>
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
          <div className="min-w-0">
            {viewModel.statusLabel ? (
              <Badge
                variant={viewModel.noQuota ? "destructive" : "outline"}
                className="mb-3"
              >
                {viewModel.statusLabel}
              </Badge>
            ) : null}
            <h2 className="text-xl font-black leading-tight">
              {viewModel.title}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              {viewModel.description}
            </p>
            {viewModel.nextAction ? (
              <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase text-primary">
                  Keyingi harakat
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {viewModel.nextAction}
                </p>
              </div>
            ) : null}
          </div>

          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-2">
              <InsightMetric
                label="Bugungi ball"
                value={viewModel.dailyScoreLabel}
                tone="good"
              />
              <InsightMetric label="Kvota" value={viewModel.quotaLabel} />
              <InsightMetric
                label="Davr"
                value={viewModel.latestPeriodLabel}
              />
              <InsightMetric label="Premium" value={viewModel.lockedLabel} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/user/report">
                  {viewModel.primaryActionLabel}
                  <ArrowRightIcon data-icon="inline-end" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const DashboardAiInsightCardWithData = ({ dateKey, user, className }) => {
  const insights = useDashboardAiInsights(dateKey);

  return (
    <DashboardAiInsightCardView
      className={className}
      dateKey={dateKey}
      insights={insights}
      user={user}
    />
  );
};

export default function DashboardAiInsightCard({
  dateKey,
  insights,
  user,
  className,
}) {
  if (insights) {
    return (
      <DashboardAiInsightCardView
        className={className}
        dateKey={dateKey}
        insights={insights}
        user={user}
      />
    );
  }

  return (
    <DashboardAiInsightCardWithData
      className={className}
      dateKey={dateKey}
      user={user}
    />
  );
}
