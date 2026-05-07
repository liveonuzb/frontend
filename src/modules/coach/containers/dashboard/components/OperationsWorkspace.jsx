import React from "react";
import { motion } from "framer-motion";
import {
  ActivityIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
  CalendarClockIcon,
  CheckCircle2Icon,
  ClipboardCheckIcon,
  ClockIcon,
  MessageSquareIcon,
  MessageSquareWarningIcon,
  ReceiptTextIcon,
  ShieldAlertIcon,
  UserPlusIcon,
  UsersIcon,
  WalletCardsIcon,
} from "lucide-react";
import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatMoney, greeting } from "./dashboard-ui.jsx";

const PRIORITY_WEIGHT = {
  high: 30,
  medium: 20,
  low: 10,
};

const PRIORITY_LABEL = {
  high: "Yuqori",
  medium: "O'rta",
  low: "Past",
};

const PRIORITY_CLASS = {
  high: "border-destructive/20 bg-destructive/10 text-destructive",
  medium: "border-amber-500/20 bg-amber-500/10 text-amber-600",
  low: "border-primary/20 bg-primary/10 text-primary",
};

const ACTION_META = {
  payment_overdue: {
    icon: WalletCardsIcon,
    label: "Kechikkan to'lov",
    cta: "To'lovni ko'rish",
    route: "/coach/payments",
  },
  checkin_overdue: {
    icon: ClipboardCheckIcon,
    label: "Check-in kechikdi",
    cta: "Check-inni ko'rish",
    route: "/coach/clients",
  },
  reminder_overdue: {
    icon: CalendarClockIcon,
    label: "Reminder kechikdi",
    cta: "Reminderni ochish",
    route: "/coach/notifications",
  },
  reminder_due: {
    icon: ClockIcon,
    label: "Bugungi reminder",
    cta: "Reminderni ochish",
    route: "/coach/notifications",
  },
  inactive_client: {
    icon: ActivityIcon,
    label: "Faollik pasaydi",
    cta: "Mijozni ochish",
    route: "/coach/clients",
  },
  plan_update_pending: {
    icon: ClipboardCheckIcon,
    label: "Plan update",
    cta: "Planlarni ko'rish",
    route: "/coach/meal-plans",
  },
};

const routeWithClient = (baseRoute, clientId) => {
  if (!clientId) return baseRoute;
  return `/coach/clients?clientId=${encodeURIComponent(clientId)}`;
};

const normalizePriority = (severity) => {
  if (severity === "high") return "high";
  if (severity === "medium") return "medium";
  return "low";
};

const compactNumber = (value) =>
  new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 0 }).format(
    Number(value ?? 0),
  );

const buildAlertAction = (alert, index) => {
  const meta = ACTION_META[alert.type] ?? {
    icon: AlertTriangleIcon,
    label: alert.title || "Alert",
    cta: "Ko'rish",
    route: "/coach/clients",
  };
  const priority = normalizePriority(alert.severity);

  return {
    id: alert.id ?? `alert:${index}`,
    icon: meta.icon,
    category: meta.label,
    title: alert.title || meta.label,
    description: alert.message || "Operatsion e'tibor talab qiladi.",
    priority,
    cta: meta.cta,
    route: routeWithClient(meta.route, alert.clientId),
    sourceRank: index,
  };
};

