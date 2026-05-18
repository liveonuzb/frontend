import React from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import NutritionMealSections from "../nutrition-meal-sections.jsx";

import { map } from "lodash";

export default function NutritionMealsView(props) {
  const {
    goals,
    roundedTotals,
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
    isOnline,
    isDayLoading,
    handleCopyFromYesterday,
    handleBulkRemoveFoods,
    onTransferMeal,
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
          <h1 className="text-3xl font-black tracking-tight">Ovqatlar</h1>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        {map([
          ["Kaloriya", `${roundedTotals.calories}/${goals.calories}`, "kcal"],
          ["Protein", `${roundedTotals.protein}/${goals.protein}`, "g"],
          ["Carbs", `${roundedTotals.carbs}/${goals.carbs}`, "g"],
          ["Fat", `${roundedTotals.fat}/${goals.fat}`, "g"],
        ], ([label, value, unit]) => (
          <div key={label} className="rounded-2xl border bg-card px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <p className="mt-1 text-lg font-black">
              {value} <span className="text-xs text-muted-foreground">{unit}</span>
            </p>
          </div>
        ))}
      </div>
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
        onBulkRemove={handleBulkRemoveFoods}
        onTransferMeal={onTransferMeal}
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
      <Button
        type="button"
        disabled={!isOnline}
        aria-label="Ovqat qo'shish"
        className="fixed bottom-5 right-5 z-30 size-14 rounded-full shadow-lg"
        onClick={() => {
          setSelectedMealTypeForAdd(activeMealType);
          setIsActionDrawerOpen(true);
        }}
      >
        <PlusIcon className="size-5" />
      </Button>
    </div>
  );
}
