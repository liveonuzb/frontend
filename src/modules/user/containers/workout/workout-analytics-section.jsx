import React from "react";
import { useTranslation } from "react-i18next";
import map from "lodash/map";
import { Badge } from "@/components/ui/badge";
import { Clock3Icon, TrophyIcon } from "lucide-react";
import { getUserSurfaceClassName } from "@/modules/user/lib/card-styles";

const formatDuration = (minutes, t) => {
  if (!minutes) return t("user.workout.analytics.durationMinutes", { count: 0 });
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) {
    return t("user.workout.analytics.durationHoursMinutes", {
      hours: h,
      minutes: m,
    });
  }
  if (h > 0) return t("user.workout.analytics.durationHours", { count: h });
  return t("user.workout.analytics.durationMinutes", { count: m });
};

const formatCompactWorkoutDate = (value) => {
  if (!value) return "\u2014";
  const d = new Date(value + "T00:00:00");
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("uz-UZ", {
    day: "2-digit",
    month: "short",
    weekday: "short",
  });
};

export default function WorkoutAnalyticsSection({
  weeklyStats,
  personalRecordCount,
  recentWorkoutDays,
  topPersonalRecords,
}) {
  const { t } = useTranslation();

  return (
    <section className={getUserSurfaceClassName("p-5 sm:p-6")}>
      <div className="space-y-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {t("user.workout.analytics.eyebrow")}
          </p>
          <h2 className="mt-2 text-xl font-black tracking-tight">
            {t("user.workout.analytics.title")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("user.workout.analytics.subtitle")}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div
            className={getUserSurfaceClassName(
              "border border-border/50 bg-muted/30 p-4",
            )}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {t("user.workout.analytics.sevenDays")}
            </p>
            <p className="mt-2 text-xl font-black">{weeklyStats.count}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("user.workout.analytics.workoutDays")}
            </p>
          </div>
          <div
            className={getUserSurfaceClassName(
              "border border-border/50 bg-muted/30 p-4",
            )}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {t("user.workout.analytics.volume")}
            </p>
            <p className="mt-2 text-xl font-black">
              {formatDuration(weeklyStats.duration, t)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("user.workout.analytics.totalTime")}
            </p>
          </div>
          <div
            className={getUserSurfaceClassName(
              "border border-border/50 bg-muted/30 p-4",
            )}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              PR
            </p>
            <p className="mt-2 text-xl font-black">{personalRecordCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("user.workout.analytics.savedRecord")}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock3Icon className="size-4 text-primary" aria-hidden="true" />
            <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-muted-foreground">
              {t("user.workout.analytics.recentSessions")}
            </h3>
          </div>

          {recentWorkoutDays.length > 0 ? (
            <div className="space-y-2">
              {map(recentWorkoutDays, (day) => (
                <div
                  key={day.date}
                  className={getUserSurfaceClassName(
                    "flex items-center justify-between border border-border/50 bg-card px-4 py-3",
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {formatCompactWorkoutDate(day.date)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {day.logCount} log &bull; {day.calories} kcal
                    </p>
                  </div>
                  <Badge variant="outline">{formatDuration(day.duration, t)}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div
              className={getUserSurfaceClassName(
                "border border-dashed border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground",
              )}
            >
              {t("user.workout.analytics.noSessions")}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrophyIcon className="size-4 text-primary" aria-hidden="true" />
            <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-muted-foreground">
              {t("user.workout.analytics.topResults")}
            </h3>
          </div>

          {topPersonalRecords.length > 0 ? (
            <div className="space-y-2">
              {map(topPersonalRecords, (record) => (
                <div
                  key={`${record.exerciseName}-${record.date}`}
                  className={getUserSurfaceClassName(
                    "border border-border/50 bg-card px-4 py-3",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {record.exerciseName}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatCompactWorkoutDate(record.date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{record.weight} kg</p>
                      <p className="text-xs text-muted-foreground">
                        {record.reps} reps
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              className={getUserSurfaceClassName(
                "border border-dashed border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground",
              )}
            >
              {t("user.workout.analytics.noPr")}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
