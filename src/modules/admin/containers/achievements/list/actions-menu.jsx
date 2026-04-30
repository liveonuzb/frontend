import React from "react";
import {
  ImageIcon,
  LanguagesIcon,
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

const AchievementActionsMenu = ({
  item,
  onEdit,
  onDelete,
  onImages,
  onTranslate,
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon-sm" aria-label="Amallar">
        <MoreVerticalIcon className="size-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-48">
      <DropdownMenuItem onClick={() => onImages(item)}>
        <ImageIcon className="size-4" />
        Rasmlar
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onTranslate(item)}>
        <LanguagesIcon className="size-4" />
        Tarjimalar
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onEdit(item)}>
        <PencilIcon className="size-4" />
        Tahrirlash
      </DropdownMenuItem>
      <DropdownMenuItem variant="destructive" onClick={() => onDelete(item)}>
        <Trash2Icon className="size-4" />
        O'chirish
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

export default AchievementActionsMenu;
