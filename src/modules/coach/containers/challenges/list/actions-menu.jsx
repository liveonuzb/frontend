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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ActionsMenu = ({
  challenge,
  onEdit,
  onSoftDelete,
  onRestore,
  onHardDelete,
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon-sm" aria-label="Amallar">
        <MoreVerticalIcon className="size-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-52">
      {challenge.deletedAt ? (
        <>
          <DropdownMenuItem onClick={() => onRestore(challenge)}>
            <RotateCcwIcon className="size-4 text-emerald-600" />
            Tiklash
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() =>
              onHardDelete({ ids: [challenge.id], label: challenge.title })
            }
          >
            <Trash2Icon className="size-4" />
            Butunlay o&apos;chirish
          </DropdownMenuItem>
        </>
      ) : (
        <>
          <DropdownMenuItem onClick={() => onEdit(challenge)}>
            <PencilIcon className="size-4" />
            Tahrirlash
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => onSoftDelete(challenge)}
          >
            <Trash2Icon className="size-4" />
            Trashga yuborish
          </DropdownMenuItem>
        </>
      )}
    </DropdownMenuContent>
  </DropdownMenu>
);

export default ActionsMenu;
