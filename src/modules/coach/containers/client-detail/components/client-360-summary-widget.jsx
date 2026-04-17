import { get, map, times } from "lodash";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIcon,
  AlertTriangleIcon,
  ClipboardCheckIcon,
  FlameIcon,
  TargetIcon,
  WalletCardsIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const RISK_STYLES = {
  low: {
    label: "Low",
    className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
    bar: "bg-emerald-500",
  },
  medium: {
    label: "Medium",
    className: "border-amber-500/20 bg-amber-500/10 text-amber-700",
    bar: "bg-amber-500",
  },
  high: {
    label: "High",
    className: "border-red-500/20 bg-red-500/10 text-red-700",
    bar: "bg-red-500",
  },
};

const formatPercent = (value, fallback) =>
  value === null || value === undefined ? fallback : `${value}%`;

export default function Client360SummaryWidget({ summary, isLoading }) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-none bg-card/70 shadow-xl">
        <CardContent className="space-y-5 p-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-56 rounded-xl" />
            <Skeleton className="h-7 w-24 rounded-full" />
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            {map(times(4), (index) => (
              <Skeleton
                key={`summary-skeleton-${index}`}
                className="h-28 rounded-2xl"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return null;
  }

  const riskLevel = summary.get(risk, "level") || "low";
  const risk = RISK_STYLES[riskLevel] || RISK_STYLES.low;
  const noData = t("coach.clients.clientDetail.summary.noData", {
    defaultValue: "No data",
  });
  const nutritionPercent = summary.get(adherence, "nutrition.percent");
  const workoutPercent = summary.get(adherence, "workout.percent");
  const loggedDays = summary.get(tracking, "loggedDays") ?? 0;
  const paymentStatus = summary.get(payment, "status") || "not_set";
  const metrics = [
    {
      label: t("coach.clients.clientDetail.summary.nutrition", {
        defaultValue: "Nutrition adherence",
      }),
      value: formatPercent(nutritionPercent, noData),
      hint:
        summary.get(adherence, "nutrition.averageCalories") != null
          ? `${summary.adherence.nutrition.averageCalories} kcal avg`
          : t("coach.clients.clientDetail.summary.noCalorieLogs", {
              defaultValue: "No calorie logs",
            }),
      icon: FlameIcon,
      tone: "text-orange-600 bg-orange-500/10 border-orange-500/20",
      progress: nutritionPercent ?? 0,
    },
    {
      label: t("coach.clients.clientDetail.summary.workout", {
        defaultValue: "Workout adherence",
      }),
      value: formatPercent(workoutPercent, noData),
      hint:
        summary.get(adherence, "workout.totalMinutes") != null
          ? `${summary.adherence.workout.totalMinutes} min / week`
          : t("coach.clients.clientDetail.summary.noWorkoutLogs", {
              defaultValue: "No workout logs",
            }),
      icon: ActivityIcon,
      tone: "text-sky-600 bg-sky-500/10 border-sky-500/20",
      progress: workoutPercent ?? 0,
    },
    {
      label: t("coach.clients.clientDetail.summary.tracking", {
        defaultValue: "Tracking consistency",
      }),
      value: `${loggedDays}/7`,
      hint: t("coach.clients.clientDetail.summary.trackingHint", {
        defaultValue: "logged days this week",
      }),
      icon: ClipboardCheckIcon,
      tone: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
      progress: Math.round((loggedDays / 7) * 100),
    },
    {
      label: t("coach.clients.clientDetail.summary.payment", {
        defaultValue: "Payment status",
      }),
      value:
        summary.get(payment, "label") ||
        t("coach.clients.clientDetail.summary.paymentNotSet", {
          defaultValue: "Not set",
        }),
      hint:
        paymentStatus === "overdue"
          ? t("coach.clients.clientDetail.summary.paymentOverdue", {
              defaultValue: "follow up needed",
            })
          : t("coach.clients.clientDetail.summary.paymentHint", {
              defaultValue: "current billing state",
            }),
      icon: WalletCardsIcon,
      tone:
        paymentStatus === "overdue"
          ? "text-red-600 bg-red-500/10 border-red-500/20"
          : "text-violet-600 bg-violet-500/10 border-violet-500/20",
      progress: paymentStatus === "paid" ? 100 : paymentStatus === "overdue" ? 20 : 55,
    },
  ];

  return (
    <Card className="overflow-hidden border-none bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.14),transparent_36%),linear-gradient(135deg,hsl(var(--card)),hsl(var(--muted))/0.45)] shadow-xl">
      <CardContent className="space-y-6 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex size-10 items-center justify-center rounded-2xl border bg-background/70 shadow-sm">
                <TargetIcon className="size-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight">
                  {t("coach.clients.clientDetail.summary.title", {
                    defaultValue: "Client 360 summary",
                  })}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t("coach.clients.clientDetail.summary.description", {
                    defaultValue:
                      "Risk, adherence and next action from the latest client data.",
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="min-w-[180px] rounded-2xl border bg-background/70 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {t("coach.clients.clientDetail.summary.risk", {
                  defaultValue: "Risk score",
                })}
              </span>
              <Badge className={cn("border", risk.className)}>
                {t(`coach.clients.clientDetail.summary.riskLevel.${riskLevel}`, {
                  defaultValue: risk.label,
                })}
              </Badge>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black tabular-nums">
                {summary.get(risk, "score") ?? 0}
              </span>
              <span className="pb-1 text-sm font-semibold text-muted-foreground">
                /100
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full", risk.bar)}
                style={{ width: `${summary.get(risk, "score") ?? 0}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {map(metrics, (metric) => (
            <div
              key={metric.label}
              className="rounded-2xl border bg-background/70 p-4 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-xl border",
                    metric.tone,
                  )}
                >
                  <metric.icon className="size-5" />
                </div>
                {metric.progress < 50 && (
                  <AlertTriangleIcon className="size-4 text-amber-500" />
                )}
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {metric.label}
              </p>
              <p className="mt-1 text-2xl font-black tabular-nums">
                {metric.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {metric.hint}
              </p>
              <Progress value={metric.progress} className="mt-4 h-1.5" />
            </div>
          ))}
        </div>

        {summary.nextAction && (
          <div className="rounded-2xl border bg-background/75 p-4 shadow-sm">
            <div className="mb-1 flex items-center justify-between gap-3">
              <p className="text-sm font-black">
                {summary.nextAction.title}
              </p>
              <Badge variant="outline" className="capitalize">
                {summary.nextAction.priority}
              </Badge>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              {summary.nextAction.description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
