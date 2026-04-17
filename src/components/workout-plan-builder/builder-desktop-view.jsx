import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { map, find, get, size } from "lodash";
import {
  SearchIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DumbbellIcon,
} from "lucide-react";
import { cn } from "@/lib/utils.js";
import { Input } from "@/components/ui/input.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Card } from "@/components/ui/card.jsx";
import {
  Kanban,
  KanbanBoard,
  KanbanOverlay,
} from "@/components/reui/kanban.jsx";
import { getWorkoutExerciseSummary } from "@/lib/workout-tracking";
import ExerciseLibraryItem from "./library-item.jsx";
import BuilderColumn from "./builder-column.jsx";
import { getWorkoutCategoryLabel } from "./builder-utils.js";
import { toast } from "sonner";

const BuilderDesktopView = memo(({
  trainDays,
  trainDayColumns,
  kanbanValue,
  filteredExercises,
  categories,
  search,
  selectedGroup,
  isSidebarOpen,
  lockWeekDays,
  onSearch,
  onSelectGroup,
  onToggleSidebar,
  onKanbanChange,
  onExternalDragEnd,
  onRemoveExercise,
  onRemoveDay,
  onUpdateDay,
  onUpdateExercise,
  onAddDay,
  onAddExerciseToDay,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex-1 flex overflow-hidden">
      <Kanban
        value={kanbanValue}
        onValueChange={onKanbanChange}
        getItemValue={(item) => get(item, "id")}
        onDragEnd={onExternalDragEnd}
        className="flex w-full h-full overflow-hidden"
      >
        {/* Left sidebar: exercise library */}
        <div className="relative flex shrink-0 h-full overflow-hidden">
          <div
            className={cn(
              "border-r flex flex-col h-full transition-all duration-300 overflow-hidden",
              isSidebarOpen ? "w-72 sm:w-80" : "w-0 border-r-0",
            )}
          >
            <div className="p-4 border-b border-border/40 shrink-0 space-y-4 bg-background/30 backdrop-blur-md">
              <div className="relative group">
                <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder={t("components.workoutPlanBuilder.desktop.searchPlaceholder")}
                  className="pl-10 h-11 bg-background/50 border-border/40 focus:border-primary/50 rounded-xl shadow-sm"
                  value={search}
                  onChange={(e) => onSearch(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4">
                {map(categories, (cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => onSelectGroup(cat)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black whitespace-nowrap transition-all border shrink-0",
                      selectedGroup === cat
                        ? "bg-foreground text-background border-foreground shadow-sm scale-105"
                        : "bg-background/80 text-muted-foreground border-border/40 hover:bg-muted/80",
                    )}
                  >
                    {cat === "all"
                      ? t("components.workoutPlanBuilder.desktop.allCategories")
                      : getWorkoutCategoryLabel(cat, t)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {size(filteredExercises) === 0 ? (
                <div className="flex h-full min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed text-sm text-muted-foreground px-4 text-center">
                  <p className="font-medium text-foreground">
                    {t("components.workoutPlanBuilder.desktop.noExercises")}
                  </p>
                  <p className="mt-1">{t("components.workoutPlanBuilder.desktop.tryDifferentSearch")}</p>
                </div>
              ) : (
                map(filteredExercises, (ex) => {
                  const firstDay = get(trainDays, "[0]");
                  return (
                    <ExerciseLibraryItem
                      key={`lib-${get(ex, "id")}`}
                      exercise={ex}
                      onAdd={() =>
                        firstDay
                          ? onAddExerciseToDay(ex, get(firstDay, "id"))
                          : toast.error(t("components.workoutPlanBuilder.toasts.addDayFirst"))
                      }
                    />
                  );
                })
              )}
            </div>
          </div>

          {/* Toggle button */}
          <button
            type="button"
            aria-label={
              isSidebarOpen
                ? t("components.workoutPlanBuilder.desktop.closeLibrary")
                : t("components.workoutPlanBuilder.desktop.openLibrary")
            }
            onClick={onToggleSidebar}
            className="absolute right-[-24px] top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-6 h-12 bg-background border border-border/50 shadow-sm rounded-r-lg hover:bg-muted/50 transition-colors"
          >
            {isSidebarOpen ? (
              <ChevronLeftIcon className="size-4 text-muted-foreground" />
            ) : (
              <ChevronRightIcon className="size-4 text-muted-foreground" />
            )}
          </button>
        </div>

        {/* Main area: Kanban board */}
        <div className="flex-1 overflow-x-auto bg-muted/10 p-4 flex gap-6 scrollbar-none">
          <KanbanBoard className="flex gap-6 sm:grid-cols-none auto-rows-auto">
            {map(trainDayColumns, (col) => (
              <BuilderColumn
                key={get(col, "id")}
                col={col}
                onRemoveExercise={onRemoveExercise}
                onRemoveColumn={onRemoveDay}
                onUpdateDay={onUpdateDay}
                onUpdateExercise={onUpdateExercise}
                lockWeekDays={lockWeekDays}
              />
            ))}

            {!lockWeekDays ? (
              <Button
                className="w-72 sm:w-80 rounded-2xl border-dashed border-2 h-20 bg-transparent hover:bg-muted/30 text-muted-foreground hover:text-foreground hover:border-border/80 transition-all font-bold group shrink-0"
                variant="outline"
                onClick={onAddDay}
              >
                <PlusIcon className="size-5 mr-2 group-hover:scale-125 transition-transform" />
                {t("components.workoutPlanBuilder.desktop.addNewDay")}
              </Button>
            ) : null}
          </KanbanBoard>

          <KanbanOverlay>
            {({ value, variant }) => {
              if (variant === "column") {
                const col = find(trainDayColumns, (c) => get(c, "id") === value);
                return col ? (
                  <Card className="bg-primary text-primary-foreground p-3 rounded-xl shadow-2xl flex items-center gap-3 w-60 rotate-3 border-2 border-white/20">
                    <DumbbellIcon className="size-4" />
                    <span className="font-bold">{get(col, "name")}</span>
                  </Card>
                ) : null;
              }
              return (
                <Card className="bg-primary text-primary-foreground p-3 rounded-xl shadow-2xl flex items-center gap-3 w-60 rotate-3 border-2 border-white/20">
                  <span className="font-bold">{t("components.workoutPlanBuilder.desktop.moving")}</span>
                </Card>
              );
            }}
          </KanbanOverlay>
        </div>
      </Kanban>
    </div>
  );
});

export default BuilderDesktopView;