const buildActionQueue = ({
  alerts = [],
  pendingInvitations = [],
  recentCheckIns = [],
  metrics = {},
  operationalKpis = {},
}) => {
  const items = [];

  pendingInvitations.slice(0, 3).forEach((invitation, index) => {
    const clientName = invitation.client?.name || "Yangi mijoz";
    const initiatedByCoach = Boolean(invitation.initiatedByCoach);

    items.push({
      id: `invitation:${invitation.id ?? index}`,
      icon: UserPlusIcon,
      category: initiatedByCoach ? "Taklif kutilmoqda" : "Yangi mijoz so'rovi",
      title: clientName,
      description:
        invitation.client?.email ||
        invitation.client?.phone ||
        "Kontakt ma'lumoti yo'q.",
      priority: initiatedByCoach ? "medium" : "high",
      cta: "So'rovlarni ko'rish",
      route: "/coach/clients",
      sourceRank: index,
    });
  });

  alerts.forEach((alert, index) => {
    items.push(buildAlertAction(alert, index + 10));
  });

  const hasType = (type) => alerts.some((alert) => alert.type === type);

  if ((metrics.noReplyClients ?? 0) > 0) {
    items.push({
      id: "metric:no-reply",
      icon: MessageSquareWarningIcon,
      category: "Chat javobi",
      title: "Javobsiz chatlar",
      description: `${metrics.noReplyClients} ta mijoz xabari javob kutyapti.`,
      priority: "high",
      cta: "Chatni ochish",
      route: "/coach/chat",
      sourceRank: 50,
    });
  }

  if ((metrics.overduePayments ?? 0) > 0 && !hasType("payment_overdue")) {
    items.push({
      id: "metric:overdue-payments",
      icon: WalletCardsIcon,
      category: "Kechikkan to'lov",
      title: `${metrics.overduePayments} ta to'lov kechikkan`,
      description: `${formatMoney(metrics.overdueRevenue ?? 0)} overdue revenue.`,
      priority: "high",
      cta: "To'lovlarni ko'rish",
      route: "/coach/payments",
      sourceRank: 60,
    });
  }

  if ((metrics.overdueCheckIns ?? 0) > 0 && !hasType("checkin_overdue")) {
    items.push({
      id: "metric:overdue-checkins",
      icon: ClipboardCheckIcon,
      category: "Check-in kechikdi",
      title: `${metrics.overdueCheckIns} ta check-in overdue`,
      description: "Haftalik progress va adherence javobini yopish kerak.",
      priority: "medium",
      cta: "Mijozlarni ko'rish",
      route: "/coach/clients",
      sourceRank: 70,
    });
  }

  if ((metrics.duePayments ?? 0) > 0) {
    items.push({
      id: "metric:due-payments",
      icon: ReceiptTextIcon,
      category: "Bugungi follow-up",
      title: `${metrics.duePayments} ta to'lov bugun due`,
      description: "Payment reminder yoki receipt tasdiqlashni rejalashtiring.",
      priority: "medium",
      cta: "To'lovlarni ko'rish",
      route: "/coach/payments",
      sourceRank: 80,
    });
  }

  if ((operationalKpis.sessions?.actionable ?? 0) > 0) {
    items.push({
      id: "kpi:sessions",
      icon: CalendarClockIcon,
      category: "Session queue",
      title: `${operationalKpis.sessions.actionable} ta session action talab qiladi`,
      description:
        "Rejalashtirilgan, pending yoki qayta belgilash kerak bo'lgan sessionlar.",
      priority: "medium",
      cta: "Sessionlarni ochish",
      route: "/coach/sessions",
      sourceRank: 90,
    });
  }

  const nextPendingCheckIn = recentCheckIns.find((item) =>
    ["pending", "overdue"].includes(item.status),
  );

  if (nextPendingCheckIn && !hasType("checkin_overdue")) {
    items.push({
      id: `checkin:${nextPendingCheckIn.id}`,
      icon: ClipboardCheckIcon,
      category: "Check-in queue",
      title: nextPendingCheckIn.client?.name || nextPendingCheckIn.title,
      description:
        nextPendingCheckIn.status === "overdue"
          ? "Check-in muddati o'tgan."
          : `Due date: ${nextPendingCheckIn.dueDate || "belgilanmagan"}.`,
      priority: nextPendingCheckIn.status === "overdue" ? "high" : "medium",
      cta: "Mijozni ochish",
      route: routeWithClient("/coach/clients", nextPendingCheckIn.client?.id),
      sourceRank: 100,
    });
  }

  if ((metrics.churnRiskClients ?? 0) > 0) {
    items.push({
      id: "metric:churn-risk",
      icon: ShieldAlertIcon,
      category: "Retention",
      title: `${metrics.churnRiskClients} ta churn risk mijoz`,
      description:
        "No-reply, overdue yoki activity pasayishi retention call talab qiladi.",
      priority: "medium",
      cta: "Mijozlarni ko'rish",
      route: "/coach/clients",
      sourceRank: 110,
    });
  }

  const deduped = Array.from(
    new Map(items.map((item) => [item.id, item])).values(),
  );

  return deduped
    .sort((a, b) => {
      const priorityDiff =
        (PRIORITY_WEIGHT[b.priority] ?? 0) - (PRIORITY_WEIGHT[a.priority] ?? 0);
      if (priorityDiff !== 0) return priorityDiff;
      return a.sourceRank - b.sourceRank;
    })
    .slice(0, 6);
};

const ActionQueueSkeleton = () => (
  <div className="divide-y">
    {[1, 2, 3, 4].map((item) => (
      <div key={item} className="flex items-center gap-3 px-5 py-4">
        <Skeleton className="size-10 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-3 w-24 rounded" />
          <Skeleton className="h-4 w-48 rounded" />
          <Skeleton className="h-3 w-64 max-w-full rounded" />
        </div>
        <Skeleton className="hidden h-8 w-24 rounded-xl sm:block" />
      </div>
    ))}
  </div>
);

