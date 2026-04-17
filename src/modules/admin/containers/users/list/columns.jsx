import React from "react";
import { get, map } from "lodash";
import { Badge } from "@/components/ui/badge";
import { DataGridColumnHeader } from "@/components/reui/data-grid";
import {
  getAvatarColor,
  getInitials,
  roleColors,
  roleBgColors,
  roleLabels,
  statusConfig,
  coachStatusConfig,
  premiumStatusConfig,
} from "../config";
import { cn } from "@/lib/utils";
import UserActionsMenu from "./actions-menu.jsx";

export const useColumns = ({
  currentPage,
  pageSize,
  isUserActionPending,
  canManageUser,
  canGiftPremium,
  onView,
  onEdit,
  onGift,
  onExtendPremium,
  onCancelPremium,
  onBanToggle,
  onDelete,
  onCoachStatusUpdate,
}) => {
  return React.useMemo(
    () => [
      {
        id: "index",
        header: "#",
        size: 56,
        cell: (info) => (currentPage - 1) * pageSize + info.row.index + 1,
      },
      {
        accessorKey: "firstName",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Foydalanuvchi" />
        ),
        enableSorting: true,
        meta: { cellClassName: "min-w-[220px]" },
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "size-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0",
                  getAvatarColor(user.id),
                )}
              >
                {getInitials(user.firstName, user.lastName) || "U"}
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">
                  {`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
                    "Nomsiz user"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email || "Email yo'q"}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "email",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Email" />
        ),
        enableSorting: true,
        meta: { cellClassName: "min-w-[180px]" },
        cell: ({ row }) => {
          const email = row.original.email;
          return (
            <span className="text-sm text-muted-foreground">
              {email || "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "phone",
        header: "Telefon",
        meta: { cellClassName: "min-w-[140px]" },
        cell: (info) => (
          <span className="text-sm text-muted-foreground">
            {info.getValue() || "—"}
          </span>
        ),
      },
      {
        id: "roles",
        header: "Rollar",
        meta: { cellClassName: "min-w-[160px]" },
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex flex-wrap gap-1">
              {map(user.roles ?? [], (role) => (
                <Badge
                  key={`${user.id}-${role}`}
                  variant={roleColors[role] ?? "outline"}
                  className={roleBgColors[role]}
                >
                  {roleLabels[role] ?? role}
                </Badge>
              ))}
              {user.coachStatus ? (
                <Badge
                  variant="outline"
                  className={get(coachStatusConfig[user.coachStatus], "className")}
                >
                  {get(coachStatusConfig[user.coachStatus], "label", user.coachStatus)}
                </Badge>
              ) : null}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Status" />
        ),
        enableSorting: true,
        cell: (info) => {
          const status = info.getValue();
          return (
            <Badge
              variant="outline"
              className={get(statusConfig[status], "className")}
            >
              {get(statusConfig[status], "label", status)}
            </Badge>
          );
        },
      },
      {
        accessorKey: "joinedAt",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Qo'shilgan" />
        ),
        enableSorting: true,
        meta: { cellClassName: "min-w-[120px]" },
        cell: (info) => (
          <span className="text-sm text-muted-foreground">
            {info.getValue() || "—"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        size: 56,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <UserActionsMenu
              user={row.original}
              isUserActionPending={isUserActionPending}
              canManageUser={canManageUser}
              canGiftPremium={canGiftPremium}
              onView={onView}
              onEdit={onEdit}
              onGift={onGift}
              onExtendPremium={onExtendPremium}
              onCancelPremium={onCancelPremium}
              onBanToggle={onBanToggle}
              onDelete={onDelete}
              onCoachStatusUpdate={onCoachStatusUpdate}
            />
          </div>
        ),
      },
    ],
    [
      currentPage,
      pageSize,
      isUserActionPending,
      canManageUser,
      canGiftPremium,
      onView,
      onEdit,
      onGift,
      onExtendPremium,
      onCancelPremium,
      onBanToggle,
      onDelete,
      onCoachStatusUpdate,
    ],
  );
};
