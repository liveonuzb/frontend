import React from "react";
import { get, includes } from "lodash";
import { Badge } from "@/components/ui/badge.jsx";
import { Button } from "@/components/ui/button";
import {
  DrawerBody,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer.jsx";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch.jsx";
import { SOURCE_META } from "./source-meta.js";

const FILTERS = [
  { key: "manual", label: get(SOURCE_META, "manual.label"), description: "Qo'lda kiritilgan ovqatlar" },
  { key: "text", label: get(SOURCE_META, "text.label"), description: "Matn orqali kiritilganlar" },
  { key: "audio", label: get(SOURCE_META, "audio.label"), description: "Ovozli xabar orqali" },
  { key: "camera", label: get(SOURCE_META, "camera.label"), description: "Rasmga olinganlar" },
  { key: "saved-meal", label: get(SOURCE_META, "saved-meal.label"), description: "Oldin saqlangan taomlar" },
  { key: "meal-plan", label: get(SOURCE_META, "meal-plan.label"), description: "Rejadagi ovqatlar" },
];

const NutritionFilterDrawer = ({
  activeFilters,
  onToggleFilter,
  mealSearch,
  onMealSearchChange,
  calorieRange,
  onCalorieRangeChange,
  dateRange,
  onDateRangeChange,
  activeFilterCount = 0,
  onClearFilters,
}) => {
  return (
    <>
      <DrawerHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <DrawerTitle>Filterlar</DrawerTitle>
            <DrawerDescription>
              Qidiruv, manba, kaloriya va sana oralig'ini sozlang.
            </DrawerDescription>
          </div>
          {activeFilterCount > 0 ? (
            <Badge variant="secondary" className="shrink-0">
              {activeFilterCount}
            </Badge>
          ) : null}
        </div>
      </DrawerHeader>
      <DrawerBody className="space-y-4 pb-8">
        <div className="space-y-2 rounded-2xl border p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Qidirish</p>
              <p className="text-xs text-muted-foreground">
                Ovqat nomi, ingredient yoki barcode bo'yicha
              </p>
            </div>
            {activeFilterCount > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
              >
                Tozalash
              </Button>
            ) : null}
          </div>
          <Input
            value={mealSearch}
            onChange={(event) => onMealSearchChange(event.target.value)}
            placeholder="Masalan: tovuq, guruch"
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-4 rounded-2xl border p-4">
          <div>
            <p className="text-sm font-semibold">Kaloriya oralig'i</p>
            <p className="text-xs text-muted-foreground">
              {calorieRange[0]} - {calorieRange[1]} kcal
            </p>
          </div>
          <Slider
            value={calorieRange}
            min={0}
            max={1000}
            step={25}
            onValueChange={onCalorieRangeChange}
          />
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>0 kcal</span>
            <span>1000 kcal</span>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border p-4">
          <div>
            <p className="text-sm font-semibold">Sana oralig'i</p>
            <p className="text-xs text-muted-foreground">
              Tanlangan kundagi yozuvlar qo'shilgan sanasi bo'yicha
              toraytiriladi
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              value={dateRange.start}
              onChange={(event) =>
                onDateRangeChange((current) => ({
                  ...current,
                  start: event.target.value,
                }))
              }
              className="rounded-2xl"
            />
            <Input
              type="date"
              value={dateRange.end}
              onChange={(event) =>
                onDateRangeChange((current) => ({
                  ...current,
                  end: event.target.value,
                }))
              }
              className="rounded-2xl"
            />
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border p-4">
          <div>
            <p className="text-sm font-semibold">Manbalar</p>
            <p className="text-xs text-muted-foreground">
              Qaysi manbadan qo'shilgan ovqatlarni ko'rsatish kerak?
            </p>
          </div>
          {FILTERS.map((filter) => {
            const isActive = includes(activeFilters, filter.key);
            return (
              <div key={filter.key} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">{filter.label}</p>
                  <p className="text-xs text-muted-foreground">{filter.description}</p>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={() => onToggleFilter(filter.key)}
                />
              </div>
            );
          })}
        </div>
      </DrawerBody>
    </>
  );
};

export default NutritionFilterDrawer;
