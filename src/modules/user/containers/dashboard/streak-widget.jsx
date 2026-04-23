import React from "react";
import { get } from "lodash";
import { FlameIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import useGetQuery from "@/hooks/api/use-get-query";
import {
  DASHBOARD_ME_QUERY_KEY,
  getUserFromResponse,
} from "./query-helpers.js";

const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];

const StreakWidget = ({ streak, longestStreak, trackedDays }) => {
  const shouldFetch =
    streak === undefined ||
    longestStreak === undefined ||
    trackedDays === undefined;
  const { data } = useGetQuery({
    url: "/users/me",
    queryProps: {
      queryKey: DASHBOARD_ME_QUERY_KEY,
      enabled: shouldFetch,
    },
  });
  const user = React.useMemo(() => getUserFromResponse(data), [data]);
  const resolvedStreak = streak ?? get(user, "currentStreak", 0);
  const resolvedLongestStreak =
    longestStreak ?? get(user, "longestStreak", resolvedStreak);
  const resolvedTrackedDays = trackedDays ?? get(user, "trackedDays", 0);
  const nextMilestone =
    STREAK_MILESTONES.find((m) => m > resolvedStreak) || resolvedStreak + 10;
  const progressToNext =
    nextMilestone > 0
      ? Math.min(100, Math.round((resolvedStreak / nextMilestone) * 100))
      : 0;

  return (
    <div className="group relative h-full overflow-hidden rounded-[28px] border border-orange-500/15 bg-gradient-to-br from-orange-500/[0.08] via-card to-card px-5 py-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-orange-500/30 hover:shadow-xl hover:shadow-orange-500/5">
      <div className="absolute inset-x-8 top-0 h-24 rounded-full bg-orange-500/8 blur-3xl transition-opacity group-hover:opacity-90" />
      <div className="relative flex h-full flex-col">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-600/70">
              Streak
            </p>
            <h3 className="mt-1 inline-flex items-center gap-2 text-lg font-black tracking-tight">
              <FlameIcon className="size-4 text-orange-500" />
              Kundalik streak
            </h3>
          </div>
          <div
            className={cn(
              "flex size-14 flex-col items-center justify-center rounded-2xl font-black",
              resolvedStreak > 0
                ? "bg-orange-500/10 text-orange-600"
                : "bg-muted text-muted-foreground",
            )}
          >
            <span className="text-2xl leading-none">{resolvedStreak}</span>
            <span className="text-[9px] font-semibold uppercase tracking-wider">kun</span>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Keyingi nishon: {nextMilestone} kun</span>
            <span className="font-semibold text-orange-600">{progressToNext}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-orange-500/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-500"
              style={{ width: `${progressToNext}%` }}
            />
          </div>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-3 pt-4">
          <div className="rounded-2xl border border-border/60 bg-muted/20 px-3 py-2 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Eng uzun
            </p>
            <p className="mt-0.5 text-lg font-bold">
              {resolvedLongestStreak}{" "}
              <span className="text-xs font-medium text-muted-foreground">kun</span>
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-muted/20 px-3 py-2 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Jami
            </p>
            <p className="mt-0.5 text-lg font-bold">
              {resolvedTrackedDays}{" "}
              <span className="text-xs font-medium text-muted-foreground">kun</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreakWidget;
