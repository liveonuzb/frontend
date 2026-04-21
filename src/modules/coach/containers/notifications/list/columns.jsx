import React from "react";
import { get } from "lodash";
import { BellIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DataGridColumnHeader,
  DataGridTableRowSelect,
  DataGridTableRowSelectAll,
} from "@/components/reui/data-grid";
import NotificationActionsMenu from "./actions-menu.jsx";

const TYPE_BADGE_VARIANT = {
  PAYMENT_REMINDER: "warning",
  CHECKIN_DUE: "info",
  PROGRESS_UPDATE: "success",
  SYSTEM: "secondary",
};

const TYPE_LABELS = {
  PAYMENT_REMINDER: "To'lov eslatmasi",
  CHECKIN_DUE: "Tekshiruv",
  PROGRESS_UPDATE: "Taraqqiyot",
  SYSTEM: "Tizim",
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("uz-UZ", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const useColumns = ({ currentPage, pageSize, onMarkRead, onSoftDelete, onRestore, onHardDelete }) =>
  React.useMemo(
    () => [
      {
        id: "select",
        header: () => <DataGridTableRowSelectAll />,
        cell: ({ row }) => <DataGridTableRowSelect row={row} />,
        enableSorting: false,
        size: 40,
      },
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
        id: "content",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Bildirishnoma" />
        ),
        enableSorting: false,
        cell: ({ row }) => {
          const notification = row.original;
          const isUnread = !get(notification, "readAt");
          return (
            <div className="flex items-start gap-3 min-w-0">
              <div className="relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary mt-0.5">
                <BellIcon className="size-4" />
                {isUnread && (
                  <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-blue-500 ring-2 ring-background" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold leading-tight line-clamp-1">
                  {get(notification, "title", "—")}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-2 max-w-[300px] sm:max-w-[420px]">
                  {get(notification, "message", "")}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "type",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Tur" />
        ),
        enableSorting: true,
        size: 160,
        cell: ({ row }) => {
          const type = get(row.original, "type", "SYSTEM");
          return (
            <Badge variant={TYPE_BADGE_VARIANT[type] ?? "secondary"}>
              {TYPE_LABELS[type] ?? type}
            </Badge>
          );
        },
        meta: {
          cellClassName: "hidden sm:table-cell",
          headerClassName: "hidden sm:table-cell",
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
          <NotificationActionsMenu
            notification={row.original}
            onMarkRead={onMarkRead}
            onSoftDelete={onSoftDelete}
            onRestore={onRestore}
            onHardDelete={onHardDelete}
          />
        ),
      },
    ],
    [currentPage, pageSize, onMarkRead, onSoftDelete, onRestore, onHardDelete],
  );
