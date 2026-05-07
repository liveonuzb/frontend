import { get, map, times } from "lodash";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIcon,
  AlertTriangleIcon,
  BotIcon,
  CalendarClockIcon,
  ClipboardCheckIcon,
  FileTextIcon,
  FlameIcon,
  MessageSquareIcon,
  NotebookTabsIcon,
  RouteIcon,
  SaladIcon,
  StickyNoteIcon,
  TargetIcon,
  WalletCardsIcon,
} from "lucide-react";
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

const LIFECYCLE_LABELS = {
  lead: "Lead",
  active: "Active",
  paused: "Paused",
  at_risk: "At risk",
  churned: "Churned",
};

const formatPercent = (value, fallback) =>
  value === null || value === undefined ? fallback : `${value}%`;

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("uz-UZ", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("uz-UZ", {
    day: "2-digit",
    month: "short",
  });
};

const getPlanLabel = (plan, emptyLabel) => plan?.name || plan?.title || emptyLabel;

const buildClient360CommandItems = (summary) => {
  const commandCenter = get(summary, "commandCenter", {});
  const lifecycleStage =
    get(commandCenter, "lifecycle.stage") || get(summary, "client.status");
  const paymentStatus =
    get(commandCenter, "payment.label") ||
    get(commandCenter, "payment.status") ||
    "Belgilanmagan";
  const missedCheckIns = get(commandCenter, "checkIns.missed", 0);
  const pendingCheckIns = get(commandCenter, "checkIns.pending", 0);
  const openTasks = get(commandCenter, "tasks.open", 0);
  const overdueTasks = get(commandCenter, "tasks.overdue", 0);
  const notesTotal = get(commandCenter, "notes.total", 0);
  const mealPlan = get(commandCenter, "plans.meal");
  const workoutPlan = get(commandCenter, "plans.workout");
  const nextSession = get(commandCenter, "sessions.next");
  const reportsTotal = get(commandCenter, "reports.totalGenerated", 0);
  const latestReportAt = get(commandCenter, "reports.latest.generatedAt");
  const telegram = get(commandCenter, "telegram", {});
  const lastContact = get(commandCenter, "lastContact");

  return [
    {
      key: "lifecycle",
      label: "Lifecycle",
      value: LIFECYCLE_LABELS[lifecycleStage] || lifecycleStage || "-",
      hint: get(commandCenter, "lifecycle.contactMethod") || "CRM status",
      icon: RouteIcon,
    },
    {
      key: "payment",
      label: "Payment",
      value: paymentStatus,
      hint: get(commandCenter, "payment.dueDate")
        ? `Due ${formatDate(get(commandCenter, "payment.dueDate"))}`
        : "Billing state",
      icon: WalletCardsIcon,
      alert: get(commandCenter, "payment.status") === "overdue",
    },
    {
      key: "checkins",
      label: "Check-ins",
      value: `${pendingCheckIns} pending`,
      hint: missedCheckIns ? `${missedCheckIns} missed` : "No missed check-ins",
      icon: ClipboardCheckIcon,
      alert: missedCheckIns > 0,
    },
    {
      key: "tasks",
      label: "Tasks",
      value: `${openTasks} open`,
      hint: overdueTasks ? `${overdueTasks} overdue` : "No overdue tasks",
      icon: StickyNoteIcon,
      alert: overdueTasks > 0,
    },
    {
      key: "notes",
      label: "Notes",
      value: `${notesTotal} note`,
      hint:
        get(commandCenter, "notes.latest.title") ||
        get(commandCenter, "notes.latest.preview") ||
        "Private coach context",
      icon: NotebookTabsIcon,
    },
    {
      key: "plans",
      label: "Plans",
      value: getPlanLabel(mealPlan, "Meal yo'q"),
      hint: getPlanLabel(workoutPlan, "Workout yo'q"),
      icon: SaladIcon,
      alert: !mealPlan || !workoutPlan,
    },
    {
      key: "sessions",
      label: "Sessions",
      value: nextSession ? formatDate(nextSession.date) : "No upcoming",
      hint: nextSession?.selectedSlot || nextSession?.title || "Booking queue",
      icon: CalendarClockIcon,
    },
    {
      key: "reports",
      label: "Reports",
      value: `${reportsTotal} generated`,
      hint: latestReportAt ? formatDateTime(latestReportAt) : "No report yet",
      icon: FileTextIcon,
    },
    {
      key: "telegram",
      label: "Telegram",
      value: telegram.connected ? "Connected" : "Not linked",
      hint: telegram.username
        ? `@${telegram.username}`
        : telegram.lastActiveAt
          ? formatDateTime(telegram.lastActiveAt)
          : "Bot status",
      icon: BotIcon,
      alert: telegram.isBlocked || telegram.isMuted || !telegram.connected,
    },
    {
      key: "last-contact",
      label: "Last contact",
      value: lastContact ? formatDateTime(lastContact.at) : "-",
      hint: lastContact?.channel || "No chat activity",
      icon: MessageSquareIcon,
      alert: !lastContact,
    },
  ];
};

