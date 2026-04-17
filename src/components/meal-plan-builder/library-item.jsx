import React, { memo } from "react";
import { useDraggable } from "@dnd-kit/core";
import { GripVerticalIcon, FlameIcon } from "lucide-react";
import { cn } from "@/lib/utils.js";
import { Card } from "@/components/ui/card.jsx";

const LibraryItem = memo(({ food, onAdd }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: food.id,
    data: {
      type: "LibraryItem",
      food,
    },
  });

  return (
    <Card
      ref={setNodeRef}
      onClick={onAdd}
      {...attributes}
      {...listeners}
      aria-label={`${food.name} ni rejaga qo'shish`}
      className={cn(
        "py-2 px-4",
        "group hover:border-primary/50 hover:shadow-md transition-all cursor-pointer flex items-center gap-3 relative overflow-hidden",
        isDragging && "opacity-30",
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-center gap-2.5 w-full relative z-10">
        <div className="p-1 -ml-1 text-muted-foreground opacity-30 hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
          <GripVerticalIcon className="size-4" />
        </div>

        <div className="size-11 rounded-xl bg-muted/50 flex items-center justify-center text-2xl shrink-0 overflow-hidden border border-border/40 shadow-inner group-hover:bg-background transition-colors">
          {food.image ? (
            <img
              src={food.image}
              alt={food.name}
              loading="lazy"
              width={44}
              height={44}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <span className="drop-shadow-sm">{food.emoji}</span>
          )}
        </div>

        <div className="flex-1 min-w-0 pr-14 text-left">
          <p className="text-[13px] font-black truncate text-foreground/90 group-hover:text-primary transition-colors">
            {food.name}
          </p>
          <p className="text-[9px] text-muted-foreground/80 uppercase font-black tracking-widest mt-0.5">
            {food.brand || "Tabiiy"}
          </p>
        </div>

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] font-black text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-1 rounded-lg shrink-0 border border-orange-500/10">
          <FlameIcon className="size-3 text-orange-500" /> {food.cal}
        </div>
      </div>
    </Card>
  );
});

export default LibraryItem;
