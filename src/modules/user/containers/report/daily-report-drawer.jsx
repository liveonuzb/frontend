import React from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { CheckCircle2Icon, AlertTriangleIcon } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetQuery } from "@/hooks/api";
import { getApiResponseData } from "@/lib/api-response";
import MetricCard from "./components/metric-card.jsx";
import ScoreCircle from "./components/score-circle.jsx";
import {
  dailyReportQueryKey,
  formatLongDate,
  getYesterdayKey,
  METRIC_META,
} from "./report-helpers.js";

import map from "lodash/map";

const isDateKey = (value) =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);

const resolveDailyMetrics = (report) => report?.metrics ?? null;

const progressPctFor = (metricKey, metric) => {
  if (!metric) return 0;
  if (metricKey === "fastFood") {
    const count = metric.count ?? 0;
    if (count <= 0) return 100;
    if (count === 1) return 40;
    return 10;
  }
  const goal = metric.goal ?? 0;
  if (!goal || goal <= 0) return 0;
  const actual = metric.actual ?? 0;
  return Math.min(100, Math.max(0, Math.round((actual / goal) * 100)));
};

const StatusBadge = ({ status }) => {
  const config =
    status === "good"
      ? {
          icon: <CheckCircle2Icon className="size-4 text-emerald-600" />,
          text: "Yaxshi kun",
          cls: "bg-emerald-500/10 text-emerald-700",
        }
      : status === "average"
        ? {
            icon: <AlertTriangleIcon className="size-4 text-amber-600" />,
            text: "O'rtacha kun",
            cls: "bg-amber-500/10 text-amber-700",
          }
        : {
            icon: <AlertTriangleIcon className="size-4 text-red-600" />,
            text: "Yaxshilash kerak",
            cls: "bg-red-500/10 text-red-700",
          };

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${config.cls}`}
    >
      {config.icon}
      <span>{config.text}</span>
    </div>
  );
};

export default function DailyReportDrawer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { date: dateParam } = useParams();
  const [open, setOpen] = React.useState(true);

  const dateKey = React.useMemo(() => {
    if (isDateKey(dateParam)) return dateParam;
    return getYesterdayKey();
  }, [dateParam]);

  const close = React.useCallback(() => {
    setOpen(false);
    navigate(`/user/dashboard${location.search}`, { replace: true });
  }, [navigate, location.search]);

  const { data: response, isLoading } = useGetQuery({
    url: `/user/tracking/reports/daily?date=${dateKey}`,
    queryProps: {
      queryKey: dailyReportQueryKey(dateKey),
    },
  });

  const report = getApiResponseData(response, null);
  const metrics = resolveDailyMetrics(report);
  const hasData = Boolean(report?.hasData);

  const trackedKeys = ["water", "calories", "protein", "carbs", "fat", "fastFood"];

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => (next ? setOpen(true) : close())}
      direction="bottom"
    >
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm" data-daily-report-drawer="true">
        <DrawerHeader className="text-left">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-muted-foreground">
              {formatLongDate(dateKey)}
            </div>
          </div>
          <DrawerTitle className="mt-3 text-2xl font-black">
            Kunlik natija
          </DrawerTitle>
          <DrawerDescription>
            Kechagi ko'rsatkichlaringiz maqsadlar bilan solishtirildi.
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody className="space-y-4 pb-2">
          <div className="rounded-3xl border bg-card p-4 shadow-sm">
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-52" />
                  <Skeleton className="h-4 w-80" />
                </div>
                <Skeleton className="size-32 rounded-full" />
              </div>
            ) : hasData ? (
              <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
                <div className="min-w-0">
                  <StatusBadge status={report?.status} />
                  <h2 className="mt-3 text-lg font-black leading-tight">
                    {report?.summary || "Natija tayyor"}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Bugungi odatlaringizga kichik tuzatishlar kiritsangiz,
                    natijalar tezroq seziladi.
                  </p>
                </div>
                <ScoreCircle score={report?.score ?? 0} label="Ball" />
              </div>
            ) : (
              <div className="grid gap-2">
                <h2 className="text-lg font-black">Bu kun uchun log yo'q</h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Bu kunda ovqat/suv/faollik qayd etilmagan. Bugundan boshlab
                  trackingni boshlang.
                </p>
                <div className="pt-2">
                  <Button type="button" className="h-11 rounded-full" onClick={close}>
                    Yopish
                  </Button>
                </div>
              </div>
            )}
          </div>

          {hasData ? (
            <div className="grid gap-3">
              {map(trackedKeys, (key) => {
                const meta = METRIC_META[key];
                if (!meta) return null;
                const item = key === "fastFood" ? metrics?.fastFood : metrics?.[key];
                const actualValue =
                  key === "fastFood" ? item?.count ?? 0 : item?.actual ?? 0;
                const goalValue = key === "fastFood" ? null : item?.goal ?? null;
                const goalHint =
                  key === "fastFood"
                    ? "Fast food"
                    : goalValue != null
                      ? `Maqsad: ${meta.formatGoal(goalValue)}`
                      : null;

                return (
                  <MetricCard
                    key={key}
                    icon={
                      meta.icon ? (
                        <meta.icon className={`size-5 ${meta.color}`} />
                      ) : null
                    }
                    label={meta.label}
                    goalHint={goalHint}
                    actualText={meta.formatActual(actualValue)}
                    status={item?.status}
                    statusLabel={item?.label}
                    delta={item?.delta}
                    progressPct={progressPctFor(key, item)}
                  />
                );
              })}
            </div>
          ) : null}
        </DrawerBody>

        {hasData ? (
          <DrawerFooter>
            <Button
              type="button"
              className="h-11 rounded-full"
              onClick={() => navigate("/user/report/range/10")}
            >
              10 kunlik tahlil
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-11 rounded-full"
              onClick={close}
            >
              Yopish
            </Button>
          </DrawerFooter>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
