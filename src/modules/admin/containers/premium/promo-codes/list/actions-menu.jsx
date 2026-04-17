import React from "react";
import { get } from "lodash";
import {
  MoreVerticalIcon,
  PencilIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
  Trash2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ActionsMenu = ({ promoCode, onEdit, onToggleActive, onDelete }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon-sm" aria-label="Amallar">
        <MoreVerticalIcon className="size-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-56">
      <DropdownMenuItem onClick={() => onEdit(promoCode)}>
        <PencilIcon className="size-4" />
        Tahrirlash
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onToggleActive(promoCode)}>
        {get(promoCode, "isActive") ? (
          <>
            <ToggleLeftIcon className="size-4" />
            Nofaol qilish
          </>
        ) : (
          <>
            <ToggleRightIcon className="size-4" />
            Faol qilish
          </>
        )}
      </DropdownMenuItem>
      <DropdownMenuItem
        variant="destructive"
        onClick={() => onDelete(promoCode)}
      >
        <Trash2Icon className="size-4" />
        O'chirish
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

export default ActionsMenu;
