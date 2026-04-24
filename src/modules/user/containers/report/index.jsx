import React from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  Clock3Icon,
  DropletsIcon,
  DumbbellIcon,
  HistoryIcon,
  LockIcon,
  RefreshCwIcon,
  SparklesIcon,
  TrendingUpIcon,
  UtensilsIcon,
} from "lucide-react";
import PageTransition from "@/components/page-transition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  getUserAiReportPeriodLabel,
  USER_AI_REPORT_PERIODS,
  useGenerateUserAiReport,
  useUserAiReport,
  useUserAiReportLimits,
  useUserAiReports,
} from "@/hooks/app/use-user-ai-reports";
import { useBreadcrumbStore } from "@/store";

const todayKey = () => new Date().toISOString().slice(0, 10);

const formatDate = (value) => {
  if (!value) return "—";

  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

const formatDateTime = (value) => {
  if (!value) return "—";

  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const resolveApiErrorMessage = (error, fallback) => {
  const message = error?.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(", ");
  }

  return message || fallback;
};

const sectionConfig = [
  ["nutrition", "Ovqatlanish", UtensilsIcon],
  ["hydration", "Suv", DropletsIcon],
  ["activity", "Faollik", DumbbellIcon],
  ["trends", "Trendlar", TrendingUpIcon],
  ["risks", "E'tibor", CheckCircle2Icon],
  ["recommendations", "Tavsiyalar", SparklesIcon],
  ["dataQuality", "Ma'lumot sifati", HistoryIcon],
];

const ReportSkeleton = () => (
  <div className="grid gap-3">
    <Skeleton className="h-28 w-full" />
    <div className="grid gap-3 md:grid-cols-2">
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  </div>
);

const SectionCard = ({ sectionKey, title, icon: Icon, section }) => {
  if (!section) return null;

  const bullets = Array.isArray(section.bullets) ? section.bullets : [];

  return (
    <Card size="sm" className="rounded-xl">
      <CardHeader className="px-4">
        <CardTitle className="flex items-center gap-2 text-sm">
          <span className="inline-flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Icon className="size-4" />
          </span>
          {section.title || title}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 px-4">
        {section.summary ? (
          <p className="text-sm leading-6 text-muted-foreground">
            {section.summary}
          </p>
        ) : null}
        {bullets.length ? (
          <ul className="grid gap-2 text-sm">
            {bullets.map((item, index) => (
              <li
                key={`${sectionKey}-${index}`}
                className="flex gap-2 leading-5 text-muted-foreground"
              >
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
};

const ReportDetail = ({ report, isLoading }) => {
  if (isLoading) {
    return <ReportSkeleton />;
  }

  if (!report) {
    return (
      <Card className="rounded-xl">
        <CardContent className="grid min-h-72 place-items-center px-6 py-12 text-center">
          <div className="max-w-md">
            <div className="mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <SparklesIcon className="size-5" />
            </div>
            <h2 className="text-lg font-semibold">Hali report yo'q</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Davrni tanlab AI report yarating. Report saqlanadi va keyin history
              ro'yxatidan ochiladi.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const body = report.report ?? {};
  const summary = body.summary;
  const nextActions = Array.isArray(body.nextActions) ? body.nextActions : [];

  return (
    <div className="grid gap-4">
      <Card className="rounded-xl">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <CardDescription>
                {getUserAiReportPeriodLabel(report.period)} ·{" "}
                {formatDate(report.startDate)} - {formatDate(report.endDate)}
              </CardDescription>
              <CardTitle className="mt-1 text-xl">
                {summary?.title || "AI Health Report"}
              </CardTitle>
            </div>
            <Badge variant={report.status === "success" ? "secondary" : "outline"}>
              {report.status || "success"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          {summary?.summary ? (
            <p className="text-sm leading-6 text-muted-foreground">
              {summary.summary}
            </p>
          ) : null}
          {Array.isArray(summary?.bullets) && summary.bullets.length ? (
            <div className="grid gap-2">
              {summary.bullets.map((item, index) => (
                <div key={index} className="flex gap-2 text-sm text-muted-foreground">
                  <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">
              <CalendarDaysIcon data-icon="inline-start" />
              {formatDateTime(report.createdAt)}
            </Badge>
            {report.model ? <Badge variant="outline">{report.model}</Badge> : null}
            {report.generationMs ? (
              <Badge variant="outline">{Math.round(report.generationMs / 1000)}s</Badge>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {sectionConfig.map(([key, label, Icon]) => (
          <SectionCard
            key={key}
            sectionKey={key}
            title={label}
            icon={Icon}
            section={body[key]}
          />
        ))}
      </div>

      {nextActions.length ? (
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SparklesIcon className="size-4 text-primary" />
              Keyingi harakatlar
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {nextActions.map((item, index) => (
              <div key={index} className="flex gap-2 text-sm">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {index + 1}
                </span>
                <span className="leading-6 text-muted-foreground">{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {body.disclaimer ? (
        <p className="text-xs leading-5 text-muted-foreground">{body.disclaimer}</p>
      ) : null}
    </div>
  );
};

const HistoryList = ({ items, activeId, onSelect, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HistoryIcon className="size-4" />
          History
        </CardTitle>
        <CardDescription>Oldin yaratilgan reportlar</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        {items.length ? (
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              className={cn(
                "grid w-full gap-1 rounded-xl border p-3 text-left transition-colors hover:bg-muted/60",
                activeId === item.id
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background",
              )}
              onClick={() => onSelect(item.id)}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">
                  {getUserAiReportPeriodLabel(item.period)}
                </span>
                <ChevronRightIcon className="size-4 text-muted-foreground" />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{formatDateTime(item.createdAt)}</span>
                <span>·</span>
                <span>{item.model || "AI"}</span>
                <span>·</span>
                <span>{item.status}</span>
              </div>
            </button>
          ))
        ) : (
          <div className="rounded-xl border border-dashed p-5 text-sm leading-6 text-muted-foreground">
            History bo'sh. Birinchi reportni generate qiling.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const Index = () => {
  const navigate = useNavigate();
  const setBreadcrumbs = useBreadcrumbStore((state) => state.setBreadcrumbs);
  const [selectedPeriod, setSelectedPeriod] = React.useState("weekly");
  const [activeReportId, setActiveReportId] = React.useState(null);
  const { data: limits, isLoading: limitsLoading } = useUserAiReportLimits();
  const {
    data: history,
    isLoading: historyLoading,
  } = useUserAiReports({
    page: 1,
    pageSize: 12,
  });
  const generateMutation = useGenerateUserAiReport();
  const historyItems = history?.items ?? [];
  const { data: activeReport, isLoading: activeReportLoading } =
    useUserAiReport(activeReportId, {
      enabled: Boolean(activeReportId),
    });

  React.useEffect(() => {
    setBreadcrumbs([
      {
        label: "Dashboard",
        href: "/user/dashboard",
      },
      {
        label: "Report",
      },
    ]);

    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  React.useEffect(() => {
    if (!activeReportId && historyItems.length) {
      setActiveReportId(historyItems[0].id);
    }
  }, [activeReportId, historyItems]);

  const periodAccess = React.useMemo(() => {
    const map = new Map();
    for (const period of limits?.periods ?? []) {
      map.set(period.period, period);
    }
    return map;
  }, [limits?.periods]);

  const selectedAccess = periodAccess.get(selectedPeriod);
  const isSelectedLocked = Boolean(selectedAccess?.locked);
  const quota = limits?.quota ?? {};
  const selectedHasTodayCache = historyItems.some(
    (item) =>
      item.period === selectedPeriod && String(item.createdAt || "").startsWith(todayKey()),
  );
  const noQuota = !selectedHasTodayCache && Number(quota.remaining ?? 0) <= 0;
  const isGenerateDisabled =
    limitsLoading ||
    generateMutation.isPending ||
    isSelectedLocked ||
    noQuota;

  const handleGenerate = async () => {
    try {
      const result = await generateMutation.mutateAsync(selectedPeriod);
      setActiveReportId(result.id);
      toast.success(result.cached ? "Bugungi report ochildi" : "AI report yaratildi");
    } catch (error) {
      toast.error(resolveApiErrorMessage(error, "AI report yaratib bo'lmadi"));
    }
  };

  return (
    <PageTransition>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 shrink-0"
              onClick={() => navigate(-1)}
              aria-label="Orqaga"
            >
              <ArrowLeftIcon className="size-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold">AI Health Report</h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                Ovqatlanish, suv, qadam, mashg'ulot, uyqu, kayfiyat va
                o'lchamlaringiz asosida saqlanadigan tahlil.
              </p>
            </div>
          </div>
        </div>

        <Card className="rounded-xl">
          <CardContent className="grid gap-4 p-4 md:grid-cols-[1fr_auto] md:items-center">
            <div className="grid gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={limits?.isPremium ? "default" : "secondary"}>
                  {limits?.isPremium ? "Premium" : "Free"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Oylik limit: {quota.used ?? 0}/{quota.monthly ?? 0} ishlatildi,
                  {` ${quota.remaining ?? 0}`} qoldi
                </span>
              </div>
              {noQuota ? (
                <p className="text-sm text-destructive">
                  Bu oy uchun yangi AI report limiti tugagan. Bugungi cached
                  report mavjud bo'lsa ochish mumkin.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Bir kunda bir xil davr qayta generatsiya qilinsa, cached report
                  qaytadi va limit kamaymaydi.
                </p>
              )}
            </div>
            {!limits?.isPremium ? (
              <Button asChild variant="outline">
                <Link to="/user/payments">
                  <LockIcon data-icon="inline-start" />
                  Premiumga o'tish
                </Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Davrni tanlang</CardTitle>
            <CardDescription>
              Free tarifda haftalik va oylik reportlar ochiq.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {USER_AI_REPORT_PERIODS.map((item) => {
                const access = periodAccess.get(item.period);
                const locked = Boolean(access?.locked);
                const selected = selectedPeriod === item.period;

                return (
                  <button
                    key={item.period}
                    type="button"
                    disabled={locked}
                    className={cn(
                      "flex min-h-20 flex-col justify-between rounded-xl border p-3 text-left transition-colors",
                      selected
                        ? "border-primary bg-primary/5"
                        : "border-border bg-background hover:bg-muted/60",
                      locked && "cursor-not-allowed opacity-55 hover:bg-background",
                    )}
                    onClick={() => setSelectedPeriod(item.period)}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{item.label}</span>
                      {locked ? (
                        <LockIcon className="size-4 text-muted-foreground" />
                      ) : null}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {item.shortLabel}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock3Icon className="size-4" />
                {selectedHasTodayCache
                  ? "Bu davr uchun bugungi cached report bor."
                  : "Yangi report limitdan foydalanadi."}
              </div>
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerateDisabled}
              >
                {generateMutation.isPending ? (
                  <RefreshCwIcon data-icon="inline-start" className="animate-spin" />
                ) : (
                  <SparklesIcon data-icon="inline-start" />
                )}
                {selectedHasTodayCache ? "Bugungi reportni ochish" : "Generate"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <ReportDetail
            report={activeReport}
            isLoading={Boolean(activeReportId && activeReportLoading)}
          />
          <div className="grid content-start gap-5">
            <HistoryList
              items={historyItems}
              activeId={activeReportId}
              onSelect={setActiveReportId}
              isLoading={historyLoading}
            />
            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle className="text-base">Limit qoidasi</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm leading-6 text-muted-foreground">
                <p>Free: haftalik/oylik, oyiga 2 ta yangi report.</p>
                <Separator />
                <p>Premium: barcha davrlar, oyiga 20 ta yangi report.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Index;
