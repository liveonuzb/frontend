import React from "react";
import { map, entries, get } from "lodash";
import { TrendingUpIcon, TrendingDownIcon, MinusIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetQuery } from "@/hooks/api";
import { getApiResponseData } from "@/lib/api-response";

const METRIC_LABELS = {
  weight: { label: "Vazn", unit: "kg" },
  chest: { label: "Ko'krak", unit: "cm" },
  waist: { label: "Bel", unit: "cm" },
  hips: { label: "Tos", unit: "cm" },
  arm: { label: "Qo'l", unit: "cm" },
  thigh: { label: "Son", unit: "cm" },
  neck: { label: "Bo'yin", unit: "cm" },
  bodyFat: { label: "Yog'", unit: "%" },
};

const formatChange = (change, unit) => {
  if (change === 0) return `0 ${unit}`;
  const sign = change > 0 ? "+" : "";
  return `${sign}${change.toFixed(1)} ${unit}`;
};

export default function MeasurementTrendsSection({ days = 90 }) {
  const { data, isLoading } = useGetQuery({
    url: "/measurements/trends",
    params: { days },
    queryProps: {
      queryKey: ["measurements", "trends", days],
    },
  });

  const payload = getApiResponseData(data, null);
  const trends = payload?.trends;
  const period = payload?.period;

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-40 rounded-lg" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 rounded-[18px]" />
          ))}
        </div>
      </div>
    );
  }

  if (!trends) return null;

  const activeTrends = entries(trends).filter(
    ([, v]) => v && v.last !== null,
  );

  if (activeTrends.length === 0) return null;

  return (
    <section className="rounded-[28px] border bg-card p-5 shadow-sm sm:p-6">
      <div className="space-y-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Trendlar
          </p>
          <h2 className="mt-1 text-lg font-black tracking-tight">
            O&apos;zgarishlar ({days} kun)
          </h2>
          {period ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {period.startDate} — {period.endDate}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {map(activeTrends, ([key, metric]) => {
            const meta = get(METRIC_LABELS, key, { label: key, unit: "" });
            const change = metric.change ?? 0;
            const isPositive = change > 0;
            const isNegative = change < 0;

            return (
              <div
                key={key}
                className="rounded-[18px] border border-border/60 p-3"
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {meta.label}
                </p>
                <p className="mt-1.5 text-base font-black">
                  {metric.last} {meta.unit}
                </p>
                <div
                  className={
                    isPositive
                      ? "mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-500"
                      : isNegative
                        ? "mt-1 flex items-center gap-1 text-[11px] font-semibold text-red-500"
                        : "mt-1 flex items-center gap-1 text-[11px] font-semibold text-muted-foreground"
                  }
                >
                  {isPositive ? (
                    <TrendingUpIcon className="size-3" />
                  ) : isNegative ? (
                    <TrendingDownIcon className="size-3" />
                  ) : (
                    <MinusIcon className="size-3" />
                  )}
                  <span>{formatChange(change, meta.unit)}</span>
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {metric.min} — {metric.max} {meta.unit}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
