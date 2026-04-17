import React from "react";
import { get, isArray, trim } from "lodash";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import CoachActionsMenu from "./actions-menu.jsx";

const coachStatusConfig = {
  approved: {
    label: "Tasdiqlangan",
    icon: "CheckCircleIcon",
    className:
      "bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
  },
  pending: {
    label: "Kutilmoqda",
    icon: "ClockIcon",
    className:
      "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
  },
  rejected: {
    label: "Rad etilgan",
    icon: "XCircleIcon",
    className:
      "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
  },
};

const marketplaceStatusConfig = {
  approved: {
    label: "Marketplaceda",
    className:
      "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  },
  pending: {
    label: "Review kutilmoqda",
    className:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  },
  rejected: {
    label: "Marketplace rad etilgan",
    className:
      "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
  },
  none: {
    label: "Marketplaceda emas",
    className:
      "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  },
};

export { coachStatusConfig, marketplaceStatusConfig };

const getCoachFirstName = (coach) =>
  get(coach, "firstName", get(coach, "profile.firstName", ""));
const getCoachLastName = (coach) =>
  get(coach, "lastName", get(coach, "profile.lastName", ""));
const getCoachAvatar = (coach) =>
  get(coach, "avatar", get(coach, "profile.avatarUrl", null));

export {
  getCoachFirstName,
  getCoachLastName,
  getCoachAvatar,
};

const getCoachBio = (coach) =>
  get(coach, "bio", get(coach, "coachBio", get(coach, "profile.bio", "")));
const getCoachSpecializations = (coach) =>
  isArray(get(coach, "coachSpecializations"))
    ? get(coach, "coachSpecializations")
    : isArray(get(coach, "profile.specializations"))
      ? get(coach, "profile.specializations")
      : [];

export { getCoachBio, getCoachSpecializations };

export const useColumns = ({
  isCoachActionPending,
  onView,
  onStatusUpdate,
  onMarketplaceUpdate,
}) => {
  return React.useMemo(
    () => [
      {
        accessorKey: "firstName",
        header: "Murabbiy",
        cell: (info) => {
          const coach = get(info, "row.original");
          const firstName = getCoachFirstName(coach);
          const lastName = getCoachLastName(coach);
          return (
            <div className="flex items-center gap-3">
              <Avatar className="size-9 border border-border/50">
                <AvatarImage src={getCoachAvatar(coach)} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {get(firstName, "[0]")}
                  {get(lastName, "[0]")}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-semibold text-sm leading-none mb-1">
                  {trim(`${firstName} ${lastName}`) || "Murabbiy"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {get(coach, "email")}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "coachStatus",
        header: "Status",
        cell: (info) => {
          const status = info.getValue() || "pending";
          const config = get(
            coachStatusConfig,
            status,
            coachStatusConfig.pending,
          );
          return (
            <Badge
              variant="outline"
              className={cn("gap-1 font-medium", get(config, "className"))}
            >
              {get(config, "label")}
            </Badge>
          );
        },
      },
      {
        accessorKey: "coachMarketplaceStatus",
        header: "Marketplace",
        cell: (info) => {
          const status = info.getValue() || "none";
          const config = get(
            marketplaceStatusConfig,
            status,
            marketplaceStatusConfig.none,
          );
          return (
            <Badge
              variant="outline"
              className={cn("font-medium", get(config, "className"))}
            >
              {get(config, "label")}
            </Badge>
          );
        },
      },
      {
        accessorKey: "joinedAt",
        header: "Sana",
        cell: (info) => (
          <span className="text-xs text-muted-foreground">
            {info.getValue() || "\u2014"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        size: 50,
        cell: (info) => (
          <div className="flex justify-end">
            <CoachActionsMenu
              coach={get(info, "row.original")}
              isPending={isCoachActionPending(get(info, "row.original.id"))}
              onView={onView}
              onStatusUpdate={onStatusUpdate}
              onMarketplaceUpdate={onMarketplaceUpdate}
            />
          </div>
        ),
      },
    ],
    [isCoachActionPending, onMarketplaceUpdate, onStatusUpdate, onView],
  );
};
