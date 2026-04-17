import React, { useMemo, useState } from "react";
import { reduce, map } from "lodash";
import {
  ChevronDownIcon,
  PencilIcon,
  Trash2Icon,
  PlusIcon,
  FlameIcon,
} from "lucide-react";
import { cn } from "@/lib/utils.js";
import { Card } from "@/components/ui/card.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog.jsx";

const MobileAccordionColumn = ({
  col,
  defaultOpen,
  calculateMacros,
  onAddFood,
  onRemoveFood,
  onEditFood,
  onUpdateColumn,
  onRemoveColumn,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
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
    <Card className="rounded-2xl overflow-hidden border-border/40 shadow-sm">
      {/* Accordion Header */}
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/30 transition-colors"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <div className="flex items-center gap-2.5">
          <div className="size-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/20">
            <div className="size-2 rounded-full bg-primary" />
          </div>
          <div className="text-left">
            <p className="font-black text-sm uppercase tracking-wider text-foreground/90">
              {col.type}
            </p>
            <p className="text-[10px] text-muted-foreground font-bold mt-0.5">
              {col.time}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {columnSummary.cal > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-black text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-lg border border-orange-500/10">
              <FlameIcon className="size-3 text-orange-500" />
              {columnSummary.cal}
            </span>
          )}
          <Badge
            variant="secondary"
            className="h-5 px-2 text-[10px] font-black bg-primary/10 text-primary border border-primary/20"
          >
            {col.items.length}
          </Badge>
          <ChevronDownIcon
            className={cn(
              "size-4 text-muted-foreground transition-transform duration-200 ml-1",
              isOpen && "rotate-180",
            )}
          />
        </div>
      </button>

      {/* Accordion Body */}
      {isOpen && (
        <div className="border-t border-border/30 px-3 pb-3 space-y-2">
          {col.items.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-3">
              <Badge variant="secondary">{columnSummary.protein}g oqsil</Badge>
              <Badge variant="secondary">{columnSummary.carbs}g uglevod</Badge>
              <Badge variant="secondary">{columnSummary.fat}g yog'</Badge>
            </div>
          ) : null}

          {/* Action bar */}
          <div className="flex items-center gap-1 pt-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setTempTime(col.time || "");
                setIsTimeEditOpen(true);
              }}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors font-bold px-2 py-1.5 rounded-lg hover:bg-primary/10"
            >
              <PencilIcon className="size-3" />
              Vaqt
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveColumn(col.id);
              }}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive transition-colors font-bold px-2 py-1.5 rounded-lg hover:bg-destructive/10 ml-auto"
            >
              <Trash2Icon className="size-3" />
              O'chirish
            </button>
          </div>

          {/* Empty state */}
          {col.items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-6 text-muted-foreground/40">
              <PlusIcon className="size-7 mb-1.5" />
              <p className="text-xs font-bold">Hali ovqat qo'shilmagan</p>
            </div>
          )}

          {/* Food items */}
          {map(col.items, (item) => {
            const macros = calculateMacros(item, item.grams);
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 bg-muted/30 rounded-xl p-2.5 border border-border/30"
              >
                <div className="size-11 rounded-xl bg-muted/60 flex items-center justify-center text-xl shrink-0 overflow-hidden border border-border/30">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      loading="lazy"
                      width={44}
                      height={44}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{item.emoji}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black truncate text-foreground/90">
                    {item.name}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] font-bold">
                    <span className="flex items-center gap-0.5 text-orange-600 dark:text-orange-400">
                      <FlameIcon className="size-2.5 text-orange-500" />{" "}
                      {macros.cal}
                    </span>
                    <span className="text-muted-foreground">
                      {item.grams}
                      {item.unit || "g"}
                    </span>
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <span className="flex items-center gap-0.5 text-red-500/80">
                        <span className="size-1.5 rounded-full bg-red-500" />{" "}
                        {macros.protein}g
                      </span>
                      <span className="flex items-center gap-0.5 text-amber-500/80">
                        <span className="size-1.5 rounded-full bg-amber-500" />{" "}
                        {macros.carbs}g
                      </span>
                      <span className="flex items-center gap-0.5 text-emerald-500/80">
                        <span className="size-1.5 rounded-full bg-emerald-500" />{" "}
                        {macros.fat}g
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onEditFood(item)}
                    className="size-8 flex items-center justify-center rounded-lg hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors"
                    aria-label={`${item.name} ni tahrirlash`}
                  >
                    <PencilIcon className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveFood(col.id, item.id)}
                    className="size-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
                    aria-label={`${item.name} ni o'chirish`}
                  >
                    <Trash2Icon className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Add food button */}
          <Button
            variant="outline"
            className="w-full rounded-xl border-dashed border-border/60 text-muted-foreground hover:text-foreground font-bold text-sm h-10"
            onClick={() => onAddFood(col.id)}
          >
            <PlusIcon className="size-4 mr-2" />
            Ovqat qo'shish
          </Button>
        </div>
      )}

      {/* Time edit dialog */}
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
                onUpdateColumn(col.id, { time: tempTime });
                setIsTimeEditOpen(false);
              }}
            >
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default MobileAccordionColumn;
