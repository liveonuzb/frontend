import React from "react";
import { Globe2Icon, MoreVerticalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ChallengeActionsMenu = ({
  challenge,
  onEdit,
  onDelete,
  onTranslations,
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon-sm" aria-label="Amallar">
        <MoreVerticalIcon className="size-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-56">
      <DropdownMenuItem onClick={() => onTranslations(challenge)}>
        <Globe2Icon className="size-4" />
        Tarjimalar
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onEdit(challenge)}>
        <PencilIcon className="size-4" />
        Tahrirlash
      </DropdownMenuItem>
      <DropdownMenuItem
        variant="destructive"
        onClick={() => onDelete(challenge)}
      >
        <Trash2Icon className="size-4" />
        O'chirish
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

export default ChallengeActionsMenu;
