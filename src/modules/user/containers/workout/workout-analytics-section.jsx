import React from "react";
import { map } from "lodash";
import { Badge } from "@/components/ui/badge";
import { Clock3Icon, TrophyIcon } from "lucide-react";

const formatDuration = (minutes) => {
  if (!minutes) return "0 daq";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h} soat ${m} daq`;
  if (h > 0) return `${h} soat`;
  return `${m} daq`;
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
  return (
    <section className="rounded-[28px] border bg-card p-5 shadow-sm sm:p-6">
      <div className="space-y-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Tahlil
          </p>
          <h2 className="mt-2 text-xl font-black tracking-tight">
            So&apos;nggi faollik va rekordlar
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Oxirgi mashg&apos;ulot kunlari va kuchli natijalaringiz bir joyda.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[22px] border border-border/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              7 kun
            </p>
            <p className="mt-2 text-xl font-black">{weeklyStats.count}</p>
            <p className="mt-1 text-xs text-muted-foreground">mashq kuni</p>
          </div>
          <div className="rounded-[22px] border border-border/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Hajm
            </p>
            <p className="mt-2 text-xl font-black">
              {formatDuration(weeklyStats.duration)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">jami vaqt</p>
          </div>
          <div className="rounded-[22px] border border-border/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              PR
            </p>
            <p className="mt-2 text-xl font-black">{personalRecordCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              saqlangan rekord
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock3Icon className="size-4 text-primary" aria-hidden="true" />
            <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Oxirgi Sessiyalar
            </h3>
          </div>

          {recentWorkoutDays.length > 0 ? (
            <div className="space-y-2">
              {map(recentWorkoutDays, (day) => (
                <div
                  key={day.date}
                  className="flex items-center justify-between rounded-[18px] border border-border/60 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {formatCompactWorkoutDate(day.date)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {day.logCount} log &bull; {day.calories} kcal
                    </p>
                  </div>
                  <Badge variant="outline">{formatDuration(day.duration)}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[22px] border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
              Hali workout tarixidan yig&apos;ilgan sessiyalar yo&apos;q.
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrophyIcon className="size-4 text-primary" aria-hidden="true" />
            <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Kuchli Natijalar
            </h3>
          </div>

          {topPersonalRecords.length > 0 ? (
            <div className="space-y-2">
              {map(topPersonalRecords, (record) => (
                <div
                  key={`${record.exerciseName}-${record.date}`}
                  className="rounded-[18px] border border-border/60 px-4 py-3"
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
            <div className="rounded-[22px] border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
              Hali set loglardan PR shakllanmagan.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
