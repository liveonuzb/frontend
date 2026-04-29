import React from "react";
import { Button } from "@/components/ui/button";
import { ListFilterIcon } from "lucide-react";
import MealSection from "./meal-section.jsx";

export default function NutritionMealSections({
  mealConfig,
  mealFilter,
  setMealFilter,
  sourceFilters,
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
}) {
  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar relative">
          <div className="flex min-w-max gap-2 lg:w-auto lg:max-w-full">
            <Button
              type="button"
              className="shrink-0"
              variant={mealFilter === "all" ? "default" : "outline"}
              onClick={() => setMealFilter("all")}
            >
              Barchasi
            </Button>
            {Object.entries(mealConfig).map(([type, config]) => (
              <Button
                key={type}
                type="button"
                className="shrink-0"
                variant={mealFilter === type ? "default" : "outline"}
                onClick={() => setMealFilter(type)}
              >
                {config.label}
              </Button>
            ))}
          </div>
          <div className="sticky right-0 ml-auto flex h-full items-center bg-background/80 pl-2 backdrop-blur-sm">
            <Button
              variant="outline"
              size="icon"
              className="relative shrink-0"
              onClick={() => setIsFilterDrawerOpen(true)}
            >
              <ListFilterIcon className="size-4" />
              {sourceFilters.length > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
                  {sourceFilters.length}
                </span>
              ) : null}
            </Button>
          </div>
        </div>
      </div>

      {filteredMealSections.map(([type, section]) => (
        <MealSection
          key={type}
          type={type}
          isActive={type === activeMealType}
          time={section.time}
          items={section.foods || []}
          plannedItems={section.plannedItems || []}
          onRemove={handleRemoveFood}
          onAdd={() => {
            setSelectedMealTypeForAdd(type);
            setIsActionDrawerOpen(true);
          }}
          onLogPlanned={handleLogPlanned}
          onImageUpload={onImageUpload}
          onUpdateMeal={onUpdateMeal}
          onTogglePlanned={handleTogglePlanned}
        />
      ))}
    </>
  );
}
