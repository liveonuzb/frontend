import React from "react";
import { get, map, trim } from "lodash";
import { Badge } from "@/components/ui/badge";
import { DataGridColumnHeader } from "@/components/reui/data-grid";
import { adminListSkeletons } from "@/modules/admin/components/admin-list-skeletons.jsx";
import {
  getAvatarColor,
  getInitials,
  roleColors,
  roleBgColors,
  roleLabels,
  statusConfig,
  premiumStatusConfig,
} from "../config";
import { cn } from "@/lib/utils";
import UserActionsMenu from "./actions-menu.jsx";

export const useColumns = ({
  currentPage,
  pageSize,
  isUserActionPending,
  canManageSupport,
  canManageGrowth,
  canBlockUsers,
  canDeleteUsers,
  canManageUser,
  canGiftPremium,
  onView,
  onEdit,
  onGift,
  onExtendPremium,
  onCancelPremium,
  onBanToggle,
  onDelete,
}) => {
  return React.useMemo(
    () => [
      {
        id: "index",
        header: "#",
        size: 56,
        meta: { skeleton: adminListSkeletons.index },
        cell: (info) => (currentPage - 1) * pageSize + info.row.index + 1,
      },
      {
        accessorKey: "firstName",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Foydalanuvchi" />
        ),
        enableSorting: true,
        meta: {
          skeleton: adminListSkeletons.avatarText,
          cellClassName: "min-w-[220px]",
        },
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
                  {trim(`${user.firstName ?? ""} ${user.lastName ?? ""}`) ||
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
        meta: {
          skeleton: adminListSkeletons.text,
          cellClassName: "min-w-[180px]",
        },
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
        meta: {
          skeleton: adminListSkeletons.text,
          cellClassName: "min-w-[140px]",
        },
        cell: (info) => (
          <span className="text-sm text-muted-foreground">
            {info.getValue() || "—"}
          </span>
        ),
      },
      {
        id: "roles",
        header: "Rollar",
        meta: {
          skeleton: adminListSkeletons.badge,
          cellClassName: "min-w-[160px]",
        },
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
        meta: { skeleton: adminListSkeletons.badge },
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
        id: "premium",
        header: "Premium",
        meta: {
          skeleton: adminListSkeletons.badge,
          cellClassName: "min-w-[140px]",
        },
        cell: ({ row }) => {
          const premium = row.original.premium;
          const status = get(premium, "status", "free");
          if (status === "free") {
            return <span className="text-xs text-muted-foreground">Tekin</span>;
          }
          const config = premiumStatusConfig[status];
          return (
            <div className="flex flex-col gap-0.5">
              <Badge variant="outline" className={get(config, "className")}>
                {get(config, "label", status)}
              </Badge>
              {get(premium, "planName") ? (
                <span className="text-[11px] text-muted-foreground">
                  {premium.planName}
                  {premium.endDate ? ` · ${premium.endDate}` : ""}
                </span>
              ) : null}
            </div>
          );
        },
      },
      {
        accessorKey: "joinedAt",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Qo'shilgan" />
        ),
        enableSorting: true,
        meta: {
          skeleton: adminListSkeletons.text,
          cellClassName: "min-w-[120px]",
        },
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
        meta: { skeleton: adminListSkeletons.action },
        cell: ({ row }) => (
          <div className="flex justify-end">
            <UserActionsMenu
              user={row.original}
              isUserActionPending={isUserActionPending}
              canManageSupport={canManageSupport}
              canManageGrowth={canManageGrowth}
              canBlockUsers={canBlockUsers}
              canDeleteUsers={canDeleteUsers}
              canManageUser={canManageUser}
              canGiftPremium={canGiftPremium}
              onView={onView}
              onEdit={onEdit}
              onGift={onGift}
              onExtendPremium={onExtendPremium}
              onCancelPremium={onCancelPremium}
              onBanToggle={onBanToggle}
              onDelete={onDelete}
            />
          </div>
        ),
      },
    ],
    [
      currentPage,
      pageSize,
      isUserActionPending,
      canManageSupport,
      canManageGrowth,
      canBlockUsers,
      canDeleteUsers,
      canManageUser,
      canGiftPremium,
      onView,
      onEdit,
      onGift,
      onExtendPremium,
      onCancelPremium,
      onBanToggle,
      onDelete,
    ],
  );
};