const EmptyActionQueue = ({ onNavigate }) => (
  <div className="flex min-h-[312px] flex-col items-center justify-center px-6 py-12 text-center">
    <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
      <CheckCircle2Icon className="size-6" />
    </div>
    <p className="text-base font-black">Action queue toza</p>
    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
      Overdue payment, unread chat, check-in yoki pending receipt topilmadi.
    </p>
    <Button
      variant="outline"
      size="sm"
      className="mt-5 rounded-xl"
      onClick={() => onNavigate("/coach/clients")}
    >
      Mijozlarni ko'rish <ArrowRightIcon className="ml-1.5 size-3.5" />
    </Button>
  </div>
);

const ActionRow = ({ item, index, onNavigate }) => {
  const Icon = item.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.24 }}
      className="group flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-muted/45 sm:flex-row sm:items-center sm:justify-between"
    >
      <button
        type="button"
        className="flex min-w-0 flex-1 items-start gap-3 text-left"
        onClick={() => onNavigate(item.route)}
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border bg-background text-muted-foreground transition-colors group-hover:text-foreground">
          <Icon className="size-4" />
        </span>
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                "h-5 text-[10px] font-bold",
                PRIORITY_CLASS[item.priority],
              )}
            >
              {PRIORITY_LABEL[item.priority]}
            </Badge>
            <span className="text-[10px] font-black uppercase text-muted-foreground">
              {item.category}
            </span>
          </span>
          <span className="mt-1 block truncate text-sm font-black">
            {item.title}
          </span>
          <span className="mt-0.5 block line-clamp-2 text-xs text-muted-foreground">
            {item.description}
          </span>
        </span>
      </button>
      <Button
        variant="outline"
        size="sm"
        className="h-8 shrink-0 rounded-xl text-xs"
        onClick={() => onNavigate(item.route)}
      >
        {item.cta} <ArrowRightIcon className="ml-1.5 size-3.5" />
      </Button>
    </motion.div>
  );
};

const SnapshotMetric = ({ label, value, hint, tone = "default" }) => (
  <div
    className={cn(
      "rounded-2xl border bg-background/70 p-3",
      tone === "danger" && "border-destructive/25 bg-destructive/5",
      tone === "warning" && "border-amber-500/25 bg-amber-500/5",
      tone === "success" && "border-emerald-500/25 bg-emerald-500/5",
    )}
  >
    <p className="text-[10px] font-black uppercase text-muted-foreground">
      {label}
    </p>
    <p className="mt-1 text-xl font-black tracking-tight">{value}</p>
    {hint ? (
      <p className="mt-0.5 truncate text-[10px] font-medium text-muted-foreground">
        {hint}
      </p>
    ) : null}
  </div>
);

