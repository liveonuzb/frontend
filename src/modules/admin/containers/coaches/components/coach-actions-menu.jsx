import React from "react";
import {
  CheckCircleIcon,
  EyeIcon,
  GlobeIcon,
  MoreVerticalIcon,
  ShieldBanIcon,
  ShieldCheckIcon,
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

const CoachActionsMenu = ({
  coach,
  canManage,
  isPending,
  onView,
  onStatusUpdate,
  onMarketplaceUpdate,
  onBlockToggle,
}) => {
  const coachId = coach.id;
  const coachStatus = coach.coachStatus;
  const mpStatus = coach.coachMarketplaceStatus;
  const isBlocked = coach.status === "banned";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Amallar">
          <MoreVerticalIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => onView(coach)}>
          <EyeIcon className="size-4" />
          Ko'rish
        </DropdownMenuItem>

        {coachStatus === "pending" && (
          <>
            <DropdownMenuItem
              disabled={isPending || !canManage}
              onClick={() => onStatusUpdate(coachId, "approved")}
            >
              <CheckCircleIcon className="size-4 text-green-500" />
              Tasdiqlash
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={isPending || !canManage}
              onClick={() => onStatusUpdate(coachId, "rejected")}
            >
              <XCircleIcon className="size-4 text-red-500" />
              Rad etish
            </DropdownMenuItem>
          </>
        )}

        {coachStatus === "approved" && (
          <>
            {mpStatus === "pending" ? (
              <>
                <DropdownMenuItem
                  disabled={isPending || !canManage}
                  onClick={() =>
                    onMarketplaceUpdate(
                      coachId,
                      "approved",
                      "Coach marketplacega chiqarildi",
                    )
                  }
                >
                  <CheckCircleIcon className="size-4 text-blue-500" />
                  Marketplacega chiqarish
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={isPending || !canManage}
                  onClick={() =>
                    onMarketplaceUpdate(
                      coachId,
                      "rejected",
                      "Marketplace arizasi rad etildi",
                    )
                  }
                >
                  <XCircleIcon className="size-4 text-red-500" />
                  Marketplace rad etish
                </DropdownMenuItem>
              </>
            ) : mpStatus === "approved" ? (
              <DropdownMenuItem
                disabled={isPending || !canManage}
                onClick={() =>
                  onMarketplaceUpdate(
                    coachId,
                    "none",
                    "Coach marketplacedan olib tashlandi",
                  )
                }
              >
                <XCircleIcon className="size-4 text-red-500" />
                Marketplacedan olish
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                disabled={isPending || !canManage}
                onClick={() =>
                  onMarketplaceUpdate(
                    coachId,
                    "approved",
                    "Coach marketplacega chiqarildi",
                  )
                }
              >
                <GlobeIcon className="size-4 text-blue-500" />
                Marketplacega chiqarish
              </DropdownMenuItem>
            )}
          </>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          disabled={isPending || !canManage}
          onClick={() => onBlockToggle(coach)}
        >
          {isBlocked ? (
            <ShieldCheckIcon className="size-4 text-green-500" />
          ) : (
            <ShieldBanIcon className="size-4 text-orange-500" />
          )}
          {isBlocked ? "Blokdan chiqarish" : "Bloklash"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CoachActionsMenu;
