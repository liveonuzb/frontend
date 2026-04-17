import React from "react";
import {
  BanknoteIcon,
  CheckCircle2Icon,
  MoreVerticalIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PaymentActionsMenu = ({
  client,
  onPricing,
  onMarkPaid,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Amallar">
          <MoreVerticalIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => onPricing(client)}>
          <BanknoteIcon className="size-4" />
          Narxni belgilash
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onMarkPaid(client)}>
          <CheckCircle2Icon className="size-4 text-green-500" />
          To'langan deb belgilash
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PaymentActionsMenu;
