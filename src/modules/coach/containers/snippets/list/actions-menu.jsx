import React from "react";
import {
  MoreVerticalIcon,
  PencilIcon,
  RotateCcwIcon,
  ShieldIcon,
  Trash2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SnippetActionsMenu = ({ row, onEdit, onSoftDelete, onRestore, onHardDelete }) => {
  const snippet = row.original;
  const isTrashed = Boolean(snippet.deletedAt);
  const isDefault = Boolean(snippet.isDefault);

  if (isDefault) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Amallar">
            <MoreVerticalIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem disabled>
            <ShieldIcon className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">Standart shablon</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

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
            <DropdownMenuItem onClick={() => onRestore(snippet)}>
              <RotateCcwIcon className="size-4 text-emerald-600" />
              Tiklash
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onHardDelete({ ids: [snippet.id], label: snippet.title })}
            >
              <Trash2Icon className="size-4" />
              Butunlay o&apos;chirish
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem onClick={() => onEdit(snippet)}>
              <PencilIcon className="size-4" />
              Tahrirlash
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onSoftDelete(snippet)}
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

export default SnippetActionsMenu;
