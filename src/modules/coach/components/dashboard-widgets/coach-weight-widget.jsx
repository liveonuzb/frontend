import React from "react";
import { useNavigate } from "react-router";
import { ChevronRightIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const firstFinite = (...values) => {
  for (const value of values) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return numeric;
    }
  }

  return 0;
};

export default function CoachWeightWidget({
  currentWeightValue,
  targetWeightValue,
  startWeightValue,
  history = [],
  onOpen,
  interactive = true,
}) {
  const navigate = useNavigate();
  const currentWeight = firstFinite(currentWeightValue);
  const targetWeight = firstFinite(targetWeightValue) || 70;
  const lastHistoryWeight = history.length > 0 ? history[history.length - 1]?.weight : 0;
  const startWeight = firstFinite(
    startWeightValue,
    history.length >= 2 ? lastHistoryWeight : undefined,
    currentWeight + 5,
  );
  const progressRange = Math.abs(startWeight - targetWeight);
  const progressDone =
    progressRange > 0
      ? Math.max(0, Math.min(1, Math.abs(startWeight - currentWeight) / progressRange))
      : 0;

  return (
    <Card
      className="h-full py-6"
      onClick={interactive ? onOpen ?? (() => navigate("/user/measurements")) : undefined}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <span className="flex size-7 items-center justify-center rounded-lg bg-orange-500/15 text-base">
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
            {currentWeight > 0 ? currentWeight.toFixed(1) : "—"}
          </span>
          {currentWeight > 0 ? (
            <span className="text-sm font-semibold text-muted-foreground">kg</span>
          ) : null}
        </div>

        {currentWeight > 0 ? (
          <div className="space-y-1">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-700"
                style={{ width: `${Math.round(progressDone * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
              <span>Boshlang'ich: {startWeight.toFixed(1)} kg</span>
              <span>Maqsad: {targetWeight.toFixed(1)} kg</span>
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
          className={cn(
            "mt-auto flex w-full items-center gap-2 rounded-xl bg-muted/60 px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-muted",
            !interactive && "pointer-events-none opacity-60",
          )}
        >
          <span className="flex size-7 items-center justify-center rounded-lg bg-orange-500/20 text-base">
            📊
          </span>
          <span className="truncate">Ko'krak / Bel / Son</span>
          <ChevronRightIcon className="ml-auto size-4 shrink-0 text-muted-foreground" />
        </button>
      </CardContent>
    </Card>
  );
}
