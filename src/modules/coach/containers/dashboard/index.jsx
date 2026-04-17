import React from "react";
import { motion } from "framer-motion";
import { filter, get, slice, split } from "lodash";
import { useNavigate } from "react-router";
import {
  ActivityIcon,
  AlertCircleIcon,
  ArrowRightIcon,
  BanknoteIcon,
  CheckCircle2Icon,
  CircleDollarSignIcon,
  ClockIcon as LucideClockIcon,
  Loader2Icon,
  MegaphoneIcon,
  SaladIcon,
  TargetIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  UsersIcon,
  WalletIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore, useBreadcrumbStore } from "@/store";
import {
  useCoachDashboard,
  useCoachWorkoutPlans,
} from "@/hooks/app/use-coach.js";
import { ReferralCard } from "./components/referral-card";
import PageTransition from "@/components/page-transition";
import RechartsLine from "@/components/charts/line-chart";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ─────────────── Helpers ──────────────────────────────────────────────────

const getInitials = (name = "") =>
  String(name)
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("uz-UZ", { dateStyle: "medium" }).format(
        new Date(value),
      )
    : "—";

const formatMoney = (value) => {
  if (!value || Number(value) === 0) return "0 so'm";
  return `${new Intl.NumberFormat("uz-UZ").format(Math.round(Number(value)))} so'm`;
};

const revenueChange = (current, previous) => {
  if (!previous || previous === 0) return null;
  const diff = current - previous;
  const pct = Math.round((diff / previous) * 100);
  return { diff, pct, up: diff >= 0 };
};

const formatMonthlyPrice = (value) => {
  if (!Number.isFinite(Number(value)) || Number(value) <= 0)
    return "Kelishiladi";
  return `${new Intl.NumberFormat("uz-UZ").format(Number(value))} so'm/oy`;
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 6) return "Xayrli tun";
  if (h < 12) return "Xayrli tong";
  if (h < 18) return "Xayrli kun";
  return "Xayrli kech";
};

// ─────────────── Stat card ─────────────────────────────────────────────────

