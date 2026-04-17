import React from "react";
import { get } from "lodash";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import SubscriptionActionsMenu from "./actions-menu.jsx";

const statusConfig = {
  ACTIVE: {
    label: "Faol",
    className:
      "bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
  },
  EXPIRED: {
    label: "Tugagan",
    className:
      "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
  },
  CANCELLED: {
    label: "Bekor qilingan",
    className:
      "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
  },
};

const formatDate = (dateStr) => {
  if (!dateStr) return "\u2014";
  return new Intl.DateTimeFormat("uz-UZ").format(new Date(dateStr));
};

const getDaysRemaining = (dateStr) => {
  if (!dateStr) return null;
  const now = new Date();
  const target = new Date(dateStr);
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : null;
};

export const useColumns = ({ onExtend, onCancel, onToggleAutoRenew }) => {
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
                  {get(sub, "user.email") || get(sub, "user.phone")}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "plan",
        header: "Plan",
        cell: (info) => {
          const sub = get(info, "row.original");
          const planName = get(sub, "plan.name", "Premium");
          const planType = get(sub, "plan.type");
          return (
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">{planName}</span>
              {planType === "FAMILY" ? (
                <Badge
                  variant="outline"
                  className="w-fit bg-purple-500/10 text-purple-700 dark:text-purple-400"
                >
                  Oilaviy
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="w-fit bg-blue-500/10 text-blue-700 dark:text-blue-400"
                >
                  Individual
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 130,
        cell: (info) => {
          const status = info.getValue();
          const config = get(statusConfig, status, statusConfig.ACTIVE);
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
        id: "autoRenew",
        header: "Auto-renew",
        size: 100,
        cell: (info) => {
          const subscription = get(info, "row.original");
          return (
            <Switch
              checked={get(subscription, "autoRenew", false)}
              onCheckedChange={() => onToggleAutoRenew(get(subscription, "id"))}
              disabled={get(subscription, "status") !== "ACTIVE"}
            />
          );
        },
      },
      {
        id: "trial",
        header: "Sinov",
        size: 120,
        cell: (info) => {
          const sub = get(info, "row.original");
          const trialEndsAt = get(sub, "trialEndsAt");
          const daysLeft = getDaysRemaining(trialEndsAt);
          if (daysLeft) {
            return (
              <Badge
                variant="outline"
                className="bg-amber-500/10 text-amber-700 dark:text-amber-400"
              >
                Trial ({daysLeft} kun)
              </Badge>
            );
          }
          return <span className="text-sm text-muted-foreground">-</span>;
        },
      },
      {
        id: "promo",
        header: "Promo",
        size: 120,
        cell: (info) => {
          const sub = get(info, "row.original");
          const promoCode = get(sub, "promoCode");
          if (promoCode) {
            return (
              <Badge variant="outline" className="font-mono text-xs">
                {promoCode}
              </Badge>
            );
          }
          return <span className="text-sm text-muted-foreground">-</span>;
        },
      },
      {
        id: "period",
        header: "Muddat",
        cell: (info) => {
          const sub = get(info, "row.original");
          const startDate = get(sub, "startDate");
          const endDate = get(sub, "endDate");
          return (
            <span className="text-xs font-mono">
              {formatDate(startDate)} &mdash; {formatDate(endDate)}
            </span>
          );
        },
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
    [onCancel, onExtend, onToggleAutoRenew],
  );
};
