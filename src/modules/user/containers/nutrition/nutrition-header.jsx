import React from "react";
import CalorieGaugeWidget from "@/components/calorie-gauge-widget";
import StrippedCalendar from "@/components/stripped-calendar/index.jsx";
import { Button } from "@/components/ui/button";
import { TrackingPageLayout } from "@/components/tracking-page-shell";
import { getTodayKey } from "@/hooks/app/use-daily-tracking";
import { cn } from "@/lib/utils";

const DEFAULT_CALENDAR_CLASS =
  "shadow md:shadow-none flex-1 rounded-2xl px-1 py-1 md:max-w-md md:flex-none md:w-full";

export function NutritionDatePicker({ date, onChange, className }) {
  const todayKey = getTodayKey();
  const selectedDateKey =
    date instanceof Date && !Number.isNaN(date.getTime())
      ? date.toISOString().split("T")[0]
      : todayKey;

  const handleTodayClick = () => {
    onChange(new Date(`${todayKey}T12:00:00`));
  };

  return (
    <div className={cn("flex w-full flex-col gap-2 sm:flex-row sm:items-center md:w-auto", className)}>
      <StrippedCalendar
        date={date}
        onChange={onChange}
        className={DEFAULT_CALENDAR_CLASS}
      />
      {selectedDateKey !== todayKey ? (
        <Button
          type="button"
          variant="outline"
          className="shrink-0 rounded-2xl font-bold"
          onClick={handleTodayClick}
        >
          Bugun
        </Button>
      ) : null}
    </div>
  );
}

function NutritionCalorieAside({
  calorieGoalMeta,
  goals,
  isGoalLoadingState,
  roundedTotals,
}) {
  return (
    <CalorieGaugeWidget
      consumed={roundedTotals.calories}
      goal={goals.calories}
      macros={{
        protein: {
          current: roundedTotals.protein,
          target: goals.protein,
        },
        carbs: { current: roundedTotals.carbs, target: goals.carbs },
        fat: { current: roundedTotals.fat, target: goals.fat },
      }}
      isGoalLoading={isGoalLoadingState}
      goalMeta={calorieGoalMeta}
      className="w-full py-6"
    />
  );
}

export default function NutritionTrackingLayout({
  calorieGoalMeta,
  children,
  goals,
  isGoalLoadingState,
  roundedTotals,
}) {
  return (
    <TrackingPageLayout
      aside={
        <NutritionCalorieAside
          calorieGoalMeta={calorieGoalMeta}
          goals={goals}
          isGoalLoadingState={isGoalLoadingState}
          roundedTotals={roundedTotals}
        />
      }
    >
      {children}
    </TrackingPageLayout>
  );
}
