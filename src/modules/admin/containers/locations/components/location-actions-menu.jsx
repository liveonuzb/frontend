import React from "react";
import {
  GitBranchPlusIcon,
  GlobeIcon,
  MoreVerticalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LocationActionsMenu = ({
  location,
  nextType,
  onAddChild,
  onDelete,
  onEdit,
  onTranslations,
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon-sm" aria-label="Amallar">
        <MoreVerticalIcon className="size-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-56">
      <DropdownMenuItem onClick={() => onTranslations(location)}>
        <GlobeIcon className="size-4" />
        Tarjimalar
      </DropdownMenuItem>
      {nextType ? (
        <DropdownMenuItem onClick={() => onAddChild(location)}>
          <GitBranchPlusIcon className="size-4" />
          Child qo&apos;shish
        </DropdownMenuItem>
      ) : null}
      <DropdownMenuItem onClick={() => onEdit(location)}>
        <PencilIcon className="size-4" />
        Tahrirlash
      </DropdownMenuItem>
      <DropdownMenuItem variant="destructive" onClick={() => onDelete(location)}>
        <Trash2Icon className="size-4" />
        O&apos;chirish
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

export default LocationActionsMenu;
