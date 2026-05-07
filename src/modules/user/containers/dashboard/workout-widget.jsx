import React from "react";
import { get } from "lodash";
import { Link } from "react-router";
import { ArrowRightIcon, DumbbellIcon } from "lucide-react";
import useGetQuery from "@/hooks/api/use-get-query";
import { getApiResponseData } from "@/lib/api-response";
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
  const payload = React.useMemo(() => getApiResponseData(data, {}), [data]);
  const plans = React.useMemo(
    () => (Array.isArray(payload.items) ? payload.items : []),
    [payload.items],
  );
  const activePlan = React.useMemo(() => {
    if (activePlanOverride !== undefined) {
      return activePlanOverride;
    }

    const activePlanId = get(payload, "activePlanId", null);
    return deriveWorkoutPlanMetrics(
      plans.find((plan) => plan.id === activePlanId) || null,
    );
  }, [activePlanOverride, payload, plans]);

  return (
    <Card className={cn("relative h-full overflow-hidden", className)}>
      <div className="absolute -right-4 -top-4 size-20 rounded-full bg-primary/20 blur-[24px] transition-colors group-hover:bg-primary/30" />
      <CardHeader className="relative z-10 px-4 pb-2 pt-4">
        <CardTitle className="flex items-center gap-1.5 text-xs font-bold">
          <div className="rounded bg-primary/10 p-1">
            <DumbbellIcon className="size-3 text-primary" />
          </div>
          {resolvedLabels.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="relative z-10 flex flex-1 flex-col justify-center px-4 pb-4">
        {activePlan ? (
          <div className="flex flex-col gap-2">
            <p className="truncate text-xs font-semibold">{activePlan.name}</p>
            <div className="flex items-center gap-2">
              <Progress value={activePlan.progress ?? 0} className="h-1.5 flex-1" />
              <span className="shrink-0 text-[10px] text-muted-foreground">
                {activePlan.progress ?? 0}%
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground">
              {activePlan.completedWorkouts ?? 0} / {activePlan.days ?? 0}{" "}
              {resolvedLabels.sessions}
            </div>
            {interactive ? (
              <Link
                to="/user/workout"
                className="mt-1 inline-flex self-start rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-bold text-primary transition-colors hover:bg-primary/20"
              >
                {resolvedLabels.continue}{" "}
                <ArrowRightIcon className="ml-1 size-3" />
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="text-center">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              {resolvedLabels.empty}
            </p>
            {interactive ? (
              <Link
                to="/user/workout"
                className="inline-flex rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-bold text-primary transition-colors hover:bg-primary/20"
              >
                {resolvedLabels.start}{" "}
                <ArrowRightIcon className="ml-1 size-3" />
              </Link>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
