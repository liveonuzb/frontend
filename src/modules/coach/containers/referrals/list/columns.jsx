import React from "react";
import { get } from "lodash";
import { LinkIcon, UserRoundIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataGridColumnHeader } from "@/components/reui/data-grid";
import ReferralActionsMenu from "./actions-menu.jsx";

const STATUS_BADGE_VARIANT = {
  ACTIVE: "success",
  CANCELLED: "secondary",
};

const STATUS_LABELS = {
  ACTIVE: "Faol",
  CANCELLED: "Bekor qilingan",
};

const EVENT_BADGE_VARIANT = {
  CLICK: "secondary",
  SIGNUP: "success",
  PAID_CONVERSION: "warning",
};

const EVENT_LABELS = {
  CLICK: "Klik",
  SIGNUP: "Ro'yxatdan o'tish",
  PAID_CONVERSION: "To'lov konversiyasi",
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("uz-UZ", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatTiyin = (amount) => {
  if (!amount) return "-";
  return `${Intl.NumberFormat("uz-UZ").format(Math.round(amount / 100))} so'm`;
};

const formatRate = (rate) => {
  if (!rate) return "-";
  return `${Math.round(Number(rate) * 100)}%`;
};

export const useColumns = ({
  currentPage,
  pageSize,
  onCopyLink,
  onResend,
  onCancel,
}) =>
  React.useMemo(
    () => [
      {
        accessorKey: "id",
        header: "#",
        cell: (info) => (currentPage - 1) * pageSize + info.row.index + 1,
        size: 60,
        meta: {
          cellClassName: "hidden md:table-cell",
          headerClassName: "hidden md:table-cell",
        },
      },
      {
        accessorKey: "referralCode",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Referral kodi" />
        ),
        enableSorting: false,
        size: 180,
        cell: ({ row }) => {
          const code = get(row.original, "referralCode", "-");
          return (
            <div className="flex items-center gap-2">
              <LinkIcon className="size-3.5 shrink-0 text-muted-foreground" />
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm text-foreground">
                {code}
              </code>
            </div>
          );
        },
      },
      {
        id: "referredUser",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Taklif qilingan" />
        ),
        enableSorting: false,
        cell: ({ row }) => {
          const referral = row.original;
          const name = get(referral, "referredUser.name", "");
          const email = get(referral, "referredUser.email", "");
          const phone = get(referral, "referredUser.phone", "");
          const subtitle =
            email || phone || get(referral, "referredUser.id", "-");

          return (
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <UserRoundIcon className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium leading-tight">
                  {name || "Noma'lum foydalanuvchi"}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {subtitle}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "event",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Hodisa" />
        ),
        enableSorting: true,
        size: 180,
        cell: ({ row }) => {
          const event = get(row.original, "event", "SIGNUP");
          return (
            <Badge variant={EVENT_BADGE_VARIANT[event] ?? "secondary"}>
              {EVENT_LABELS[event] ?? event}
            </Badge>
          );
        },
        meta: {
          cellClassName: "hidden lg:table-cell",
          headerClassName: "hidden lg:table-cell",
        },
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Holat" />
        ),
        enableSorting: true,
        size: 150,
        cell: ({ row }) => {
          const status = get(row.original, "status", "ACTIVE");
          return (
            <Badge variant={STATUS_BADGE_VARIANT[status] ?? "secondary"}>
              {STATUS_LABELS[status] ?? status}
            </Badge>
          );
        },
        meta: {
          cellClassName: "hidden sm:table-cell",
          headerClassName: "hidden sm:table-cell",
        },
      },
      {
        id: "commission",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Komissiya" />
        ),
        enableSorting: false,
        size: 160,
        cell: ({ row }) => {
          const rate = get(row.original, "commissionRate");
          const rewardAmount = get(row.original, "rewardAmount");

          return (
            <div className="min-w-0">
              <p className="font-medium tabular-nums">
                {formatTiyin(rewardAmount)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatRate(rate)}
              </p>
            </div>
          );
        },
        meta: {
          cellClassName: "hidden xl:table-cell",
          headerClassName: "hidden xl:table-cell",
        },
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Sana" />
        ),
        enableSorting: true,
        size: 130,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(get(row.original, "createdAt"))}
          </span>
        ),
        meta: {
          cellClassName: "hidden md:table-cell",
          headerClassName: "hidden md:table-cell",
        },
      },
      {
        id: "actions",
        header: "",
        size: 50,
        cell: ({ row }) => (
          <ReferralActionsMenu
            referral={row.original}
            onCopyLink={onCopyLink}
            onResend={onResend}
            onCancel={onCancel}
          />
        ),
      },
    ],
    [currentPage, pageSize, onCancel, onCopyLink, onResend],
  );
