import React from "react";
import {
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MealPlanActionsMenu = ({
  plan,
  onEdit,
  onSoftDelete,
  onRestore,
  onHardDelete,
}) => {
  const isTrashed = Boolean(plan.deletedAt);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Amallar">
          <MoreVerticalIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {isTrashed ? (
          <>
            <DropdownMenuItem onClick={() => onRestore(plan)}>
              <RotateCcwIcon className="size-4" />
              Tiklash
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onHardDelete({ ids: [plan.id], label: plan.title })}
            >
              <Trash2Icon className="size-4" />
              Butunlay o&apos;chirish
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem onClick={() => onEdit(plan)}>
              <PencilIcon className="size-4" />
              Tahrirlash
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onSoftDelete(plan)}
            >
              <Trash2Icon className="size-4" />
              Trashga yuborish
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default MealPlanActionsMenu;
