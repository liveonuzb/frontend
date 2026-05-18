import React from "react";
import { get } from "lodash";
import { useNavigate } from "react-router";
import { ChevronRightIcon } from "lucide-react";
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

  return (
    <Card
      className="h-full py-6"
      onClick={
        interactive
          ? (onOpen ?? (() => navigate("/user/measurements")))
          : undefined
      }
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <span className="flex size-7 items-center justify-center rounded-lg bg-[rgb(var(--accent-rgb)/0.15)] text-base">
              ⚖️
            </span>
            Vazn
          </CardTitle>
          <ChevronRightIcon className="size-4 text-muted-foreground/50" />
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-black leading-none">
            {currentW > 0 ? currentW.toFixed(1) : "—"}
          </span>
          {currentW > 0 ? (
            <span className="text-sm font-semibold text-muted-foreground">
              kg
            </span>
          ) : null}
          {currentW > 0 && weightChange !== 0 ? (
            <span
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-0.5 text-sm font-bold",
                isImproving
                  ? "bg-green-500/15 text-green-500"
                  : "bg-red-500/15 text-red-500",
              )}
            >
              {isImproving ? "⬇" : "⬆"} {Math.abs(weightChange).toFixed(1)} kg
            </span>
          ) : null}
        </div>

        {currentW > 0 ? (
          <div className="space-y-1">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[rgb(var(--accent-rgb))] to-[rgb(var(--accent-strong-rgb))] transition-all duration-700"
                style={{ width: `${Math.round(progressDone * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
              <span>Boshlang'ich: {startW.toFixed(1)} kg</span>
              <span>Maqsad: {targetW.toFixed(1)} kg</span>
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            if (!interactive) return;
            if (onOpen) {
              onOpen();
              return;
            }
            navigate("/user/measurements");
          }}
          className="mt-auto flex w-full items-center gap-2 rounded-xl bg-muted/60 px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
        >
          <span className="flex size-7 items-center justify-center rounded-lg bg-[rgb(var(--accent-rgb)/0.20)] text-base">
            📊
          </span>
          <span className="truncate">Ko'krak / Bel / Son</span>
          <ChevronRightIcon className="ml-auto size-4 shrink-0 text-muted-foreground" />
        </button>
      </CardContent>
    </Card>
  );
}
