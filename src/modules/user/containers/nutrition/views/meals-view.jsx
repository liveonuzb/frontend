import React from "react";
import { Button } from "@/components/ui/button";
import {
  BookmarkIcon,
  CalendarDaysIcon,
  CameraIcon,
  DropletsIcon,
  FlameIcon,
  PlusIcon,
  RotateCcwIcon,
  SparklesIcon,
} from "lucide-react";
import NutritionMealSections from "../nutrition-meal-sections.jsx";
import { NutritionDatePicker } from "../nutrition-header.jsx";
import NutritionLayout from "../ui/nutrition-layout.jsx";
import NutritionPageHeader from "../ui/nutrition-page-header.jsx";
import NutritionCard from "../ui/nutrition-card.jsx";
import StatCard from "../ui/stat-card.jsx";
import ProgressBar, { getProgressPercent } from "../ui/progress-bar.jsx";
import AIRecommendationCard from "../ui/ai-recommendation-card.jsx";
import QuickActionsBar from "../ui/quick-actions-bar.jsx";

import { map, toNumber } from "lodash";

const macroSummary = [
  ["Protein", "protein", "g", SparklesIcon],
  ["Carbs", "carbs", "g", FlameIcon],
  ["Fat", "fat", "g", DropletsIcon],
];

export default function NutritionMealsView(props) {
  const {
    date,
    setDate,
    goals,
    roundedTotals,
    waterConsumedMl,
    waterGoalMl,
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
    setIsSavedMealsOpen,
  } = props;
  const caloriePercent = getProgressPercent(roundedTotals.calories, goals.calories);
  const waterPercent = getProgressPercent(waterConsumedMl, waterGoalMl);
  const addDisabled = !isOnline;
  const openAddMeal = () => {
    setSelectedMealTypeForAdd(activeMealType);
    setIsActionDrawerOpen(true);
  };
  const sidebar = (
    <>
      <NutritionCard>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Kunlik progress
            </p>
            <p className="mt-2 text-3xl font-black">{caloriePercent}%</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {roundedTotals.calories} / {goals.calories} kcal
            </p>
          </div>
          <div
            className="grid size-20 place-items-center rounded-full text-sm font-black text-primary"
            style={{
              background: `conic-gradient(hsl(var(--primary)) ${caloriePercent * 3.6}deg, hsl(var(--muted)) 0deg)`,
            }}
          >
            <div className="grid size-14 place-items-center rounded-full bg-card">
              {caloriePercent}%
            </div>
          </div>
        </div>
        <ProgressBar
          className="mt-4"
          value={roundedTotals.calories}
          target={goals.calories}
          aria-label="Kunlik kaloriya progress"
        />
      </NutritionCard>
      <StatCard
        icon={DropletsIcon}
        label="Suv"
        value={`${toNumber(waterConsumedMl || 0)} / ${toNumber(waterGoalMl || 0)}`}
        unit="ml"
        description={`${waterPercent}% bajarildi`}
        tone="water"
        progress={{
          value: waterConsumedMl,
          target: waterGoalMl,
          tone: "water",
          ariaLabel: "Suv progress",
        }}
      />
      <NutritionCard>
        <h2 className="text-sm font-black">Yaqinda qo'shilgan ovqatlar</h2>
        <div className="mt-3 space-y-2">
          {map(filteredMealSections, ([type, section]) => {
            const food = section.foods?.[0];
            if (!food) return null;

            return (
              <div key={type} className="flex items-center justify-between gap-3 rounded-2xl bg-muted/40 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{food.name}</p>
                  <p className="text-xs text-muted-foreground">{mealConfig[type]?.label}</p>
                </div>
                <span className="text-xs font-black">{Math.round(toNumber(food.cal || 0))} kcal</span>
              </div>
            );
          })}
        </div>
      </NutritionCard>
      <AIRecommendationCard
        title="AI tavsiya"
        description="Bugungi balansda makrolar oshib ketsa, keyingi ovqatni yengilroq va oqsilga boy tanlang."
        actionLabel="Ovqat qo'shish"
        onAction={openAddMeal}
      />
    </>
  );
  const bottomActions = (
    <QuickActionsBar
      actions={[
        {
          label: "Kechagi nusxadan qo'shish",
          icon: RotateCcwIcon,
          disabled: addDisabled,
          onClick: handleCopyFromYesterday,
        },
        {
          label: "Saqlanganlardan qo'shish",
          icon: BookmarkIcon,
          disabled: addDisabled,
          onClick: () => setIsSavedMealsOpen(true),
        },
        {
          label: "Rasmga olish",
          icon: CameraIcon,
          disabled: addDisabled,
          onClick: openAddMeal,
        },
      ]}
    />
  );

  return (
    <NutritionLayout sidebar={sidebar} bottomActions={bottomActions}>
      {!isOnline ? (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-800 dark:text-amber-200">
          Tarmoq yo&apos;q — o&apos;zgarishlar saqlanmaydi
        </div>
      ) : null}
      <NutritionPageHeader
        eyebrow="Bugungi ovqatlar"
        title="Bugungi ovqatlar"
        description="Ovqatlarni qo'shing, statuslarni kuzating va kunlik balansni boshqaring."
        actions={<NutritionDatePicker date={date} onChange={setDate} />}
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={FlameIcon}
          label="Kaloriya"
          value={`${roundedTotals.calories}/${goals.calories}`}
          unit="kcal"
          progress={{
            value: roundedTotals.calories,
            target: goals.calories,
            ariaLabel: "Kaloriya progress",
          }}
        />
        {map(macroSummary, ([label, key, unit, Icon]) => (
          <StatCard
            key={key}
            icon={Icon}
            label={label}
            value={`${roundedTotals[key]}/${goals[key]}`}
            unit={unit}
            progress={{
              value: roundedTotals[key],
              target: goals[key],
              ariaLabel: `${label} progress`,
            }}
          />
        ))}
      </div>
      <NutritionCard className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black">Meal logging</p>
            <p className="text-xs text-muted-foreground">
              Qidiruv, filter va meal cardlar orqali bugungi ovqatlarni boshqaring.
            </p>
          </div>
          <Button type="button" className="rounded-full" disabled={addDisabled} onClick={openAddMeal}>
            <PlusIcon className="size-4" />
            Ovqat qo'shish
          </Button>
        </div>
      </NutritionCard>
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
        disabled={addDisabled}
        aria-label="Ovqat qo'shish"
        className="fixed bottom-5 right-5 z-30 size-14 rounded-full shadow-lg"
        onClick={openAddMeal}
      >
        <PlusIcon className="size-5" />
      </Button>
    </NutritionLayout>
  );
}
