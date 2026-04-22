import React from "react";
import { get, includes } from "lodash";
import {
  DrawerBody,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer.jsx";
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

const NutritionFilterDrawer = ({ activeFilters, onToggleFilter }) => {
  return (
    <>
      <DrawerHeader>
        <DrawerTitle>Manbalar</DrawerTitle>
        <DrawerDescription>
          Qaysi manbadan qo'shilgan ovqatlarni ko'rishni xohlaysiz?
        </DrawerDescription>
      </DrawerHeader>
      <DrawerBody className="space-y-4 pb-8">
        <div className="space-y-4 rounded-2xl border p-4">
          {FILTERS.map((filter) => {
            const isActive = includes(activeFilters, filter.key);
            return (
              <div key={filter.key} className="flex items-center justify-between">
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
