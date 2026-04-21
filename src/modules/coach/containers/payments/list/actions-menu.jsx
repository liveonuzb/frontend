import React from "react";
import {
  BanknoteIcon,
  MoreVerticalIcon,
  PencilIcon,
  RotateCcwIcon,
  Trash2Icon,
  XCircleIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ActionsMenu = ({
  payment,
  onEdit,
  onCancel,
  onRefund,
  onSoftDelete,
  onRestore,
  onHardDelete,
}) => {
  const isTrashed = Boolean(payment.deletedAt);

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
            <DropdownMenuItem onClick={() => onRestore(payment)}>
              <RotateCcwIcon className="size-4 text-emerald-600" />
              Tiklash
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onHardDelete({ ids: [payment.id] })}
            >
              <Trash2Icon className="size-4" />
              Butunlay o&apos;chirish
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem onClick={() => onEdit(payment)}>
              <PencilIcon className="size-4" />
              Tahrirlash
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCancel(payment)}>
              <XCircleIcon className="size-4 text-destructive" />
              Bekor qilish
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRefund(payment)}>
              <BanknoteIcon className="size-4 text-orange-600" />
              Qaytarish
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onSoftDelete(payment)}
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

export default ActionsMenu;
