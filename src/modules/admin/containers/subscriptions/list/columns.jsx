import React from "react";
import { get } from "lodash";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import SubscriptionActionsMenu from "./actions-menu.jsx";

const statusConfig = {
  active: {
    label: "Faol",
    className:
      "bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
  },
  expired: {
    label: "Tugagan",
    className:
      "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  },
  cancelled: {
    label: "Bekor qilingan",
    className:
      "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
  },
};

export { statusConfig };

export const useColumns = ({ onExtend, onCancel }) => {
  return React.useMemo(
    () => [
      {
        accessorKey: "user",
        header: "Foydalanuvchi",
        cell: (info) => {
          const sub = get(info, "row.original");
          return (
            <div className="flex items-center gap-2">
              <Avatar className="size-8">
                <AvatarImage src={get(sub, "user.avatarUrl")} />
                <AvatarFallback>
                  {get(sub, "user.firstName[0]")}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-medium text-sm">
                  {get(sub, "user.firstName")} {get(sub, "user.lastName")}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {get(sub, "user.email")}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "plan",
        header: "Plan",
        cell: (info) => (
          <Badge variant="secondary">
            {get(info.getValue(), "name", "Premium")}
          </Badge>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: (info) => {
          const status = info.getValue();
          const config = get(statusConfig, status, statusConfig.active);
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
        accessorKey: "endDate",
        header: "Muddati",
        cell: (info) => (
          <span className="text-xs font-mono">
            {info.getValue()
              ? new Intl.DateTimeFormat("uz-UZ").format(
                  new Date(info.getValue()),
                )
              : "\u2014"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        size: 50,
        cell: (info) => (
          <div className="flex justify-end">
            <SubscriptionActionsMenu
              subscription={get(info, "row.original")}
              onExtend={onExtend}
              onCancel={onCancel}
            />
          </div>
        ),
      },
    ],
    [onCancel, onExtend],
  );
};
