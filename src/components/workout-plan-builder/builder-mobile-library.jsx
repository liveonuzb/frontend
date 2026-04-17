import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { map, get, size } from "lodash";
import { PlusIcon, DumbbellIcon } from "lucide-react";
import { cn } from "@/lib/utils.js";
import { Card } from "@/components/ui/card.jsx";
import { Input } from "@/components/ui/input.jsx";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer.jsx";
import { getWorkoutExerciseSummary } from "@/lib/workout-tracking";
import { getWorkoutCategoryLabel } from "./builder-utils.js";

const BuilderMobileLibrary = memo(({
  open,
  onOpenChange,
  filteredExercises,
  categories,
  search,
  selectedGroup,
  selectedDayId,
  onSearch,
  onSelectGroup,
  onAddExerciseToDay,
}) => {
  const { t } = useTranslation();

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent>
        <div className="flex max-h-[75vh] flex-col">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <DumbbellIcon className="size-4 text-primary" />
              {t("components.workoutPlanBuilder.mobile.addExercise")}
            </DrawerTitle>
          </DrawerHeader>
          <div className="space-y-3 px-4 pb-4">
            <Input
              placeholder={t("components.workoutPlanBuilder.desktop.searchPlaceholder")}
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              className="h-11 rounded-xl"
            />
            <div className="flex gap-2 overflow-x-auto scrollbar-none">
              {map(categories, (cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => onSelectGroup(cat)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-[11px] font-black whitespace-nowrap border shrink-0 transition-all",
                    selectedGroup === cat
                      ? "bg-foreground text-background border-foreground"
                      : "bg-muted/50 text-muted-foreground border-border/40",
                  )}
                >
                  {cat === "all"
                    ? t("components.workoutPlanBuilder.desktop.allCategories")
                    : getWorkoutCategoryLabel(cat, t)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
            {map(filteredExercises, (ex) => (
              <Card
                key={`mob-${get(ex, "id")}`}
                onClick={() => {
                  if (selectedDayId) {
                    onAddExerciseToDay(ex, selectedDayId);
                    onOpenChange(false);
                  }
                }}
                className="p-3 flex items-center gap-3 hover:border-primary/50 transition-all cursor-pointer"
              >
                <div className="size-10 rounded-xl bg-muted/50 flex items-center justify-center text-lg border border-border/40 shrink-0">
                  <span>{get(ex, "emoji")}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black truncate">{get(ex, "name")}</p>
                  <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">
                    {getWorkoutCategoryLabel(
                      get(ex, "groupLabel") || get(ex, "category"),
                      t,
                    )}{" "}
                    · {getWorkoutExerciseSummary(ex, t)}
                  </p>
                </div>
                <PlusIcon className="size-4 text-primary shrink-0" />
              </Card>
            ))}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
});

export default BuilderMobileLibrary;
