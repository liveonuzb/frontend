import React from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { get } from "lodash";
import useMeasurements from "@/hooks/app/use-measurements";
import { useAuthStore } from "@/store";
import { normalizeUserOnboarding } from "@/lib/user-onboarding";

const firstFinite = (...values) => {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number)) {
      return number;
    }
  }

  return 0;
};

export default function WeightWidget({
  currentWeightValue,
  targetWeightValue,
  startWeightValue,
  history,
  onOpen,
  interactive = true,
}) {
  const navigate = useNavigate();
  const { getLatest, getChange, history: measHistory } = useMeasurements();
  const { user } = useAuthStore();
  const onboarding = normalizeUserOnboarding(get(user, "onboarding"));
  const onboardingWeight = get(onboarding, "currentWeight");
  const onboardingTarget = get(onboarding, "targetWeight");

  const latest = getLatest();
  const historyData = history ?? measHistory;
  const weightChange = history ? 0 : getChange("weight");
  const currentW = firstFinite(
    currentWeightValue,
    get(latest, "weight"),
    parseFloat(get(onboardingWeight, "value")),
  );
  const targetW =
    firstFinite(targetWeightValue, parseFloat(get(onboardingTarget, "value"))) ||
    70;

  const lastHistoryWeight = get(historyData, [historyData.length - 1, "weight"]);
  const startW =
    firstFinite(
      startWeightValue,
      historyData.length >= 2 ? lastHistoryWeight : undefined,
      parseFloat(get(onboardingWeight, "value")) + 5,
    ) ||
    (historyData.length >= 2
      ? lastHistoryWeight
      : parseFloat(get(onboardingWeight, "value")) + 5) ||
    currentW + 5;

  const progressRange = Math.abs(startW - targetW);
  const progressDone =
    progressRange > 0
      ? Math.max(0, Math.min(1, Math.abs(startW - currentW) / progressRange))
      : 0;
  const losing = targetW < startW;
  const isImproving = losing ? weightChange <= 0 : weightChange >= 0;

  return (
    <Card
      className="py-6 h-full"
      onClick={interactive ? onOpen ?? (() => navigate("/user/measurements")) : undefined}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <span className="size-7 rounded-lg bg-orange-500/15 flex items-center justify-center text-base">
              ⚖️
            </span>
            Vazn
          </CardTitle>
          <ChevronRightIcon className="size-4 text-muted-foreground/50" />
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-black leading-none">
            {currentW > 0 ? currentW.toFixed(1) : "—"}
          </span>
          {currentW > 0 && (
            <span className="text-sm text-muted-foreground font-semibold">
              kg
            </span>
          )}
          {currentW > 0 && weightChange !== 0 && (
            <span
              className={cn(
                "flex items-center gap-1 text-sm font-bold px-2 py-0.5 rounded-full",
                isImproving
                  ? "bg-green-500/15 text-green-500"
                  : "bg-red-500/15 text-red-500",
              )}
            >
              {isImproving ? "⬇" : "⬆"} {Math.abs(weightChange).toFixed(1)} kg
            </span>
          )}
        </div>

        {currentW > 0 && (
          <div className="space-y-1">
            <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-700"
                style={{ width: `${Math.round(progressDone * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
              <span>Boshlang'ich: {startW.toFixed(1)} kg</span>
              <span>Maqsad: {targetW.toFixed(1)} kg</span>
            </div>
          </div>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!interactive) return;
            if (onOpen) {
              onOpen();
              return;
            }
            navigate("/user/measurements");
          }}
          className="flex items-center gap-2 w-full bg-muted/60 hover:bg-muted rounded-xl px-3 py-2.5 text-sm font-semibold mt-auto transition-colors"
        >
          <span className="size-7 rounded-lg bg-orange-500/20 flex items-center justify-center text-base">
            📊
          </span>
          <span className="truncate">Ko'krak / Bel / Son</span>
          <ChevronRightIcon className="size-4 ml-auto text-muted-foreground shrink-0" />
        </button>
      </CardContent>
    </Card>
  );
}
