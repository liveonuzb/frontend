import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ListFilterIcon,
  PencilIcon,
  SearchIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import MealSection from "./meal-section.jsx";

import map from "lodash/map";
import lodashValues from "lodash/values";
import toPairs from "lodash/toPairs";

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
  onTransferMeal,
  onCopyMealToToday,
  readOnly = false,
  isLoading = false,
  addDisabled = false,
  onCopyFromYesterday,
  onBulkRemove,
}) {
  const [isSelectionMode, setIsSelectionMode] = React.useState(false);
  const [selectedItems, setSelectedItems] = React.useState({});
  const selectedList = React.useMemo(() => lodashValues(selectedItems), [selectedItems]);

  const clearSelection = React.useCallback(() => {
    setSelectedItems({});
    setIsSelectionMode(false);
  }, []);

  const toggleSelectedItem = React.useCallback((mealType, food) => {
    if (!food?.id) return;

    setSelectedItems((current) => {
      const key = `${mealType}:${food.id}`;
      if (current[key]) {
        const next = { ...current };
        delete next[key];
        return next;
      }

      return {
        ...current,
        [key]: { mealType, food },
      };
    });
  }, []);

  const handleBulkDelete = React.useCallback(async () => {
    if (selectedList.length === 0) return;

    await onBulkRemove?.(selectedList);
    clearSelection();
  }, [clearSelection, onBulkRemove, selectedList]);

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
            {map(toPairs(mealConfig), ([type, config]) => (
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
            {!readOnly ? (
              <Button
                variant={isSelectionMode ? "default" : "outline"}
                className="mr-2 shrink-0"
                onClick={() => {
                  if (isSelectionMode) {
                    clearSelection();
                  } else {
                    setIsSelectionMode(true);
                  }
                }}
              >
                {isSelectionMode ? (
                  <XIcon className="size-4" />
                ) : (
                  <PencilIcon className="size-4" />
                )}
                {isSelectionMode ? "Bekor" : "Tahrirlash"}
              </Button>
            ) : null}
            <Button
              variant="outline"
              size="icon"
              className="relative shrink-0"
              onClick={() => setIsFilterDrawerOpen(true)}
            >
              <ListFilterIcon className="size-4" />
              {activeFilterCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex size-3 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
                  {activeFilterCount}
                </span>
              ) : null}
            </Button>
          </div>
        </div>
      </div>
      {filteredMealSections.length > 0 ? (
        map(filteredMealSections, ([type, section]) => (
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
            onTransferMeal={onTransferMeal}
            onCopyMealToToday={onCopyMealToToday}
            onTogglePlanned={handleTogglePlanned}
            readOnly={readOnly}
            isLoading={isLoading}
            addDisabled={addDisabled}
            onCopyFromYesterday={onCopyFromYesterday}
            isSelectionMode={!readOnly && isSelectionMode}
            selectedItems={selectedItems}
            onToggleSelect={toggleSelectedItem}
            onEnterSelectionMode={() => setIsSelectionMode(true)}
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
      {isSelectionMode ? (
        <div className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl border bg-background/95 p-3 shadow-lg backdrop-blur">
          <div className="min-w-0">
            <p className="text-sm font-bold">
              {selectedList.length} ta ovqat tanlandi
            </p>
            <p className="text-xs text-muted-foreground">
              Tanlangan ovqatlarni bir vaqtda o'chirish
            </p>
          </div>
          <Button
            type="button"
            variant="destructive"
            disabled={selectedList.length === 0}
            onClick={() => void handleBulkDelete()}
          >
            <Trash2Icon className="size-4" />
            {selectedList.length} ta o'chirish
          </Button>
        </div>
      ) : null}
    </>
  );
}


