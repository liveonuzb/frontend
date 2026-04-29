import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronRightIcon, TargetIcon } from "lucide-react";
import CalorieGaugeWidget from "@/components/calorie-gauge-widget";
import { TrackingPageLayout } from "@/components/tracking-page-shell";
import StrippedCalendar from "@/components/stripped-calendar/index.jsx";
import NutritionAnalyticsSection from "../nutrition-analytics-section.jsx";
import NutritionMealSections from "../nutrition-meal-sections.jsx";

export default function NutritionHomeView(props) {
  const {
    date,
    setDate,
    plans,
    currentPlan,
    goals,
    roundedTotals,
    calorieGoalMeta,
    isGoalLoadingState,
    mealConfig,
    mealFilter,
    setMealFilter,
    mealSearch,
    setMealSearch,
    activeNutritionFilterCount,
    setIsFilterDrawerOpen,
    filteredMealSections,
    activeMealType,
    setSelectedMealTypeForAdd,
    setIsActionDrawerOpen,
    handleRemoveFood,
    handleLogPlanned,
    handleTogglePlanned,
    onImageUpload,
    onUpdateMeal,
    onRetryScan,
    onRemoveScan,
    onOpenDraftScan,
    setIsPlansDrawerOpen,
    onOpenGoalWizard,
    isOnline,
    isDayLoading,
    handleCopyFromYesterday,
  } = props;

  return (
    <div className="flex flex-col gap-6">
      {!isOnline ? (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-800 dark:text-amber-200">
          Tarmoq yo&apos;q — o&apos;zgarishlar saqlanmaydi
        </div>
      ) : null}

      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <Button
          type="button"
          variant="outline"
          className="md:w-auto"
          onClick={onOpenGoalWizard}
        >
          <TargetIcon className="size-4" />
          Maqsadimni yangilash
        </Button>
        <StrippedCalendar
          date={date}
          onChange={setDate}
          className="shadow md:shadow-none flex-1 rounded-2xl px-1 py-1 md:max-w-md md:flex-none md:w-full"
        />
      </div>

      {plans.length > 0 ? (
        <button
          type="button"
          onClick={() => setIsPlansDrawerOpen(true)}
          className="rounded-[2rem] border p-4 text-left transition-colors hover:bg-accent/40 sm:p-5"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Mening rejalarim
              </p>
              <h3 className="mt-1 truncate text-base font-black">
                {currentPlan?.name || "Reja tanlang"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {plans.length} ta reja •{" "}
                {currentPlan?.status === "active"
                  ? "Faol reja"
                  : "Saqlangan reja"}
              </p>
            </div>
            <ChevronRightIcon className="size-5 shrink-0 text-muted-foreground" />
          </div>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsPlansDrawerOpen(true)}
          className="rounded-[2rem] border border-dashed p-5 text-left transition-colors hover:bg-accent/30"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Mening rejalarim
              </p>
              <h3 className="mt-1 text-base font-black">
                Ovqatlanish rejasi yo&apos;q
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Qo&apos;lda yoki AI bilan yangi reja yarating
              </p>
            </div>
            <ChevronRightIcon className="size-5 shrink-0 text-muted-foreground" />
          </div>
        </button>
      )}

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
        <NutritionMealSections
          mealConfig={mealConfig}
          mealFilter={mealFilter}
          setMealFilter={setMealFilter}
          mealSearch={mealSearch}
          setMealSearch={setMealSearch}
          activeFilterCount={activeNutritionFilterCount}
          setIsFilterDrawerOpen={setIsFilterDrawerOpen}
          filteredMealSections={filteredMealSections}
          activeMealType={activeMealType}
          setSelectedMealTypeForAdd={setSelectedMealTypeForAdd}
          setIsActionDrawerOpen={setIsActionDrawerOpen}
          handleRemoveFood={handleRemoveFood}
          handleLogPlanned={handleLogPlanned}
          handleTogglePlanned={handleTogglePlanned}
          onImageUpload={onImageUpload}
          onUpdateMeal={onUpdateMeal}
          onRetryScan={onRetryScan}
          onRemoveScan={onRemoveScan}
          onOpenDraftScan={onOpenDraftScan}
          isLoading={isDayLoading}
          addDisabled={!isOnline}
          onCopyFromYesterday={handleCopyFromYesterday}
        />
      </TrackingPageLayout>

      <NutritionAnalyticsSection />
    </div>
  );
}
