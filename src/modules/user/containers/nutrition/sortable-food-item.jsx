import React, { memo } from "react";
import { GripVerticalIcon, FlameIcon, Trash2Icon } from "lucide-react";
import { cn } from "@/lib/utils";
import { KanbanItem, KanbanItemHandle } from "@/components/reui/kanban";

const SortableFoodItem = memo(
  ({ item, colId, onRemove, onEdit, calculateMacros }) => {
    const macros = calculateMacros(item, item.grams);

    return (
      <KanbanItem
        value={item.id}
        className={cn(
          "group bg-card/60 backdrop-blur-md border border-border/40 rounded-2xl p-3 shadow-sm hover:border-primary/40 hover:shadow-md hover:bg-card/90 transition-all relative flex flex-col sm:flex-row sm:items-center gap-3 cursor-pointer overflow-hidden",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        )}
        onClick={() => onEdit(item)}
      >
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-muted/20 to-transparent pointer-events-none" />
        <KanbanItemHandle className="p-1 -ml-1 text-muted-foreground opacity-30 hover:opacity-100 transition-opacity absolute left-1.5 top-1/2 -translate-y-1/2 z-20">
          <GripVerticalIcon className="size-4" />
        </KanbanItemHandle>

        <div className="size-12 rounded-xl bg-muted/40 flex items-center justify-center text-2xl shrink-0 overflow-hidden border border-border/40 shadow-inner ml-6 relative z-10 group-hover:bg-background transition-colors group-hover:scale-105">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              loading="lazy"
              width={48}
              height={48}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="drop-shadow-sm">{item.emoji}</span>
          )}
        </div>

        <div className="flex-1 min-w-0 pr-10 relative z-10">
          <p className="text-sm font-black truncate text-foreground/90 group-hover:text-primary transition-colors">
            {item.name}
          </p>
          <div className="flex flex-wrap items-center gap-2.5 mt-1.5 text-[10px] text-muted-foreground font-black tracking-widest uppercase">
            <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded-md border border-orange-500/10">
              <FlameIcon className="size-3 text-orange-500" /> {macros.cal}
            </span>
            <span className="bg-muted/50 px-1.5 py-0.5 rounded-md text-foreground/70">
              {item.grams}
              {item.unit || "g"}
            </span>
            <span className="opacity-30">|</span>
            <span className="flex items-center gap-2 opacity-90">
              <span className="flex items-center gap-1 text-red-500/90">
                <span className="size-1.5 rounded-full bg-red-500" />{" "}
                {macros.protein}g
              </span>
              <span className="flex items-center gap-1 text-amber-500/90">
                <span className="size-1.5 rounded-full bg-amber-500" />{" "}
                {macros.carbs}g
              </span>
              <span className="flex items-center gap-1 text-emerald-500/90">
                <span className="size-1.5 rounded-full bg-emerald-500" />{" "}
                {macros.fat}g
              </span>
            </span>
          </div>
        </div>

        <button
          type="button"
          aria-label={`${item.name} ni o'chirish`}
          onClick={(e) => {
            e.stopPropagation();
            onRemove(colId, item.id);
          }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 size-8 rounded-full flex items-center justify-center bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all shrink-0 z-20 border border-destructive/20 hover:bg-destructive hover:text-destructive-foreground active:scale-95"
        >
          <Trash2Icon className="size-3.5" />
        </button>
      </KanbanItem>
    );
  },
);

export default SortableFoodItem;
