import React from "react";
import { get } from "lodash";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("uz-UZ", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return dateStr;
  }
};

const getInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const useColumns = () => {
  return React.useMemo(
    () => [
      {
        id: "owner",
        header: "Egasi",
        cell: (info) => {
          const row = get(info, "row.original");
          const owner = get(row, "owner");
          const name =
            [get(owner, "firstName"), get(owner, "lastName")]
              .filter(Boolean)
              .join(" ") || get(owner, "email", "-");
          const email = get(owner, "email", "");
          const avatar = get(owner, "avatarUrl") || get(owner, "avatar");

          return (
            <div className="flex items-center gap-3">
              <Avatar className="size-8">
                {avatar ? (
                  <AvatarImage src={avatar} alt={name} />
                ) : null}
                <AvatarFallback className="text-xs">
                  {getInitials(name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{name}</p>
                {email ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {email}
                  </p>
                ) : null}
              </div>
            </div>
          );
        },
      },
      {
        id: "members",
        header: "A'zolar",
        size: 100,
        cell: (info) => {
          const count = get(info, "row.original.memberCount", 0) ||
            get(info, "row.original.members.length", 0);
          return <Badge variant="outline">{count} ta</Badge>;
        },
      },
      {
        id: "subscription",
        header: "Obuna",
        cell: (info) => {
          const row = get(info, "row.original");
          const planName =
            get(row, "subscription.plan.name") || get(row, "planName");
          const status = get(row, "subscription.status") || get(row, "subscriptionStatus");

          return (
            <div className="flex items-center gap-2">
              {planName ? (
                <span className="text-sm">{planName}</span>
              ) : (
                <span className="text-sm text-muted-foreground">-</span>
              )}
              {status ? (
                <Badge
                  variant="outline"
                  className={
                    status === "ACTIVE"
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "bg-slate-500/10 text-slate-700 dark:text-slate-300"
                  }
                >
                  {status === "ACTIVE" ? "Faol" : status}
                </Badge>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "createdAt",
        header: "Yaratilgan",
        size: 130,
        cell: (info) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(get(info, "row.original.createdAt"))}
          </span>
        ),
      },
    ],
    [],
  );
};
