import React from "react";
import {
  CalendarIcon,
  CheckCircleIcon,
  EyeIcon,
  GiftIcon,
  MoreVerticalIcon,
  PencilIcon,
  ShieldBanIcon,
  ShieldCheckIcon,
  TrashIcon,
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

const UserActionsMenu = ({
  user,
  isUserActionPending,
  canManageUser,
  canGiftPremium,
  onView,
  onEdit,
  onGift,
  onExtendPremium,
  onCancelPremium,
  onBanToggle,
  onDelete,
  onCoachStatusUpdate,
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon-sm" aria-label="Amallar">
      <MoreVerticalIcon className="size-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-56">
      <DropdownMenuItem onClick={() => onView(user)}>
        <EyeIcon className="size-4" />
        Ko'rish
      </DropdownMenuItem>

      {user.coachStatus === "pending" ? (
        <>
          <DropdownMenuItem
            disabled={isUserActionPending}
            onClick={() => onCoachStatusUpdate(user, "approved")}
          >
            <CheckCircleIcon className="size-4 text-green-500" />
            Coachni tasdiqlash
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={isUserActionPending}
            onClick={() => onCoachStatusUpdate(user, "rejected")}
          >
            <XCircleIcon className="size-4 text-red-500" />
            Coachni rad etish
          </DropdownMenuItem>
        </>
      ) : null}

      <DropdownMenuItem
        disabled={isUserActionPending || !canManageUser(user)}
        onClick={() => onEdit(user)}
      >
        <PencilIcon className="size-4" />
        Tahrirlash
      </DropdownMenuItem>
      <DropdownMenuItem
        disabled={isUserActionPending || !canGiftPremium(user)}
        onClick={() => onGift(user)}
      >
        <GiftIcon className="size-4 text-amber-500" />
        Premium sovg'a qilish
      </DropdownMenuItem>
      <DropdownMenuItem
        disabled={isUserActionPending || !user.premium?.id}
        onClick={() => onExtendPremium(user)}
      >
        <CalendarIcon className="size-4 text-blue-500" />
        Premium uzaytirish
      </DropdownMenuItem>
      <DropdownMenuItem
        disabled={isUserActionPending || user.premium?.status !== "active"}
        onClick={() => onCancelPremium(user)}
      >
        <ShieldBanIcon className="size-4 text-red-500" />
        Premiumni bekor qilish
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      <DropdownMenuItem
        disabled={isUserActionPending || !canManageUser(user)}
        onClick={() => onBanToggle(user)}
      >
        {user.status === "banned" ? (
          <ShieldCheckIcon className="size-4 text-green-500" />
        ) : (
          <ShieldBanIcon className="size-4 text-orange-500" />
        )}
        {user.status === "banned" ? "Blokdan chiqarish" : "Bloklash"}
      </DropdownMenuItem>
      <DropdownMenuItem
        variant="destructive"
        disabled={isUserActionPending || !canManageUser(user)}
        onClick={() => onDelete(user)}
      >
        <TrashIcon className="size-4" />
        O'chirish
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

export default UserActionsMenu;
