import React, { useState, useMemo, memo } from "react";
import { reduce, map } from "lodash";
import {
  KanbanColumn,
  KanbanColumnHandle,
  KanbanColumnContent,
} from "@/components/reui/kanban.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Button } from "@/components/ui/button.jsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog.jsx";
import {
  GripVerticalIcon,
  Trash2Icon,
  PencilIcon,
  PlusIcon,
  FlameIcon,
} from "lucide-react";
import { cn } from "@/lib/utils.js";
import SortableFoodItem from "../../modules/user/containers/nutrition/sortable-food-item.jsx";
import { Card } from "@/components/ui/card.jsx";

const BuilderColumn = memo(
  ({
    col,
    onRemoveFood,
    onEditFood,
    calculateMacros,
    updateColumn,
    removeColumn,
  }) => {
    const [isTimeEditOpen, setIsTimeEditOpen] = useState(false);
    const [tempTime, setTempTime] = useState("");
    const columnSummary = useMemo(
      () =>
        reduce(
          col.items,
          (acc, item) => {
            const macros = calculateMacros(item, item.grams);
            return {
              cal: acc.cal + (macros.cal || 0),
              protein: acc.protein + (macros.protein || 0),
              carbs: acc.carbs + (macros.carbs || 0),
              fat: acc.fat + (macros.fat || 0),
            };
          },
          { cal: 0, protein: 0, carbs: 0, fat: 0 },
        ),
      [calculateMacros, col.items],
    );

    return (
      <KanbanColumn
        value={col.id}
        className="w-72 sm:w-96 shrink-0 flex flex-col gap-4 relative"
      >
        <Card
          className={cn(
            "flex-1 bg-card/60 backdrop-blur-xl rounded-2xl p-3 space-y-3 transition-all duration-300 relative border-border/40 shadow-sm",
            "hover:bg-card/80 hover:border-primary/30 hover:shadow-md min-h-[400px] ring-1 ring-inset ring-transparent hover:ring-primary/10",
          )}
        >
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary/30 via-primary/10 to-transparent rounded-t-2xl opacity-50" />
          <div className="flex items-center justify-between px-2 py-2 hover:bg-muted/40 rounded-xl transition-all duration-300 border border-transparent hover:border-border/50 relative z-10 group/header">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <KanbanColumnHandle className="p-1 -ml-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground">
                <GripVerticalIcon className="size-4" />
              </KanbanColumnHandle>
              <div className="size-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/20 shadow-inner">
                <div className="size-2 rounded-full bg-primary" />
              </div>
              <h3
                className="font-black text-sm uppercase tracking-widest truncate cursor-pointer text-foreground/90 transition-colors"
                onDoubleClick={() => {
                  const newType = window.prompt(
                    "Vaqt nomini o'zgartirish:",
                    col.type,
                  );
                  if (newType) updateColumn(col.id, { type: newType });
                }}
                title="O'zgartirish uchun ikki marta bosing"
              >
                {col.type}
              </h3>
              <Badge
                variant="secondary"
                className="h-5 px-2 text-[10px] font-black shrink-0 bg-primary/10 text-primary border border-primary/20 group-hover/header:bg-primary group-hover/header:text-primary-foreground transition-colors"
                title={`${col.items.length} ta ovqat`}
              >
                {col.items.length}
              </Badge>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs font-black tracking-widest uppercase text-muted-foreground/70 mr-1 bg-muted/50 px-2 py-0.5 rounded-md border border-border/50">
                {col.time || "No Time"}
              </span>
              <button
                type="button"
                aria-label={`${col.type} vaqtini o'zgartirish`}
                onClick={() => {
                  setTempTime(col.time || "");
                  setIsTimeEditOpen(true);
                }}
                className="p-1.5 hover:text-primary hover:bg-primary/10 rounded-lg transition-all active:scale-95 text-muted-foreground"
                title="Vaqtni o'zgartirish"
              >
                <PencilIcon className="size-3.5" />
              </button>

              {/* Har qanday Mahal o'chirilishi mumkin */}
              <button
                type="button"
                aria-label={`${col.type} bo'limini o'chirish`}
                onClick={() => removeColumn(col.id)}
                className="p-1.5 hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors text-muted-foreground"
                title="O'chirish"
              >
                <Trash2Icon className="size-3.5" />
              </button>
            </div>
          </div>

          {col.items.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 px-2">
              <Badge variant="secondary" className="gap-1.5">
                <FlameIcon className="size-3.5 text-orange-500" />
                {columnSummary.cal} kcal
              </Badge>
              <Badge variant="secondary">{columnSummary.protein}g oqsil</Badge>
              <Badge variant="secondary">{columnSummary.carbs}g uglevod</Badge>
              <Badge variant="secondary">{columnSummary.fat}g yog'</Badge>
            </div>
          ) : null}

          <Dialog open={isTimeEditOpen} onOpenChange={setIsTimeEditOpen}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Vaqtni o'zgartirish ({col.type})</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <Input
                  value={tempTime}
                  onChange={(e) => setTempTime(e.target.value)}
                  placeholder="Masalan: 08:00-09:00"
                  className="text-center font-bold tracking-wider"
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsTimeEditOpen(false)}
                >
                  Bekor qilish
                </Button>
                <Button
                  onClick={() => {
                    updateColumn(col.id, { time: tempTime });
                    setIsTimeEditOpen(false);
                  }}
                >
                  Saqlash
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div>
            <KanbanColumnContent value={col.id}>
              {map(col.items, (item) => (
                <SortableFoodItem
                  key={item.id}
                  item={item}
                  colId={col.id}
                  onRemove={onRemoveFood}
                  onEdit={onEditFood}
                  calculateMacros={calculateMacros}
                />
              ))}
            </KanbanColumnContent>

            {col.items.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground py-10 opacity-30 pointer-events-none">
                <PlusIcon className="size-8 mb-2" />
                <p className="text-xs font-bold text-center">
                  Ovqatni bu yerga sudrab tashlang
                </p>
              </div>
            )}
          </div>
        </Card>
      </KanbanColumn>
    );
  },
);

export default BuilderColumn;
