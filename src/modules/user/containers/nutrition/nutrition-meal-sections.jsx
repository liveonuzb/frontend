import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListFilterIcon, SearchIcon, XIcon } from "lucide-react";
import MealSection from "./meal-section.jsx";

export default function NutritionMealSections({
  mealConfig,
  mealFilter,
  setMealFilter,
  mealSearch,
  setMealSearch,
  activeFilterCount = 0,
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
  isLoading = false,
  addDisabled = false,
  onCopyFromYesterday,
}) {
  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={mealSearch}
              onChange={(event) => setMealSearch(event.target.value)}
              placeholder="Ovqat qidirish"
              className="h-11 rounded-2xl pl-9 pr-9"
            />
            {mealSearch ? (
              <button
                type="button"
                onClick={() => setMealSearch("")}
                className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Qidiruvni tozalash"
              >
                <XIcon className="size-4" />
              </button>
            ) : null}
          </div>
        </div>
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
              {activeFilterCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
                  {activeFilterCount}
                </span>
              ) : null}
            </Button>
          </div>
        </div>
      </div>

      {filteredMealSections.length > 0 ? (
        filteredMealSections.map(([type, section]) => (
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
            onRetryScan={onRetryScan}
            onRemoveScan={onRemoveScan}
            onOpenDraftScan={onOpenDraftScan}
            onTogglePlanned={handleTogglePlanned}
            isLoading={isLoading}
            addDisabled={addDisabled}
            onCopyFromYesterday={onCopyFromYesterday}
          />
        ))
      ) : (
        <div className="rounded-2xl border border-dashed px-4 py-8 text-center">
          <p className="text-sm font-semibold">Mos ovqat topilmadi</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Qidiruv yoki filterlarni yumshatib ko'ring.
          </p>
        </div>
      )}
    </>
  );
}
