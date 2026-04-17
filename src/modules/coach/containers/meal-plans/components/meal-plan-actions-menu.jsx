import React from "react";
import {
  CopyIcon,
  HistoryIcon,
  MoreVerticalIcon,
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
  UtensilsCrossedIcon,
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
  onAssign,
  onVersions,
  onDuplicate,
  onDelete,
  isDeleting,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Amallar">
          <MoreVerticalIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => onEdit(plan)}>
          <PencilIcon className="size-4" />
          Tahrirlash
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(plan)}>
          <UtensilsCrossedIcon className="size-4" />
          Plan tarkibi
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAssign(plan)}>
          <UserPlusIcon className="size-4" />
          Mijozlarga biriktirish
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onVersions(plan)}>
          <HistoryIcon className="size-4" />
          Versionlar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDuplicate(plan.id)}>
          <CopyIcon className="size-4" />
          Nusxalash
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          disabled={isDeleting}
          onClick={() => onDelete(plan)}
        >
          <TrashIcon className="size-4" />
          O'chirish
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default MealPlanActionsMenu;