const OperationsSnapshot = ({
  metrics = {},
  operationalKpis = {},
  onNavigate,
}) => {
  const sessionActionable = operationalKpis.sessions?.actionable ?? 0;

  return (
    <aside className="rounded-3xl border bg-card/70 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase text-muted-foreground">
            Bugungi snapshot
          </p>
          <h2 className="mt-1 text-lg font-black tracking-tight">
            Operatsion risklar
          </h2>
        </div>
        <Badge variant="secondary" className="rounded-xl text-xs">
          {compactNumber(metrics.activeClients)} faol
        </Badge>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <SnapshotMetric
          label="Overdue"
          value={compactNumber(metrics.overdueClients ?? 0)}
          hint={`${compactNumber(metrics.overduePayments ?? 0)} payment`}
          tone={(metrics.overdueClients ?? 0) > 0 ? "danger" : "success"}
        />
        <SnapshotMetric
          label="No-reply"
          value={compactNumber(metrics.noReplyClients ?? 0)}
          hint="Unread chat"
          tone={(metrics.noReplyClients ?? 0) > 0 ? "warning" : "success"}
        />
        <SnapshotMetric
          label="Check-in"
          value={compactNumber(metrics.pendingCheckIns ?? 0)}
          hint={`${compactNumber(metrics.overdueCheckIns ?? 0)} overdue`}
          tone={(metrics.overdueCheckIns ?? 0) > 0 ? "warning" : "default"}
        />
        <SnapshotMetric
          label="Churn risk"
          value={compactNumber(metrics.churnRiskClients ?? 0)}
          hint="Retention follow-up"
          tone={(metrics.churnRiskClients ?? 0) > 0 ? "danger" : "success"}
        />
      </div>

      <div className="mt-5 rounded-2xl border bg-background/70 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase text-muted-foreground">
              Revenue
            </p>
            <p className="mt-1 truncate text-lg font-black">
              {formatMoney(metrics.collectedRevenue ?? 0)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-medium text-muted-foreground">MRR</p>
            <p className="text-sm font-black">
              {formatMoney(metrics.mrr ?? metrics.expectedRevenue ?? 0)}
            </p>
          </div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-emerald-500"
            style={{
              width: `${Math.min(
                100,
                Math.round(
                  ((metrics.collectedRevenue ?? 0) /
                    Math.max(metrics.expectedRevenue ?? 0, 1)) *
                    100,
                ),
              )}%`,
            }}
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          className="justify-start rounded-xl text-xs"
          onClick={() => onNavigate("/coach/payments")}
        >
          <WalletCardsIcon className="mr-1.5 size-3.5" />
          To'lovlar
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="justify-start rounded-xl text-xs"
          onClick={() => onNavigate("/coach/chat")}
        >
          <MessageSquareIcon className="mr-1.5 size-3.5" />
          Chat
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="justify-start rounded-xl text-xs"
          onClick={() => onNavigate("/coach/sessions")}
        >
          <CalendarClockIcon className="mr-1.5 size-3.5" />
          Sessions
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="justify-start rounded-xl text-xs"
          onClick={() => onNavigate("/coach/clients")}
        >
          <UsersIcon className="mr-1.5 size-3.5" />
          Mijozlar
        </Button>
      </div>

      {sessionActionable > 0 ? (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs font-medium text-amber-700">
          <CalendarClockIcon className="size-4 shrink-0" />
          {sessionActionable} ta session action kutyapti
        </div>
      ) : null}
    </aside>
  );
};

export const OperationsWorkspace = ({
  coachName,
  metrics = {},
  operationalKpis = {},
  alerts = [],
  pendingInvitations = [],
  recentCheckIns = [],
  isLoading = false,
  timeRange,
  rangeOptions = [],
  onTimeRangeChange,
}) => {
  const navigate = useNavigate();
  const actionItems = React.useMemo(
    () =>
      buildActionQueue({
        alerts,
        pendingInvitations,
        recentCheckIns,
        metrics,
        operationalKpis,
      }),
    [alerts, pendingInvitations, recentCheckIns, metrics, operationalKpis],
  );

  const handleNavigate = React.useCallback(
    (route) => {
      navigate(route);
    },
    [navigate],
  );

  const highPriorityCount = actionItems.filter(
    (item) => item.priority === "high",
  ).length;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.85fr)]">
      <motion.section
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-3xl border bg-card/75 shadow-sm"
      >
        <div className="flex flex-col gap-4 border-b px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase text-muted-foreground">
              Coach operations
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
              {greeting()}, {coachName}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Overdue payment, unread chat, check-in, high-risk client va
              receipt follow-uplar bir joyda.
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
            {highPriorityCount > 0 ? (
              <Badge className="h-7 border-destructive/20 bg-destructive/10 px-3 font-bold text-destructive">
                {highPriorityCount} yuqori prioritet
              </Badge>
            ) : null}
            <Tabs value={timeRange} onValueChange={onTimeRangeChange}>
              <TabsList className="grid w-full grid-cols-4 sm:w-[292px]">
                {rangeOptions.map((item) => (
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
            <Button onClick={() => handleNavigate("/coach/clients")}>
              Mijozlar ro'yxati
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-b px-5 py-3">
          <div>
            <h2 className="text-base font-black">Bugungi action queue</h2>
            <p className="text-xs text-muted-foreground">
              Eng katta risk va javob kutayotgan ishlar birinchi turadi.
            </p>
          </div>
          <Badge variant="outline" className="rounded-xl text-xs">
            {isLoading ? "..." : `${actionItems.length} task`}
          </Badge>
        </div>

        {isLoading ? (
          <ActionQueueSkeleton />
        ) : actionItems.length > 0 ? (
          <div className="divide-y">
            {actionItems.map((item, index) => (
              <ActionRow
                key={item.id}
                item={item}
                index={index}
                onNavigate={handleNavigate}
              />
            ))}
          </div>
        ) : (
          <EmptyActionQueue onNavigate={handleNavigate} />
        )}
      </motion.section>

      <OperationsSnapshot
        metrics={metrics}
        operationalKpis={operationalKpis}
        onNavigate={handleNavigate}
      />
    </div>
  );
};

export default OperationsWorkspace;
