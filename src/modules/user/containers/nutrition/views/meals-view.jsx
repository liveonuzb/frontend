import React from "react";
import { Button } from "@/components/ui/button";
import { BookmarkIcon, PlusIcon } from "lucide-react";
import CalorieGaugeWidget from "@/components/calorie-gauge-widget";
import { TrackingPageLayout } from "@/components/tracking-page-shell";
import StrippedCalendar from "@/components/stripped-calendar/index.jsx";
import NutritionMealSections from "../nutrition-meal-sections.jsx";

export default function NutritionMealsView(props) {
  const {
    date,
    setDate,
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
    setIsSavedMealsOpen,
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

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Bugungi ovqatlar
          </p>
          <h1 className="text-3xl font-black tracking-tight">Meals</h1>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsSavedMealsOpen(true)}
          >
            <BookmarkIcon className="size-4" />
            Saqlanganlar
          </Button>
          <Button
            type="button"
            disabled={!isOnline}
            onClick={() => {
              setSelectedMealTypeForAdd(activeMealType);
              setIsActionDrawerOpen(true);
            }}
          >
            <PlusIcon className="size-4" />
            Ovqat qo&apos;shish
          </Button>
        </div>
      </div>

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
    </div>
  );
}