const StatCard = ({ icon: Icon, label, value, hint, color = "primary", index = 0 }) => {
  const colors = {
    primary: "bg-primary/20 text-primary border-primary/20",
    emerald: "bg-emerald-500/20 text-emerald-600 border-emerald-500/20",
    blue: "bg-blue-500/20 text-blue-600 border-blue-500/20",
    amber: "bg-amber-500/20 text-amber-600 border-amber-500/20",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
    >
      <Card className="group relative overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 border-none bg-card/60 backdrop-blur-md">
        <div className={cn(
          "absolute -right-12 -top-12 size-32 rounded-full opacity-10 blur-3xl transition-all group-hover:opacity-20",
          split(colors[color], " ")[1].replace("text-", "bg-")
        )} />
        <CardContent className="flex flex-col gap-4 p-6">
          <div className={cn(
            "flex size-10 items-center justify-center rounded-xl border transition-transform group-hover:scale-110 shadow-sm",
            colors[color]
          )}>
            <Icon className="size-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">{label}</p>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-3xl font-black tracking-tighter">{value}</span>
            </div>
            {hint && (
              <p className="mt-1.5 text-[10px] font-medium text-muted-foreground/60 flex items-center gap-1">
                <LucideClockIcon className="size-3" />
                {hint}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// ─────────────── List row ─────────────────────────────────────────────────

const ListRow = ({ onClick, children, className }) => (
  <div
    onClick={onClick}
    className={cn(
      "flex items-center justify-between px-4 py-4 transition-all duration-200",
      onClick && "cursor-pointer hover:bg-muted/50 hover:px-5 group",
      className,
    )}
  >
    {children}
  </div>
);

// ─────────────── Section card ─────────────────────────────────────────────

const SectionCard = ({
  title,
  description,
  action,
  badge,
  children,
  className,
}) => (
  <Card className={cn("overflow-hidden border-none bg-card/50 backdrop-blur-sm shadow-xl", className)}>
    <CardHeader className="flex flex-row items-center justify-between gap-2 px-6 py-5">
      <div className="min-w-0">
        <CardTitle className="text-base font-black tracking-tight">{title}</CardTitle>
        {description && (
          <CardDescription className="mt-1 text-xs font-medium text-muted-foreground/70">
            {description}
          </CardDescription>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {badge != null && (
          <Badge variant="secondary" className="tabular-nums bg-primary/10 text-primary border-primary/20 font-bold">
            {badge}
          </Badge>
        )}
        {action}
      </div>
    </CardHeader>
    <CardContent className="px-6 pb-6 pt-0">{children}</CardContent>
  </Card>
);

const EmptyState = ({ text, icon: Icon = SaladIcon }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="flex size-12 items-center justify-center rounded-2xl bg-muted/30 text-muted-foreground/40 mb-3">
      <Icon className="size-6" />
    </div>
    <p className="text-sm font-medium text-muted-foreground/60">{text}</p>
  </div>
);

const ListSkeleton = () => (
  <div className="flex flex-col divide-y">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex items-center gap-3 px-4 py-3">
        <Skeleton className="size-9 shrink-0 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-32 rounded" />
          <Skeleton className="h-3 w-20 rounded" />
        </div>
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
    ))}
  </div>
);

// ─────────────── Status badge map ─────────────────────────────────────────

const checkInBadge = (status) => {
  if (status === "submitted")
    return { label: "Javob bor", cls: "bg-emerald-500/10 text-emerald-600" };
  if (status === "overdue")
    return { label: "Kechikkan", cls: "bg-destructive/10 text-destructive" };
  return { label: "Kutilmoqda", cls: "bg-amber-500/10 text-amber-600" };
};

const clientBadge = (status) => {
  if (status === "active")
    return { label: "Faol", cls: "bg-emerald-500/10 text-emerald-600" };
  if (status === "paused")
    return { label: "Pauza", cls: "bg-amber-500/10 text-amber-600" };
  return { label: "Faolsiz", cls: "bg-muted text-muted-foreground" };
};

// ─────────────── Main component ───────────────────────────────────────────

export default function CoachDashboardContainer() {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const user = useAuthStore((state) => state.user);
  const [chartPeriod, setChartPeriod] = React.useState("month");

  const {
    dashboard,
    isLoading,
    isError,
    refetch,
    respondToInvitation,
  } = useCoachDashboard();

  const { workoutPlans, isLoading: isWorkoutPlansLoading } =
    useCoachWorkoutPlans();

  React.useEffect(() => {
    setBreadcrumbs([{ url: "/coach", title: "Dashboard" }]);
  }, [setBreadcrumbs]);

  const metrics = get(dashboard, "metrics", {});
  const recentClients = get(dashboard, "recentClients", []);
  const overdueClients = get(dashboard, "overdueClients", []);
  const templates = get(dashboard, "templates", []);
  const pendingInvitations = get(dashboard, "pendingInvitations", []);
  const alerts = get(dashboard, "alerts", []);
  const paymentCharts = get(dashboard, "paymentChart", {
    week: [],
    month: [],
    year: [],
  });
  const paymentChartData = paymentCharts[chartPeriod] || [];

  const coachName =
    [get(user, "firstName"), get(user, "lastName")].filter(Boolean).join(" ").trim() ||
    get(user, "email") ||
    "Coach";

  const [invitationActionState, setInvitationActionState] = React.useState({});
  const setInvitationPending = React.useCallback((id, pending) => {
    setInvitationActionState((s) =>
      pending
        ? { ...s, [id]: true }
        : Object.fromEntries(Object.entries(s).filter(([k]) => k !== id)),
    );
  }, []);
  const isInvitationPending = (id) => Boolean(invitationActionState[id]);

  if (isError)
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

  const statCards = [
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

  return (
    <PageTransition mode="slide-up">
      <div className="flex flex-col gap-8 pb-24">
        {/* ── HEADER ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[32px] border-none shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-orange-500/10" />
          <div className="absolute -right-24 -top-24 size-96 rounded-full bg-primary/10 blur-[100px]" />
          <div className="absolute -left-20 bottom-10 size-64 rounded-full bg-orange-400/5 blur-[80px]" />

          <div className="relative flex flex-col gap-6 p-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                {greeting()},{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-500 to-primary/80 animate-gradient">
                  {coachName}
                </span>{" "}
                👋
              </h1>
              <p className="mt-2 text-base text-muted-foreground font-medium">
                Sizning barcha mijozlaringiz va rejalaringiz markazi.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {(metrics.pendingInvitations ?? 0) > 0 && (
                <Badge className="h-7 bg-amber-500/10 text-amber-600 border-orange-500/20 font-bold px-3">
                  {metrics.pendingInvitations} ta so&apos;rov
                </Badge>
              )}
              <Button onClick={() => navigate("/coach/clients")}>
                Mijozlar ro&apos;yxati
              </Button>
            </div>
          </div>
        </motion.div>
        {/* ── ALERTS ─────────────────────────────── */}
        {alerts.length > 0 && !isLoading && (
          <div className="rounded-3xl border border-destructive/25 bg-destructive/5 px-5 py-4">
            <div className="mb-3 flex items-center gap-2">
              <MegaphoneIcon className="size-4 text-destructive" />
              <p className="text-sm font-bold text-destructive">
                Muhim xabarnomalar
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {slice(alerts, 0, 4).map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between rounded-2xl bg-background/60 px-4 py-3 cursor-pointer hover:bg-background/80 transition-colors"
                  onClick={() =>
                    alert.clientId &&
                    navigate(`/coach/clients?clientId=${alert.clientId}`)
                  }
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {alert.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground truncate">
                      {alert.message}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "ml-3 shrink-0 text-[10px]",
                      alert.severity === "high" &&
                        "bg-destructive/10 text-destructive",
                      alert.severity === "medium" &&
                        "bg-amber-500/10 text-amber-600",
                    )}
                  >
                    {alert.severity === "high"
                      ? "Yuqori"
                      : alert.severity === "medium"
                        ? "O'rta"
                        : "Past"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STAT CARDS ─────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statCards.map((item, idx) => (
            <StatCard
              key={item.key}
              index={idx}
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

        {/* ── ANALYTICS ───────────────────────────────── */}
        {!isLoading && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {/* Monthly Revenue */}
              <Card className="group relative overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 border-none bg-card/60 backdrop-blur-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      <WalletIcon className="size-5" />
                    </div>
                    {(() => {
                      const ch = revenueChange(metrics.monthlyRevenue ?? 0, metrics.prevMonthRevenue ?? 0);
                      if (!ch) return null;
                      return (
                        <div className={cn(
                          "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black",
                          ch.up ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"
                        )}>
                          {ch.up ? <TrendingUpIcon className="size-3" /> : <TrendingDownIcon className="size-3" />}
                          {Math.abs(ch.pct)}%
                        </div>
                      );
                    })()}
                  </div>
                  <div className="mt-3">
                    <div className="text-xl font-bold tracking-tight">
                      {formatMoney(metrics.monthlyRevenue ?? 0)}
                    </div>
                    <div className="mt-0.5 text-sm text-muted-foreground">Bu oy daromad</div>
                    <p className="mt-1 text-xs text-muted-foreground/60">
                      {metrics.monthlyPaymentCount ?? 0} ta to&apos;lov
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Overdue Payments */}
              <Card className="group relative overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 border-none bg-card/60 backdrop-blur-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-red-500/10 text-red-600 border border-red-500/20">
                      <BanknoteIcon className="size-5" />
                    </div>
                    {(metrics.overduePayments ?? 0) > 0 && (
                      <Badge className="bg-red-500/10 text-red-600 border-red-500/20 text-[10px] font-bold">
                        Diqqat
                      </Badge>
                    )}
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl font-black tracking-tighter">
                      {metrics.overduePayments ?? 0}
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 mt-1">Kechikkan to&apos;lovlar</p>
                    <p className="mt-1.5 text-[10px] font-medium text-muted-foreground/60">
                      {metrics.duePayments ?? 0} ta bugun muhlati
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Average Progress */}
              <Card className="group relative overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 border-none bg-card/60 backdrop-blur-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20">
                      <CircleDollarSignIcon className="size-5" />
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                      {metrics.activeClients ?? 0} ta faol
                    </span>
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl font-black tracking-tighter">
                      {metrics.averageProgress ?? 0}%
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 mt-1">O&apos;rtacha progress</p>
                    <p className="mt-1.5 text-[10px] font-medium text-muted-foreground/60">
                      Barcha mijozlar bo&apos;yicha
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payments Chart */}
            <Card className="p-0 overflow-hidden">
                <CardHeader className="px-6 pt-6 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <CardTitle className="text-sm font-semibold">To&apos;lovlar dinamikasi</CardTitle>
                        <CardDescription className="text-xs">Statistik ko&apos;rsatkichlarni ko&apos;rish</CardDescription>
                    </div>
                    <Tabs value={chartPeriod} onValueChange={setChartPeriod} className="w-full sm:w-auto">
                        <TabsList className="grid w-full grid-cols-3 sm:w-[240px]">
                            <TabsTrigger value="week" className="text-xs">Hafta</TabsTrigger>
                            <TabsTrigger value="month" className="text-xs">Oy</TabsTrigger>
                            <TabsTrigger value="year" className="text-xs">Yillik</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </CardHeader>
                <CardContent className="px-2 pb-6 pt-2">
                    <div className="h-[280px] w-full mt-4">
                        <RechartsLine
                            data={paymentChartData}
                            dataKey="amount"
                            xAxisKey="label"
                            color="#10b981"
                            height={280}
                            showGrid={true}
                        />
                    </div>
                </CardContent>
            </Card>
          </div>
        )}

        {/* ── MAIN GRID ──────────────────────────── */}
        <div className="grid gap-4 lg:grid-cols-7">
          {/* LEFT */}
          <div className="space-y-4 lg:col-span-4">
            {/* Pending invitations */}
            {pendingInvitations.length > 0 && (
              <SectionCard
                title="Yangi mijozlar so'rovi"
                description="Qabul qilishni kutayotgan mijozlar"
                badge={pendingInvitations.length}
              >
                {slice(pendingInvitations, 0, 3).map((invitation, i) => (
                  <React.Fragment key={invitation.id}>
                    {i > 0 && <div className="mx-4 border-t" />}
                    <ListRow>
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="size-9 shrink-0">
                          <AvatarFallback className="text-xs">
                            {getInitials(invitation.client.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-black truncate">
                            {invitation.client.name}
                          </p>
                          <p className="mt-0.5 text-[10px] font-medium text-muted-foreground truncate flex items-center gap-1">
                            <LucideClockIcon className="size-3" />
                            {invitation.client.email ||
                              invitation.client.phone ||
                              "Kontakt ma'lumotlari yo'q"}
                          </p>
                        </div>
                      </div>
                      {!invitation.initiatedByCoach ? (
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-xl text-destructive border-destructive/30 hover:bg-destructive/10"
                            disabled={isInvitationPending(invitation.id)}
                            onClick={async () => {
                              setInvitationPending(invitation.id, true);
                              try {
                                await respondToInvitation(
                                  invitation.id,
                                  "decline",
                                );
                                toast.success("So'rov rad etildi");
                              } catch {
                                toast.error("Xatolik");
                              } finally {
                                setInvitationPending(invitation.id, false);
                              }
                            }}
                          >
                            <XIcon className="size-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            className="h-8 rounded-xl"
                            disabled={isInvitationPending(invitation.id)}
                            onClick={async () => {
                              setInvitationPending(invitation.id, true);
                              try {
                                await respondToInvitation(
                                  invitation.id,
                                  "accept",
                                );
                                toast.success("Mijoz biriktirildi");
                              } catch {
                                toast.error("Xatolik");
                              } finally {
                                setInvitationPending(invitation.id, false);
                              }
                            }}
                          >
                            <CheckCircle2Icon className="size-3.5 mr-1.5" />
                            Qabul
                          </Button>
                        </div>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="ml-3 shrink-0 text-xs"
                        >
                          Kutilmoqda
                        </Badge>
                      )}
                    </ListRow>
                  </React.Fragment>
                ))}
              </SectionCard>
            )}

            {/* Recent Clients */}
            <SectionCard
              title="Mijozlar"
              description="Eng faol mijozlaringiz"
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-xl text-xs"
                  onClick={() => navigate("/coach/clients")}
                >
                  Barchasi <ArrowRightIcon className="ml-1.5 size-3.5" />
                </Button>
              }
            >
              {isLoading ? (
                <ListSkeleton />
              ) : recentClients.length === 0 ? (
                <EmptyState text="Hozircha mijozlar yo'q" />
              ) : (
                slice(recentClients, 0, 5).map((client, i) => {
                  const badge = clientBadge(client.status);
                  return (
                    <React.Fragment key={client.id}>
                      {i > 0 && <div className="mx-4 border-t" />}
                      <ListRow
                        onClick={() => navigate(`/coach/clients/${client.id}`)}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="size-9 shrink-0">
                            <AvatarImage src={client.avatar} />
                            <AvatarFallback className="text-xs">
                              {getInitials(client.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-black truncate group-hover:text-primary transition-colors">
                              {client.name}
                            </p>
                            <p className="mt-0.5 text-[10px] font-semibold text-muted-foreground/70 truncate uppercase tracking-wider">
                              {client.goal || "Maqsad belgilanmagan"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-3">
                          <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold">
                              {client.progress ?? 0}%
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Progress
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            className={cn("text-xs", badge.cls)}
                          >
                            {badge.label}
                          </Badge>
                        </div>
                      </ListRow>
                    </React.Fragment>
                  );
                })
              )}
            </SectionCard>

            <SectionCard
              title="Kechikkan to'lovlar"
              badge={overdueClients.length > 0 ? overdueClients.length : null}
              className="border-destructive/20"
            >
              {isLoading ? (
                <ListSkeleton />
              ) : overdueClients.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 mb-2">
                    <CheckCircle2Icon className="size-5" />
                  </div>
                  <p className="text-sm font-medium">Barcha to&apos;lovlar o&apos;z vaqtida</p>
                  <p className="text-xs text-muted-foreground mt-1">Hozircha hech qanday kechikish yo&apos;q</p>
                </div>
              ) : (
                <div className="flex flex-col divide-y">
                  {overdueClients.map((client) => (
                    <ListRow
                      key={client.id}
                      onClick={() => navigate(`/coach/clients/${client.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9 rounded-full">
                          <AvatarImage src={client.avatar} />
                          <AvatarFallback className="text-[10px] bg-muted">
                            {getInitials(client.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{client.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs text-destructive font-semibold">
                              {formatMoney(client.agreedAmount)}
                            </span>
                            <span className="text-[10px] text-muted-foreground">• muhlati o&apos;tgan</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-[10px] px-1.5 h-5 flex items-center gap-1">
                          <AlertCircleIcon className="size-3" />
                          Kechikkan
                        </Badge>
                      </div>
                    </ListRow>
                  ))}
                </div>
              )}
            </SectionCard>

          </div>

          {/* RIGHT */}
          <div className="space-y-4 lg:col-span-3">
            {/* Workout Plans */}
            <SectionCard
              title="Workout Planlar"
              action={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-xl"
                  onClick={() => navigate("/coach/workout-plans")}
                >
                  <ArrowRightIcon className="size-4" />
                </Button>
              }
            >
              {isWorkoutPlansLoading ? (
                <ListSkeleton />
              ) : workoutPlans.length === 0 ? (
                <EmptyState text="Workout planlar yo'q" />
              ) : (
                slice(workoutPlans, 0, 3).map((plan, i) => (
                  <React.Fragment key={plan.id}>
                    {i > 0 && <div className="mx-4 border-t" />}
                    <ListRow onClick={() => navigate("/coach/workout-plans")}>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {plan.name}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span>{plan.totalExercises} mashq</span>
                          <span className="size-1 rounded-full bg-border inline-block" />
                          <span>{plan.daysWithWorkouts} kun</span>
                          {plan.difficulty && (
                            <>
                              <span className="size-1 rounded-full bg-border inline-block" />
                              <span className="uppercase font-medium">
                                {plan.difficulty}
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="ml-3 shrink-0 text-xs tabular-nums"
                      >
                        {plan.assignedClients.length} mijoz
                      </Badge>
                    </ListRow>
                  </React.Fragment>
                ))
              )}
            </SectionCard>

            {/* Meal Plans */}
            <SectionCard
              title="Meal Planlar"
              action={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-xl"
                  onClick={() => navigate("/coach/meal-plans")}
                >
                  <ArrowRightIcon className="size-4" />
                </Button>
              }
            >
              {isLoading ? (
                <ListSkeleton />
              ) : templates.length === 0 ? (
                <EmptyState text="Meal planlar yo'q" />
              ) : (
                slice(templates, 0, 3).map((plan, i) => (
                  <React.Fragment key={plan.id}>
                    {i > 0 && <div className="mx-4 border-t" />}
                    <ListRow onClick={() => navigate("/coach/meal-plans")}>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {plan.title}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {plan.mealsCount} ovqat • {plan.daysWithMeals} kun
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="ml-3 shrink-0 text-[10px] text-muted-foreground"
                      >
                        {plan.source === "ai" ? "AI" : "Qo'lda"}
                      </Badge>
                    </ListRow>
                  </React.Fragment>
                ))
              )}
            </SectionCard>

            {/* Referral */}
            <ReferralCard />
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
