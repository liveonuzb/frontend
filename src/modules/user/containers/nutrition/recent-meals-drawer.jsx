import React from "react";
import {
  Drawer,
  DrawerBody,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer.jsx";
import { Button } from "@/components/ui/button.jsx";
import { cn } from "@/lib/utils.js";
import {
  CheckIcon,
  ChevronUpIcon,
  Clock3Icon,
  Loader2Icon,
} from "lucide-react";
import { NutritionDrawerContent } from "./nutrition-drawer-layout.jsx";

export default function RecentMealsDrawer({
  open,
  onOpenChange,
  meals = [],
  isLoading = false,
  selectedMealId,
  onSelectMeal,
  mealTimeLabel,
  onOpenTime,
  onCopy,
  isCopying = false,
}) {
  const selectedMeal = meals.find((meal) => meal.id === selectedMealId) || null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <NutritionDrawerContent size="sm">
        <DrawerHeader className="pb-2 text-left">
          <DrawerTitle className="sr-only">Recent meals</DrawerTitle>
          <DrawerDescription className="sr-only">
            Oldingi taomni tanlab, tanlangan vaqtga copy qiling.
          </DrawerDescription>
          <button
            type="button"
            onClick={onOpenTime}
            className="inline-flex w-fit items-center gap-2 rounded-full text-xs font-bold text-muted-foreground transition-colors hover:text-foreground"
          >
            <Clock3Icon className="size-4" />
            {mealTimeLabel}
            <ChevronUpIcon className="size-4" />
          </button>
        </DrawerHeader>

        <DrawerBody className="px-5 pb-4">
          {isLoading ? (
            <div className="flex min-h-48 items-center justify-center">
              <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : meals.length === 0 ? (
            <div className="flex min-h-48 items-center justify-center rounded-3xl border border-dashed bg-muted/15 px-6 text-center text-sm text-muted-foreground">
              Hali recent meal yo&apos;q. Taomni saqlab yoki log qilib bo&apos;lgandan
              keyin bu yerda chiqadi.
            </div>
          ) : (
            <div className="flex gap-5 overflow-x-auto pb-3 no-scrollbar">
              {meals.map((meal) => {
                const isSelected = meal.id === selectedMealId;

                return (
                  <button
                    key={meal.id}
                    type="button"
                    onClick={() => onSelectMeal(meal.id)}
                    className="w-32 shrink-0 text-center transition-transform active:scale-95"
                  >
                    <span
                      className={cn(
                        "relative mx-auto grid size-20 place-items-center overflow-hidden rounded-full border-4 bg-muted",
                        isSelected
                          ? "border-emerald-500"
                          : "border-transparent",
                      )}
                    >
                      {meal.imageUrl ? (
                        <img
                          src={meal.imageUrl}
                          alt={meal.name}
                          className="size-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl">🍽️</span>
                      )}
                      {isSelected ? (
                        <span className="absolute right-0 top-0 grid size-7 place-items-center rounded-full bg-emerald-500 text-white">
                          <CheckIcon className="size-4" />
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-3 line-clamp-2 block text-sm font-black leading-tight text-foreground">
                      {meal.name}
                    </span>
                    <span className="mt-1 block text-xs font-bold text-muted-foreground">
                      {Math.round(meal.calories)} kcal
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </DrawerBody>

        <DrawerFooter>
          <Button
            type="button"
            className="h-14 rounded-full text-base font-black"
            disabled={!selectedMeal || isCopying}
            onClick={onCopy}
          >
            {isCopying ? (
              <>
                <Loader2Icon className="mr-2 size-4 animate-spin" />
                Copy qilinmoqda
              </>
            ) : (
              "Copy this meal"
            )}
          </Button>
        </DrawerFooter>
      </NutritionDrawerContent>
    </Drawer>
  );
}
