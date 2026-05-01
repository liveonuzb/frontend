import {
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

const ActionsMenu = ({ row, canManage, onEdit, onTranslate, onDelete }) => {
  if (!canManage) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Amallar">
          <MoreVerticalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onTranslate(row)}>
          <GlobeIcon />
          Tarjimalar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(row)}>
          <PencilIcon />
          Tahrirlash
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(row)}>
          <Trash2Icon />
          O'chirish
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ActionsMenu;
