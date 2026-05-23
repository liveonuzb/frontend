import React from "react";
import { get } from "lodash";
import { useNavigate } from "react-router";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronRightIcon,
  RulerIcon,
  ScaleIcon,
} from "lucide-react";
import { useGetQuery } from "@/hooks/api";
import { getApiResponseData } from "@/lib/api-response";
import { normalizeUserOnboarding } from "@/lib/user-onboarding";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_MEASUREMENTS_QUERY_KEY,
  DASHBOARD_ME_QUERY_KEY,
  getMeasurementSnapshot,
  getUserFromResponse,
} from "./query-helpers.js";

export default function WeightWidget({
  currentWeightValue,
  targetWeightValue,
  startWeightValue,
  history,
  measurementSnapshot: measurementSnapshotOverride,
  onOpen,
  interactive = true,
}) {
  const navigate = useNavigate();
  const shouldFetchUser =
    measurementSnapshotOverride === undefined &&
    (currentWeightValue === undefined ||
      targetWeightValue === undefined ||
      startWeightValue === undefined);
  const shouldFetchMeasurements =
    measurementSnapshotOverride === undefined &&
    (history === undefined ||
      currentWeightValue === undefined ||
      startWeightValue === undefined);
  const { data: userData } = useGetQuery({
    url: "/users/me",
    queryProps: {
      queryKey: DASHBOARD_ME_QUERY_KEY,
      enabled: shouldFetchUser,
    },
  });
  const { data: measurementsData } = useGetQuery({
    url: "/measurements",
    queryProps: {
      queryKey: DASHBOARD_MEASUREMENTS_QUERY_KEY,
      enabled: shouldFetchMeasurements,
    },
  });
  const user = React.useMemo(() => getUserFromResponse(userData), [userData]);
  const onboarding = React.useMemo(
    () => normalizeUserOnboarding(get(user, "onboarding")),
    [user],
  );
  const measurementHistory = React.useMemo(
    () => history ?? getApiResponseData(measurementsData, []),
    [history, measurementsData],
  );
  const measurementSnapshot = React.useMemo(
    () =>
      measurementSnapshotOverride ??
      getMeasurementSnapshot({
        history: measurementHistory,
        onboarding,
        currentWeightValue,
        targetWeightValue,
        startWeightValue,
      }),
    [
      currentWeightValue,
      measurementHistory,
      measurementSnapshotOverride,
      onboarding,
      startWeightValue,
      targetWeightValue,
    ],
  );
  const weightChange = get(measurementSnapshot, "weightChange", 0);
  const currentW = get(measurementSnapshot, "currentWeight", 0);
  const targetW = get(measurementSnapshot, "targetWeight", 70);
  const startW = get(measurementSnapshot, "startWeight", currentW + 5);
  const progressRange = Math.abs(startW - targetW);
  const progressDone =
    progressRange > 0
      ? Math.max(0, Math.min(1, Math.abs(startW - currentW) / progressRange))
      : 0;
  const losing = targetW < startW;
  const isImproving = losing ? weightChange <= 0 : weightChange >= 0;
  const handleOpen = React.useCallback(() => {
    if (!interactive) return;
    if (onOpen) {
      onOpen();
      return;
    }
    navigate("/user/measurements");
  }, [interactive, navigate, onOpen]);

  return (
    <Card
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      className={cn(
        "group/card relative h-full overflow-hidden border border-border/60 py-3 ring-0 transition-colors hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
        interactive && "cursor-pointer",
      )}
      onClick={handleOpen}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleOpen();
              }
            }
          : undefined
      }
    >
      <div className="absolute -right-4 -top-4 size-20 rounded-full bg-primary/10 blur-[24px]" />
      <CardHeader className="relative z-10 px-4 pb-1.5">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex min-w-0 items-center gap-1.5 text-xs font-bold">
            <span className="rounded bg-primary/10 p-1 text-primary">
              <ScaleIcon className="size-3" />
            </span>
            <span className="truncate">Vazn</span>
          </CardTitle>
          {interactive ? (
            <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground/40" />
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="relative z-10 flex flex-1 flex-col gap-3 px-4 pb-3">
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Joriy vazn
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-black leading-none tabular-nums">
                {currentW > 0 ? currentW.toFixed(1) : "—"}
              </span>
              {currentW > 0 ? (
                <span className="text-sm font-bold text-muted-foreground">
                  kg
                </span>
              ) : null}
            </div>
          </div>
          {currentW > 0 && weightChange !== 0 ? (
            <span
              className={cn(
                "mb-0.5 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold",
                isImproving
                  ? "bg-green-500/15 text-green-500"
                  : "bg-red-500/15 text-red-500",
              )}
            >
              {isImproving ? (
                <ArrowDownIcon className="size-3.5" />
              ) : (
                <ArrowUpIcon className="size-3.5" />
              )}
              {Math.abs(weightChange).toFixed(1)} kg
            </span>
          ) : null}
        </div>

        {currentW > 0 ? (
          <div className="rounded-2xl border border-border/60 bg-background/60 p-2.5">
            <div className="mb-1.5 flex items-center justify-between gap-3 text-[10px] font-semibold text-muted-foreground">
              <span>Boshlang'ich: {startW.toFixed(1)} kg</span>
              <span>Maqsad: {targetW.toFixed(1)} kg</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700"
                style={{ width: `${Math.round(progressDone * 100)}%` }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[10px] font-bold text-primary">
              <span>{Math.round(progressDone * 100)}%</span>
              <span>bajarildi</span>
            </div>
          </div>
        ) : null}

        <div
          className="mt-auto flex w-full items-center gap-2 rounded-2xl border border-border/60 bg-background/60 px-3 py-2 text-sm font-bold"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <RulerIcon className="size-4" />
          </span>
          <span className="truncate">Ko'krak / Bel / Son</span>
          <ChevronRightIcon className="ml-auto size-4 shrink-0 text-muted-foreground/50" />
        </div>
      </CardContent>
    </Card>
  );
}
