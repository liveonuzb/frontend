import React from "react";
import { find, get, isArray, toNumber } from "lodash";
import { Link } from "react-router";
import { ArrowRightIcon, DumbbellIcon, RouteIcon } from "lucide-react";
import { useGetQuery } from "@/hooks/api";
import { useRunningStatsSummary } from "@/hooks/app/use-running-sessions";
import { getApiResponseData } from "@/lib/api-response";
import { formatRunningDistance } from "@/lib/running-metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { deriveWorkoutPlanMetrics } from "../workout/utils";
import { DASHBOARD_WORKOUT_PLANS_QUERY_KEY } from "./query-helpers.js";

export default function WorkoutWidget({
  activePlan: activePlanOverride,
  interactive = true,
  className,
  labels = {},
}) {
  const resolvedLabels = {
    title: labels.title ?? "Mashg'ulot",
    sessions: labels.sessions ?? "sessiya",
    continue: labels.continue ?? "Davom etish",
    empty: labels.empty ?? "Reja yo'q",
    start: labels.start ?? "Boshlash",
  };
  const shouldFetch = activePlanOverride === undefined;
  const { data } = useGetQuery({
    url: "/user/workout/plans",
    queryProps: {
      queryKey: DASHBOARD_WORKOUT_PLANS_QUERY_KEY,
      enabled: shouldFetch,
    },
  });
  const { stats: runningStats = {} } = useRunningStatsSummary();
  const payload = React.useMemo(() => getApiResponseData(data, {}), [data]);
  const plans = React.useMemo(
    () => (isArray(get(payload, "items")) ? get(payload, "items") : []),
    [payload],
  );
  const activePlan = React.useMemo(() => {
    if (activePlanOverride !== undefined) {
      return activePlanOverride;
    }

    const activePlanId = get(payload, "activePlanId", null);
    return deriveWorkoutPlanMetrics(
      find(plans, (plan) => get(plan, "id") === activePlanId) || null,
    );
  }, [activePlanOverride, payload, plans]);
  const hasRunningStats =
    toNumber(get(runningStats, "totalRuns", 0)) > 0 ||
    toNumber(get(runningStats, "totalDistanceMeters", 0)) > 0;
  const runningSummary = hasRunningStats ? (
    interactive ? (
      <Link
        to="/user/workout/running"
        className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/60 px-3 py-2 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        <span className="inline-flex min-w-0 items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <RouteIcon className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-bold leading-tight">
              Running
            </span>
            <span className="block text-[10px] text-muted-foreground">
              {toNumber(get(runningStats, "totalRuns", 0))} runs
            </span>
          </span>
        </span>
        <span className="shrink-0 text-xs font-black">
          {formatRunningDistance(get(runningStats, "totalDistanceMeters", 0))}
        </span>
      </Link>
    ) : (
      <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/60 px-3 py-2 text-left">
        <span className="inline-flex min-w-0 items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <RouteIcon className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-bold leading-tight">
              Running
            </span>
            <span className="block text-[10px] text-muted-foreground">
              {toNumber(get(runningStats, "totalRuns", 0))} runs
            </span>
          </span>
        </span>
        <span className="shrink-0 text-xs font-black">
          {formatRunningDistance(get(runningStats, "totalDistanceMeters", 0))}
        </span>
      </div>
    )
  ) : null;

  return (
    <Card
      className={cn(
        "relative h-full overflow-hidden border border-border/60 py-3 ring-0 transition-colors hover:border-primary/30",
        className,
      )}
    >
      <div className="absolute -right-4 -top-4 size-20 rounded-full bg-primary/10 blur-[24px]" />
      <CardHeader className="relative z-10 px-4 pb-1.5 pt-3">
        <CardTitle className="flex min-w-0 items-center gap-1.5 text-xs font-bold">
          <span className="rounded bg-primary/10 p-1">
            <DumbbellIcon className="size-3 text-primary" />
          </span>
          <span className="truncate">{resolvedLabels.title}</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="relative z-10 flex flex-1 flex-col justify-center gap-3 px-4 pb-3">
        {activePlan ? (
          <div className="flex flex-col gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{activePlan.name}</p>
              <p className="mt-1 text-[10px] font-medium text-muted-foreground">
                {activePlan.completedWorkouts ?? 0} / {activePlan.days ?? 0}{" "}
                {resolvedLabels.sessions}
              </p>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/60 p-2.5">
              <div className="mb-1.5 flex items-center justify-between gap-3 text-[10px] font-semibold text-muted-foreground">
                <span>Reja progressi</span>
                <span>{activePlan.progress ?? 0}%</span>
              </div>
              <Progress
                value={activePlan.progress ?? 0}
                className="h-2 bg-primary/15"
              />
            </div>

            {interactive ? (
              <Link
                to="/user/workout"
                className="inline-flex h-8 self-start items-center rounded-full bg-primary/10 px-3 text-xs font-bold text-primary transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                {resolvedLabels.continue}{" "}
                <ArrowRightIcon className="ml-1 size-3" />
              </Link>
            ) : null}
            {runningSummary}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <DumbbellIcon className="size-5" />
            </span>
            <div>
              <p className="text-sm font-bold">{resolvedLabels.empty}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Mashg'ulot rejasini tanlang yoki yugurishni boshlang.
              </p>
            </div>
            {interactive ? (
              <Link
                to="/user/workout"
                className="inline-flex h-8 items-center rounded-full bg-primary/10 px-3 text-xs font-bold text-primary transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                {resolvedLabels.start}{" "}
                <ArrowRightIcon className="ml-1 size-3" />
              </Link>
            ) : null}
            {runningSummary}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
