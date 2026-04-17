import React from "react";
import {
  GlobeIcon,
  MoreVerticalIcon,
  PencilIcon,
  RotateCcwIcon,
  Trash2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const WorkoutActionsMenu = ({
  workout,
  onEdit,
  onDelete,
  onRestore,
  onHardDelete,
  onTranslations,
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon-sm" aria-label="Amallar">
        <MoreVerticalIcon className="size-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-56">
      {workout.isTrashed ? (
        <>
          <DropdownMenuItem onClick={() => onRestore(workout)}>
            <RotateCcwIcon className="size-4 text-emerald-600" />
            Tiklash
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() =>
              onHardDelete({
                ids: [workout.id],
                label: workout.name,
              })
            }
          >
            <Trash2Icon className="size-4" />
            Butunlay o'chirish
          </DropdownMenuItem>
        </>
      ) : (
        <>
          <DropdownMenuItem onClick={() => onTranslations(workout)}>
            <GlobeIcon className="size-4" />
            Tarjimalar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEdit(workout)}>
            <PencilIcon className="size-4" />
            Tahrirlash
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => onDelete(workout)}
          >
            <Trash2Icon className="size-4" />
            O'chirish
          </DropdownMenuItem>
        </>
      )}
    </DropdownMenuContent>
  </DropdownMenu>
);

export default WorkoutActionsMenu;
