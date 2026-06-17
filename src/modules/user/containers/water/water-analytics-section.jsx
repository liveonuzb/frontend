import React from "react";
import get from "lodash/get";
import map from "lodash/map";
import isArray from "lodash/isArray";
import toNumber from "lodash/toNumber";
import { BarChart3Icon, DropletIcon, CheckCircleIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useGetQuery } from "@/hooks/api";
import {
  NUTRITION_TRACKING_API_ROOT,
  nutritionApiPath,
} from "@/hooks/app/nutrition-api-paths";

const EMPTY_ANALYTICS_SUMMARY = {
  averageMl: 0,
  daysTracked: 0,
  daysGoalMet: 0,
  completionRate: 0,
};

export default function WaterAnalyticsSection({ days = 7 }) {
  const { data, isLoading } = useGetQuery({
    url: nutritionApiPath(NUTRITION_TRACKING_API_ROOT, "water/analytics"),
    params: { days },
    queryProps: {
      queryKey: ["water", "analytics", days],
    },
  });

  const analytics = get(data, "data.data") ?? get(data, "data") ?? null;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-5 sm:p-6">
          <Skeleton className="mb-4 h-5 w-32 rounded-lg" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {map([0, 1, 2, 3], (i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) return null;

  const summary = {
    ...EMPTY_ANALYTICS_SUMMARY,
    ...(get(analytics, "summary", {}) || {}),
  };
  const daily = isArray(analytics?.daily) ? analytics.daily : [];
  const goalMl = Math.max(toNumber(analytics?.goalMl) || 0, 1);

  return (
    <Card>
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <BarChart3Icon className="size-4 text-blue-500" aria-hidden="true" />
          <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-muted-foreground">
            {days} Kunlik Tahlil
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatBox
            label="O'rtacha"
            value={`${Math.round(toNumber(summary.averageMl || 0) / 100) / 10} L`}
            hint="kunlik"
          />
          <StatBox label="Kuzatildi" value={summary.daysTracked} hint="kun" />
          <StatBox
            label="Maqsad bajarildi"
            value={summary.daysGoalMet}
            hint="kun"
          />
          <StatBox
            label="Bajarilish"
            value={`${summary.completionRate}%`}
            hint="darajasi"
          />
        </div>

        {daily.length > 0 ? (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Kunlik ko&apos;rsatkich
            </p>
            <div className="space-y-1.5">
              {map(daily, (day, index) => {
                const totalMl = toNumber(day?.totalMl) || 0;
                const dayKey =
                  typeof day?.date === "string" && day.date
                    ? day.date
                    : `water-day-${index}`;
                const pct = Math.min(Math.round((totalMl / goalMl) * 100), 100);
                return (
                  <div key={dayKey} className="flex items-center gap-3">
                    <p className="w-24 shrink-0 text-xs text-muted-foreground">
                      {typeof day?.date === "string" ? day.date.slice(5) : "—"}
                    </p>
                    <div className="relative flex-1 h-5 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          day?.goalMet ? "bg-blue-500" : "bg-blue-500/40",
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex w-16 shrink-0 items-center justify-end gap-1">
                      <span className="text-xs font-semibold">
                        {Math.round(totalMl / 100) / 10}L
                      </span>
                      {day?.goalMet ? (
                        <CheckCircleIcon className="size-3 text-blue-500" />
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-2xl border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
            <DropletIcon className="size-4" />
            <span>Hali ma&apos;lumot yetarli emas.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatBox({ label, value, hint }) {
  return (
    <Card size="sm">
      <CardContent className="p-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-1.5 text-lg font-black">{value}</p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
