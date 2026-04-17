import React from "react";
import { Link, useNavigate } from "react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBreadcrumbStore } from "@/store";
import {
  ActivityIcon,
  AlertTriangleIcon,
  ArrowUpRightIcon,
  CalendarPlusIcon,
  CheckCircle2Icon,
  CircleDotIcon,
  Clock3Icon,
  CrownIcon,
  DatabaseIcon,
  FileClockIcon,
  FileDownIcon,
  HardDriveIcon,
  ServerIcon,
  SettingsIcon,
  ShieldCheckIcon,
  StarIcon,
  TagIcon,
  TrendingUpIcon,
  UserPlusIcon,
  UsersIcon,
  XCircleIcon,
  ZapIcon,
} from "lucide-react";
import { useGetQuery } from "@/hooks/api";
import { cn } from "@/lib/utils";
import { get, sortBy } from "lodash";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import PageTransition from "@/components/page-transition";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart.jsx";

const overviewCardConfig = [
  {
    key: "totalUsers",
    title: "Foydalanuvchilar",
    icon: UsersIcon,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    key: "totalCoaches",
    title: "Coachlar",
    icon: ShieldCheckIcon,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    key: "pendingCoaches",
    title: "Kutilayotgan coachlar",
    icon: Clock3Icon,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
  },
  {
    key: "totalFoods",
    title: "Ovqatlar bazasi",
    icon: TagIcon,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
];

const planBadgeStyles = {
  free: "",
  monthly:
    "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  yearly:
    "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800",
};

const formatUZS = (price = 0) =>
  `${new Intl.NumberFormat("uz-UZ").format(price)} so'm`;

const dashboardCardClassName =
  "py-6 border-border/70 shadow-sm transition-colors hover:border-primary/15";
const premiumTrendChartConfig = {
  free: {
    label: "Tekin",
    color: "#94a3b8",
  },
  premium: {
    label: "Premium",
    color: "#3b82f6",
  },
};

const getRelativeTimeLabel = (isoString) => {
  if (!isoString) return "Hozir";

  const deltaMinutes = Math.max(
    0,
    Math.round((Date.now() - new Date(isoString).getTime()) / 60000),
  );

  if (deltaMinutes < 1) return "Hozir";
  if (deltaMinutes < 60) return `${deltaMinutes} daqiqa oldin`;

  const deltaHours = Math.round(deltaMinutes / 60);
  if (deltaHours < 24) return `${deltaHours} soat oldin`;

  const deltaDays = Math.round(deltaHours / 24);
  return `${deltaDays} kun oldin`;
};

const quickActionItems = [
  {
    label: "Yangi foydalanuvchi",
    icon: UserPlusIcon,
    path: "/admin/users",
    variant: "outline",
  },
  {
    label: "Hisobot export",
    icon: FileDownIcon,
    path: "/admin/reports",
    variant: "outline",
  },
  {
    label: "Tizim sozlamalari",
    icon: SettingsIcon,
    path: "/admin/settings",
    variant: "outline",
  },
];

const topContentPlaceholder = [
  { name: "Tuxum bilan non", type: "food", detail: "150 kaloriya" },
  { name: "Tovuqli salat", type: "food", detail: "220 kaloriya" },
  { name: "Osh (palov)", type: "food", detail: "350 kaloriya" },
  { name: "Squat mashqi", type: "workout", detail: "30 daqiqa" },
  { name: "Kardio yugurish", type: "workout", detail: "45 daqiqa" },
];

const Index = () => {
  const { setBreadcrumbs } = useBreadcrumbStore();
  const { data: dashboardData, isLoading } = useGetQuery({
    url: "/admin/dashboard",
    queryProps: {
      queryKey: ["admin", "dashboard"],
    },
  });
  const dashboard = get(dashboardData, "data.data", {
    metrics: {},
    recentActivities: [],
    recentAuditLogs: [],
    systemHealth: [],
  });

  const { data: healthData, isLoading: isHealthLoading, isError: isHealthError } = useGetQuery({
    url: "/health",
    queryProps: {
      queryKey: ["system", "health"],
      refetchInterval: 30000,
    },
  });
  const health = get(healthData, "data", null);
  const navigate = useNavigate();

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/admin", title: "Admin" },
      { url: "/admin/dashboard", title: "Dashboard" },
    ]);
  }, [setBreadcrumbs]);

  const metrics = dashboard.metrics ?? {};
  const recentActivities = dashboard.recentActivities ?? [];
  const recentAuditLogs = dashboard.recentAuditLogs ?? [];
  const recentActivityPreview = recentActivities.slice(0, 4);
  const recentAuditLogsPreview = recentAuditLogs.slice(0, 4);
  const premiumStats = dashboard.premium?.stats ?? {};
  const premiumPlans = dashboard.premium?.plans ?? [];
  const premiumTrend = dashboard.premium?.trend ?? [];
  const premiumOverviewCards = [
    {
      title: "Faol premium",
      value: premiumStats.activeSubscribers ?? 0,
      icon: CrownIcon,
      description: "Pullik faol obunachilar",
    },
    {
      title: "MRR",
      value: formatUZS(premiumStats.mrr ?? 0),
      icon: TrendingUpIcon,
      description: "Normallashgan oylik daromad",
    },
    {
      title: "Oylik plan",
      value: premiumStats.monthlySubscribers ?? 0,
      icon: CalendarPlusIcon,
      description: "Faol oylik premiumlar",
    },
    {
      title: "Churn",
      value: `${premiumStats.churnRate ?? 0}%`,
      icon: ActivityIcon,
      description: "Tugagan va bekor qilingan ulush",
    },
  ];
  const quickHighlights = [
    {
      label: "Bugun qo'shilgan userlar",
      value: metrics.usersToday ?? 0,
    },
    {
      label: "Adminlar soni",
      value: metrics.totalAdmins ?? 0,
    },
    {
      label: "Faol tillar",
      value: metrics.totalLanguages ?? 0,
    },
  ];

  const pendingActions = [
    {
      label: "Coach tasdiqlash",
      count: get(metrics, "pendingCoaches", 0),
      icon: ShieldCheckIcon,
      path: "/admin/coaches",
      color: "text-yellow-600 dark:text-yellow-400",
      bg: "bg-yellow-500/10",
    },
    {
      label: "Hal qilinmagan hisobotlar",
      count: 0,
      icon: AlertTriangleIcon,
      path: "/admin/reports",
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-500/10",
    },
  ];

  const totalPendingCount = pendingActions.reduce(
    (sum, item) => sum + item.count,
    0,
  );

  const apiIsHealthy = !isHealthError && get(health, "status") === "ok";
  const systemStatusItems = [
    {
      label: "API",
      icon: ServerIcon,
      isHealthy: apiIsHealthy,
      healthyText: "Ishlayapti",
      errorText: "Ishlamayapti",
    },
    {
      label: "Ma'lumotlar bazasi",
      icon: DatabaseIcon,
      isHealthy: apiIsHealthy,
      healthyText: "Ulangan",
      errorText: "Ishlamayapti",
    },
    {
      label: "Saqlash",
      icon: HardDriveIcon,
      isHealthy: apiIsHealthy,
      healthyText: "Faol",
      errorText: "Ishlamayapti",
    },
  ];

  return (
    <PageTransition>
      <div className="flex flex-col gap-6">
        {/* Quick Actions Bar */}
        <Card className={cn(dashboardCardClassName, "py-4")}>
          <CardContent className="flex flex-wrap items-center gap-3">
            <div className="mr-2 flex items-center gap-2">
              <ZapIcon className="size-4 text-primary" />
              <span className="text-sm font-medium">Tezkor amallar</span>
            </div>
            {quickActionItems.map((action) => (
              <Button
                key={action.path}
                variant={action.variant}
                size="sm"
                onClick={() => navigate(action.path)}
                className="gap-2"
              >
                <action.icon className="size-4" data-icon="inline-start" />
                {action.label}
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Hero Card */}
        <Card
          className={cn(
            dashboardCardClassName,
            "border-primary/10 bg-gradient-to-br from-primary/5 via-background to-sky-500/5",
          )}
        >
          <CardContent className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="space-y-4">
              <div className="inline-flex w-fit items-center rounded-full border border-primary/15 bg-background/80 px-3 py-1 text-xs font-medium text-primary shadow-sm">
                Live admin snapshot
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight">
                  Admin Dashboard
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  Tizimning hozirgi holati, premium ko'rsatkichlari va oxirgi
                  admin actionlar bir joyda jamlangan.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {quickHighlights.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-border/60 bg-background/90 px-4 py-4 shadow-sm"
                >
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight">
                    {isLoading ? "..." : item.value}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Actions + System Status Row */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Pending Actions Card */}
          <Card className={cn(dashboardCardClassName, "flex flex-col")}>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock3Icon className="size-4" />
                  Kutilayotgan amallar
                </CardTitle>
                <CardDescription>
                  Admin e'tiborini talab qiluvchi elementlar
                </CardDescription>
              </div>
              {totalPendingCount > 0 && (
                <Badge variant="destructive" className="tabular-nums">
                  {totalPendingCount}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="flex-1 space-y-2.5">
              {pendingActions.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/20 px-3 py-3 transition-colors hover:bg-muted/40"
                >
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg",
                      item.bg,
                    )}
                  >
                    <item.icon className={cn("size-4", item.color)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{item.label}</p>
                  </div>
                  <Badge
                    variant={item.count > 0 ? "default" : "secondary"}
                    className="tabular-nums"
                  >
                    {isLoading ? "..." : item.count}
                  </Badge>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* System Status Card */}
          <Card className={cn(dashboardCardClassName, "flex flex-col")}>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CircleDotIcon className="size-4" />
                  Tizim holati
                </CardTitle>
                <CardDescription>
                  Tizim xizmatlari va infratuzilma holati
                </CardDescription>
              </div>
              {!isHealthLoading && (
                <Badge
                  variant={apiIsHealthy ? "default" : "destructive"}
                  className={cn(
                    apiIsHealthy &&
                      "border-emerald-200 bg-emerald-500/10 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400",
                  )}
                >
                  {apiIsHealthy ? "Barchasi ishlayapti" : "Muammo aniqlandi"}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="flex-1 space-y-2.5">
              {systemStatusItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/20 px-3 py-3"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                    <item.icon className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{item.label}</p>
                  </div>
                  {isHealthLoading ? (
                    <span className="text-xs text-muted-foreground">...</span>
                  ) : item.isHealthy ? (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2Icon className="size-3.5 text-emerald-500" />
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        {item.healthyText}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <XCircleIcon className="size-3.5 text-red-500" />
                      <span className="text-xs font-medium text-red-600 dark:text-red-400">
                        {item.errorText}
                      </span>
                    </div>
                  )}
                </div>
              ))}
              {!isHealthLoading && health && (
                <p className="pt-1 text-xs text-muted-foreground">
                  Versiya: {get(health, "version", "N/A")}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {overviewCardConfig.map((card) => (
            <Card key={card.key} className={dashboardCardClassName}>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div
                    className={`size-10 rounded-lg flex items-center justify-center ${card.bg}`}
                  >
                    <card.icon className={`size-5 ${card.color}`} />
                  </div>
                  <ArrowUpRightIcon className="size-4 text-muted-foreground/50" />
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-tight">
                    {isLoading ? "..." : metrics[card.key] ?? 0}
                  </p>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">
                    {card.title}
                  </p>
                </div>
                <p className="text-xs leading-5 text-muted-foreground/80">
                  {card.key === "totalUsers" &&
                    "Platformadagi barcha ro'yxatdan o'tgan foydalanuvchilar."}
                  {card.key === "totalCoaches" &&
                    "Ariza topshirgan yoki tasdiqlangan coachlar soni."}
                  {card.key === "pendingCoaches" &&
                    "Ko'rib chiqishni kutayotgan coach arizalari."}
                  {card.key === "totalFoods" &&
                    "Nutrition katalogidagi umumiy ovqat birliklari."}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Premium Overview */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {premiumOverviewCards.map((card) => (
            <Card key={card.title} className={dashboardCardClassName}>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/8">
                    <card.icon className="size-5 text-primary" />
                  </div>
                  <span className="rounded-full border border-primary/10 bg-primary/5 px-2.5 py-1 text-[11px] font-medium text-primary">
                    Premium
                  </span>
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-tight">
                    {isLoading ? "..." : card.value}
                  </p>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">
                    {card.title}
                  </p>
                </div>
                <p className="text-xs leading-5 text-muted-foreground/80">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Premium Plans */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {premiumPlans.map((plan) => (
            <Card key={plan.id} className={dashboardCardClassName}>
              <CardHeader className="gap-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{plan.name}</CardTitle>
                    <CardDescription>{plan.period}</CardDescription>
                  </div>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${planBadgeStyles[plan.id] ?? ""}`}
                  >
                    {plan.users} ta
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-2xl font-semibold tracking-tight">
                  {formatUZS(plan.price)}
                </p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {plan.features?.slice(0, 3).map((feature) => (
                    <div
                      key={feature}
                      className="rounded-xl border border-border/60 bg-muted/25 px-3 py-2"
                    >
                      {feature}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Premium Trend Chart */}
        <Card className={dashboardCardClassName}>
          <CardHeader className="flex flex-col gap-4 px-6 pb-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <CardTitle>Premium trendi</CardTitle>
              <CardDescription>
                So'nggi oylar bo'yicha tekin va premium foydalanuvchilar
              </CardDescription>
            </div>
            <div className="grid grid-cols-2 gap-3 md:min-w-72">
              <div className="rounded-2xl border border-border/60 bg-muted/25 p-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  Faol premium
                </p>
                <p className="mt-2 text-xl font-semibold">
                  {premiumStats.activeSubscribers ?? 0}
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/25 p-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  MRR
                </p>
                <p className="mt-2 text-xl font-semibold">
                  {formatUZS(premiumStats.mrr ?? 0)}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-0">
            <ChartContainer
              config={premiumTrendChartConfig}
              className="aspect-auto h-[300px] w-full"
            >
              <AreaChart
                data={premiumTrend}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="dashboardFreeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-free)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--color-free)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="dashboardPremiumGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-premium)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--color-premium)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} />
                <YAxis tickLine={false} axisLine={false} width={28} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Area
                  type="monotone"
                  dataKey="free"
                  stroke="var(--color-free)"
                  fill="url(#dashboardFreeGradient)"
                  strokeWidth={2}
                  name="Tekin"
                />
                <Area
                  type="monotone"
                  dataKey="premium"
                  stroke="var(--color-premium)"
                  fill="url(#dashboardPremiumGradient)"
                  strokeWidth={2}
                  name="Premium"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Top Content + Recent Activity + Audit Log Row */}
        <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
          {/* Top Content Widget */}
          <Card className={cn(dashboardCardClassName, "flex h-full flex-col")}>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <StarIcon className="size-4" />
                  Mashhur kontentlar
                </CardTitle>
                <CardDescription>
                  Eng ko'p ko'rilgan ovqat va mashqlar
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-1 max-h-[360px] space-y-2.5 overflow-y-auto pr-1">
              {sortBy(topContentPlaceholder, "name").map((item, index) => (
                <div
                  key={`${item.name}-${index}`}
                  className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/20 px-3 py-2.5"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                    <span className="text-xs font-bold text-muted-foreground">
                      {index + 1}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.detail}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    {item.type === "food" ? "Ovqat" : "Mashq"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className={cn(dashboardCardClassName, "flex h-full flex-col")}>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ActivityIcon className="size-4" />
                  So'nggi faoliyat
                </CardTitle>
                <CardDescription>
                  Yangi userlar va coach arizalaridagi o'zgarishlar
                </CardDescription>
              </div>
              <Link
                to="/admin/activity-feed"
                className="shrink-0 text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Barchasini ko'rish
              </Link>
            </CardHeader>
            <CardContent className="flex-1 max-h-[360px] space-y-3 overflow-y-auto pr-1">
              {recentActivityPreview.length > 0 ? (
                <div className="space-y-2.5">
                  {recentActivityPreview.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 rounded-2xl border border-border/60 bg-muted/20 px-3 py-2.5"
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                        {(activity.user ?? "?")
                          .split(" ")
                          .slice(0, 2)
                          .map((part) => part[0] ?? "")
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-sm leading-5">
                          <span className="font-medium">{activity.user}</span>{" "}
                          <span className="text-muted-foreground">
                            {activity.action}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getRelativeTimeLabel(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Faoliyat hozircha topilmadi.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Audit Log */}
          <Card className={cn(dashboardCardClassName, "flex h-full flex-col")}>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileClockIcon className="size-4" />
                  Audit log
                </CardTitle>
                <CardDescription>
                  Admin actionlarining oxirgi yozuvlari
                </CardDescription>
              </div>
              <Link
                to="/admin/audit-logs"
                className="shrink-0 text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Barchasini ko'rish
              </Link>
            </CardHeader>
            <CardContent className="flex-1 max-h-[360px] space-y-3 overflow-y-auto pr-1">
              {recentAuditLogsPreview.length > 0 ? (
                <div className="space-y-2.5">
                  {recentAuditLogsPreview.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-border/60 bg-muted/20 px-3 py-2.5"
                    >
                      <p className="text-sm font-medium leading-5">
                        {item.summary}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.adminUser} • {getRelativeTimeLabel(item.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Audit yozuvlari hozircha topilmadi.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
};

export default Index;
