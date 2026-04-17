import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { map, get, size } from "lodash";
import {
  KanbanColumn,
  KanbanColumnContent,
  KanbanColumnHandle,
} from "@/components/reui/kanban.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Card } from "@/components/ui/card.jsx";
import { Input } from "@/components/ui/input.jsx";
import { cn } from "@/lib/utils.js";
import {
  DumbbellIcon,
  Edit3Icon,
  GripVerticalIcon,
  Trash2Icon,
} from "lucide-react";
import SortableExerciseItem from "./sortable-exercise-item.jsx";

const BuilderColumn = memo(
  ({
    col,
    onRemoveExercise,
    onRemoveColumn,
    onUpdateDay,
    onUpdateExercise,
    lockWeekDays = false,
  }) => {
    const { t } = useTranslation();
    const items = get(col, "items", []);

    return (
      <KanbanColumn
        value={get(col, "id")}
        className="relative flex w-72 shrink-0 flex-col gap-4 sm:w-80"
      >
        <Card
          className={cn(
            "relative flex-1 min-h-[400px] space-y-3 rounded-2xl border-border/40 bg-card/60 p-3 shadow-sm ring-1 ring-inset ring-transparent backdrop-blur-xl transition-all duration-300",
            "hover:border-primary/30 hover:bg-card/80 hover:shadow-md hover:ring-primary/10",
          )}
        >
          <div className="absolute inset-x-0 top-0 h-1.5 rounded-t-2xl bg-gradient-to-r from-primary/30 via-primary/10 to-transparent opacity-50" />

          <div className="group/header relative z-10 flex flex-col gap-2 rounded-xl border border-transparent px-2 py-2 transition-all duration-300 hover:border-border/50 hover:bg-muted/40">
            <div className="flex w-full items-center justify-between">
              <div className="flex min-w-0 flex-1 items-center gap-1.5">
                {!lockWeekDays ? (
                  <KanbanColumnHandle className="-ml-1 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                    <GripVerticalIcon className="size-4" />
                  </KanbanColumnHandle>
                ) : null}

                <div className="flex size-5 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/20 shadow-inner">
                  <div className="size-2 rounded-full bg-primary" />
                </div>

                {lockWeekDays ? (
                  <div className="min-w-0 flex-1">
                    <p className="truncate px-1 text-sm font-black uppercase tracking-widest">
                      {get(col, "name")}
                    </p>
                  </div>
                ) : (
                  <Input
                    value={get(col, "name")}
                    onChange={(e) => onUpdateDay(get(col, "id"), { name: e.target.value })}
                    placeholder={t("components.workoutPlanBuilder.column.dayNamePlaceholder")}
                    className="h-7 rounded-lg border-transparent bg-transparent px-1 text-sm font-black uppercase tracking-widest placeholder:text-muted-foreground/50 focus:border-border focus:bg-background"
                  />
                )}
              </div>

              <div className="flex items-center gap-1">
                <Badge
                  variant="secondary"
                  className="h-5 shrink-0 border border-primary/20 bg-primary/10 px-2 text-[10px] font-black text-primary transition-colors group-hover/header:bg-primary group-hover/header:text-primary-foreground"
                >
                  {size(items)}
                </Badge>
                {!lockWeekDays ? (
                  <button
                    type="button"
                    aria-label={t("components.workoutPlanBuilder.column.deleteDayLabel", { name: get(col, "name") })}
                    onClick={() => onRemoveColumn(get(col, "id"))}
                    className="ml-1 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2Icon className="size-3.5" />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="group relative">
              <Edit3Icon className="absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              <Input
                value={get(col, "focus", "")}
                onChange={(e) => onUpdateDay(get(col, "id"), { focus: e.target.value })}
                placeholder={t("components.workoutPlanBuilder.column.focusPlaceholder")}
                className="h-7 rounded-lg border-transparent bg-transparent px-2 text-[11px] placeholder:text-muted-foreground/50 transition-all focus:border-border focus:bg-background group-hover:pl-7"
              />
            </div>
          </div>

          <div className="relative">
            <KanbanColumnContent value={get(col, "id")}>
              {map(items, (item) => (
                <SortableExerciseItem
                  key={get(item, "id")}
                  item={item}
                  colId={get(col, "id")}
                  onRemove={onRemoveExercise}
                  onUpdate={onUpdateExercise}
                />
              ))}
            </KanbanColumnContent>

            {size(items) === 0 ? (
              <div className="pointer-events-none absolute inset-0 flex min-h-48 flex-col items-center justify-center py-10 text-muted-foreground opacity-30">
                <DumbbellIcon className="mb-2 size-8" />
                <p className="text-center text-xs font-bold">
                  {t("components.workoutPlanBuilder.column.dragDrop")}
                </p>
              </div>
            ) : null}
          </div>
        </Card>
      </KanbanColumn>
    );
  },
);

export default BuilderColumn;
