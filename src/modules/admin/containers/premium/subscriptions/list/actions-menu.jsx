import React from "react";
import { BanIcon, MoreVerticalIcon, PlusCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { get } from "lodash";

const SubscriptionActionsMenu = ({ subscription, onExtend, onCancel }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon-sm" aria-label="Amallar">
        <MoreVerticalIcon className="size-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-56">
      <DropdownMenuItem onClick={() => onExtend(subscription)}>
        <PlusCircleIcon className="size-4 text-blue-600" />
        Muddati uzaytirish
      </DropdownMenuItem>
      {get(subscription, "status") === "ACTIVE" && (
        <DropdownMenuItem
          variant="destructive"
          onClick={() => onCancel(subscription)}
        >
          <BanIcon className="size-4" />
          Bekor qilish
        </DropdownMenuItem>
      )}
    </DropdownMenuContent>
  </DropdownMenu>
);

export default SubscriptionActionsMenu;
