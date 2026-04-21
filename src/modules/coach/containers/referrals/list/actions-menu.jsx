import {
  BanIcon,
  CopyIcon,
  MoreHorizontalIcon,
  RefreshCwIcon,
} from "lucide-react";
import { get } from "lodash";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ReferralActionsMenu = ({ referral, onCopyLink, onResend, onCancel }) => {
  const isCancelled = get(referral, "status") === "CANCELLED";

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8">
            <MoreHorizontalIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onCopyLink(referral)}>
            <CopyIcon className="mr-2 size-4" />
            Havolani nusxalash
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onResend(referral)}>
            <RefreshCwIcon className="mr-2 size-4" />
            Qayta yuborish
          </DropdownMenuItem>
          {!isCancelled ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onCancel(referral)}
              >
                <BanIcon className="mr-2 size-4" />
                Bekor qilish
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ReferralActionsMenu;