export default function Client360SummaryWidget({ summary, isLoading }) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <section className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-56 rounded-md" />
            <Skeleton className="h-7 w-24 rounded-full" />
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            {map(times(4), (index) => (
              <Skeleton
                key={`summary-skeleton-${index}`}
                className="h-28 rounded-lg"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!summary) {
    return null;
  }

  const riskLevel = get(summary, "risk.level") || "low";
  const risk = RISK_STYLES[riskLevel] || RISK_STYLES.low;
  const noData = t("coach.clients.clientDetail.summary.noData", {
    defaultValue: "No data",
  });
  const nutritionPercent = get(summary, "adherence.nutrition.percent");
  const workoutPercent = get(summary, "adherence.workout.percent");
  const loggedDays = get(summary, "tracking.loggedDays") ?? 0;
  const paymentStatus = get(summary, "payment.status") || "not_set";
  const commandItems = buildClient360CommandItems(summary);
  const metrics = [
    {
      label: t("coach.clients.clientDetail.summary.nutrition", {
        defaultValue: "Nutrition adherence",
      }),
      value: formatPercent(nutritionPercent, noData),
      hint:
        get(summary, "adherence.nutrition.averageCalories") != null
          ? `${get(summary, "adherence.nutrition.averageCalories")} kcal avg`
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
        get(summary, "adherence.workout.totalMinutes") != null
          ? `${get(summary, "adherence.workout.totalMinutes")} min / week`
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
        get(summary, "payment.label") ||
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
    <section className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg border bg-background">
              <TargetIcon className="size-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">
                {t("coach.clients.clientDetail.summary.title", {
                  defaultValue: "Client 360 command center",
                })}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("coach.clients.clientDetail.summary.description", {
                  defaultValue:
                    "Risk, adherence, commerce and communication state from the latest client data.",
                })}
              </p>
            </div>
          </div>

          <div className="min-w-[180px] rounded-lg border bg-background p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase text-muted-foreground">
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
                {get(summary, "risk.score") ?? 0}
              </span>
              <span className="pb-1 text-sm font-semibold text-muted-foreground">
                /100
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full", risk.bar)}
                style={{ width: `${get(summary, "risk.score") ?? 0}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {map(metrics, (metric) => (
            <div
              key={metric.label}
              className="rounded-lg border bg-background p-4"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-lg border",
                    metric.tone,
                  )}
                >
                  <metric.icon className="size-5" />
                </div>
                {metric.progress < 50 && (
                  <AlertTriangleIcon className="size-4 text-amber-500" />
                )}
              </div>
              <p className="text-xs font-bold uppercase text-muted-foreground">
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

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {map(commandItems, (item) => (
            <div
              key={item.key}
              className={cn(
                "min-h-28 rounded-lg border bg-background p-4",
                item.alert && "border-amber-500/40 bg-amber-500/5",
              )}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex size-8 items-center justify-center rounded-md border bg-card">
                  <item.icon className="size-4" />
                </div>
                {item.alert ? (
                  <AlertTriangleIcon className="size-4 text-amber-500" />
                ) : null}
              </div>
              <p className="text-xs font-bold uppercase text-muted-foreground">
                {item.label}
              </p>
              <p className="mt-1 truncate text-sm font-black">
                {item.value}
              </p>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {item.hint || "-"}
              </p>
            </div>
          ))}
        </div>

        {summary.nextAction && (
          <div className="rounded-lg border bg-background p-4">
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
      </div>
    </section>
  );
}
