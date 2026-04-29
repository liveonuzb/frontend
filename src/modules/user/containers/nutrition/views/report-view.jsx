import React from "react";
import CalorieGaugeWidget from "@/components/calorie-gauge-widget";
import NutritionAnalyticsSection from "../nutrition-analytics-section.jsx";
import { TrackingPageLayout } from "@/components/tracking-page-shell";
import StrippedCalendar from "@/components/stripped-calendar/index.jsx";

export default function NutritionReportView({
  date,
  setDate,
  currentPlan,
  roundedTotals,
  goals,
  isGoalLoadingState,
  calorieGoalMeta,
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex md:justify-end">
        <StrippedCalendar
          date={date}
          onChange={setDate}
          className="shadow md:shadow-none flex-1 rounded-2xl px-1 py-1 md:max-w-md md:flex-none md:w-full"
        />
      </div>
      <TrackingPageLayout
        aside={
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
        }
      >
        {currentPlan ? (
          <div className="rounded-[2rem] border p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Faol ovqatlanish reja
            </p>
            <h3 className="mt-2 text-lg font-black">{currentPlan.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {currentPlan.status === "active" ? "Faol" : "Saqlangan"} •{" "}
              {currentPlan.source === "coach"
                ? "Murabbiy"
                : currentPlan.source === "ai"
                  ? "AI"
                  : "Manual"}
            </p>
          </div>
        ) : null}
        <NutritionAnalyticsSection />
      </TrackingPageLayout>
    </div>
  );
}
