import React from "react";
import {
  CheckCircleIcon,
  EyeIcon,
  GlobeIcon,
  MoreVerticalIcon,
  XCircleIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const CoachActionsMenu = ({
  coach,
  isPending,
  onView,
  onStatusUpdate,
  onMarketplaceUpdate,
}) => {
  const coachId = coach.id;
  const coachStatus = coach.coachStatus;
  const mpStatus = coach.coachMarketplaceStatus;

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
              disabled={isPending}
              onClick={() => onStatusUpdate(coachId, "approved")}
            >
              <CheckCircleIcon className="size-4 text-green-500" />
              Tasdiqlash
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={isPending}
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
                  disabled={isPending}
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
                  disabled={isPending}
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
                disabled={isPending}
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
                disabled={isPending}
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CoachActionsMenu;
