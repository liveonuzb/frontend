import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { get } from "lodash";
import { useDraggable } from "@dnd-kit/core";
import { GripVerticalIcon, PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils.js";
import { Card } from "@/components/ui/card.jsx";
import { getWorkoutExerciseSummary } from "@/lib/workout-tracking";
import { getWorkoutCategoryLabel } from "./builder-utils.js";

const ExerciseLibraryItem = memo(({ exercise, onAdd }) => {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `lib-${get(exercise, "id")}`,
    data: { type: "LibraryExercise", exercise },
  });

  return (
    <Card
      ref={setNodeRef}
      onClick={onAdd}
      {...attributes}
      {...listeners}
      aria-label={t("components.workoutPlanBuilder.toasts.exerciseAdded", { name: get(exercise, "name") })}
      className={cn(
        "py-2 px-3",
        "group hover:border-primary/50 hover:shadow-md transition-all cursor-pointer flex items-center gap-2.5 relative overflow-hidden",
        isDragging && "opacity-30",
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-center gap-2 w-full relative z-10">
        <div className="p-1 -ml-1 text-muted-foreground opacity-30 hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
          <GripVerticalIcon className="size-4" />
        </div>
        <div className="size-9 rounded-xl bg-muted/50 flex items-center justify-center text-lg shrink-0 border border-border/40">
          <span>{get(exercise, "emoji", "🏋️")}</span>
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-[13px] font-black truncate text-foreground/90 group-hover:text-primary transition-colors">
            {get(exercise, "name")}
          </p>
          <p className="text-[9px] text-muted-foreground/80 uppercase font-black tracking-widest mt-0.5">
            {getWorkoutCategoryLabel(
              get(exercise, "groupLabel") || get(exercise, "category"),
              t,
            )}{" "}
            · {getWorkoutExerciseSummary(exercise, t)}
          </p>
        </div>
        <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <PlusIcon className="size-4 text-primary" />
        </div>
      </div>
    </Card>
  );
});

export default ExerciseLibraryItem;
