import React from "react";
import { get } from "lodash";
import {
  CalendarPlusIcon,
  EyeIcon,
  MoreVerticalIcon,
  RotateCcwIcon,
  Trash2Icon,
  WalletCardsIcon,
  XCircleIcon,
  DumbbellIcon,
  UtensilsIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ClientActionsMenu = ({
  client,
  onView,
  onPayment,
  onPaymentDay,
  onCancelPayment,
  onRemove,
  onResendInvite,
  onCancelInvitation,
  isInviting,
  isCancellingPayment,
  isRemoving,
  isCancellingInvitation,
  onAssignPlan,
}) => {
  const isClient = get(client, "entityType") === "client";
  const isInvitation = get(client, "entityType") === "invitation";
  const status = get(client, "status");
  const isPending = status === "pending";
  const isDeclined = status === "declined";
  const isInactive = status === "inactive";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Amallar">
          <MoreVerticalIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* Common View Action */}
        <DropdownMenuItem onClick={() => onView(client)}>
          <EyeIcon className="size-4" />
          Ko'rish
        </DropdownMenuItem>

        {isClient && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onPayment(client)}>
              <WalletCardsIcon className="size-4" />
              To'lov qo'shish
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPaymentDay(client)}>
              <CalendarPlusIcon className="size-4" />
              To'lov kunini belgilash
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={
                !get(client, "latestPayment") ||
                get(client, "latestPayment.status") === "cancelled" ||
                isCancellingPayment
              }
              onClick={() => onCancelPayment(client)}
            >
              <XCircleIcon className="size-4 text-amber-600" />
              Oxirgi to'lovni bekor qilish
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onAssignPlan(client, "workout")}>
              <DumbbellIcon className="size-4" />
              Mashg&apos;ulot rejasi
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAssignPlan(client, "meal")}>
              <UtensilsIcon className="size-4" />
              Ovqatlanish rejasi
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              disabled={isRemoving}
              onClick={() => onRemove(client)}
            >
              <Trash2Icon className="size-4" />
              Mijozni o'chirish
            </DropdownMenuItem>
          </>
        )}

        {(isDeclined || isInactive) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={isInviting}
              onClick={() => onResendInvite(client)}
            >
              <RotateCcwIcon className="size-4" />
              Qayta taklif yuborish
            </DropdownMenuItem>
          </>
        )}

        {isInvitation && isPending && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              disabled={isCancellingInvitation}
              onClick={() => onCancelInvitation(get(client, "invitationId"))}
            >
              <Trash2Icon className="size-4" />
              Taklifni bekor qilish
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ClientActionsMenu;
