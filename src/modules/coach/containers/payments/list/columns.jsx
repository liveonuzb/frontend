import React from "react";
import { get, join, map, split, take, toUpper } from "lodash";
import { PaperclipIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DataGridColumnHeader,
  DataGridTableRowSelect,
  DataGridTableRowSelectAll,
} from "@/components/reui/data-grid";
import ActionsMenu from "./actions-menu.jsx";

const getInitials = (value = "") =>
  toUpper(join(take(map(split(String(value), " "), (part) => get(part, "[0]", "")), 2), ""));

const formatMoney = (value) => {
  const normalized = Number(value);
  if (!Number.isFinite(normalized) || normalized <= 0) return "Kelishiladi";
  return `${new Intl.NumberFormat("uz-UZ").format(normalized)} so'm`;
};

const formatDate = (value) => {
  if (!value) return "\u2014";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "\u2014";
  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
};

const STATUS_MAP = {
  cancelled: {
    label: "Bekor qilingan",
    className: "rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight text-destructive",
  },
  refunded: {
    label: "Qaytarilgan",
    className: "rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight text-orange-600",
  },
  completed: {
    label: "Muvaffaqiyatli",
    className: "rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight text-green-600",
  },
};

export const useColumns = ({
  currentPage,
  pageSize,
  onEdit,
  onCancel,
  onRefund,
  onSoftDelete,
  onRestore,
  onHardDelete,
}) =>
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
        accessorKey: "client",
        header: "Mijoz",
        cell: ({ getValue }) => {
          const client = getValue();
          return (
            <div className="flex items-center gap-3">
              <Avatar className="size-9">
                <AvatarImage src={get(client, "avatar")} />
                <AvatarFallback className="text-[10px]">
                  {getInitials(get(client, "name") || "N")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">
                  {get(client, "name") || "Noma'lum"}
                </p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {get(client, "phone") || get(client, "email")}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "amount",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Summa" />
        ),
        enableSorting: true,
        cell: ({ getValue }) => (
          <span className="font-semibold text-primary">
            {formatMoney(getValue())}
          </span>
        ),
      },
      {
        accessorKey: "method",
        header: "Usul",
        cell: ({ getValue }) => (
          <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
            {getValue() || "Boshqa"}
          </span>
        ),
        meta: {
          headerClassName: "hidden md:table-cell",
          cellClassName: "hidden md:table-cell",
        },
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Status" />
        ),
        enableSorting: true,
        cell: ({ row }) => {
          const status = row.original.status;
          const cfg = STATUS_MAP[status] ?? STATUS_MAP.completed;
          return <span className={cfg.className}>{cfg.label}</span>;
        },
      },
      {
        accessorKey: "paidAt",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Sana" />
        ),
        enableSorting: true,
        cell: ({ getValue }) => formatDate(getValue()),
        meta: {
          headerClassName: "hidden md:table-cell",
          cellClassName: "hidden md:table-cell",
        },
      },
      {
        accessorKey: "note",
        header: "Izoh",
        cell: ({ row }) => (
          <div className="flex max-w-[200px] items-center gap-2">
            <span className="truncate text-xs text-muted-foreground">
              {row.original.note || "\u2014"}
            </span>
            {row.original.receiptUrl && (
              <a
                href={row.original.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded p-1 transition-colors hover:bg-primary/10"
                title="Kvitansiyani ko'rish"
                onClick={(e) => e.stopPropagation()}
              >
                <PaperclipIcon className="size-3 text-primary" />
              </a>
            )}
          </div>
        ),
        meta: {
          headerClassName: "hidden md:table-cell",
          cellClassName: "hidden md:table-cell",
        },
      },
      {
        id: "actions",
        header: "",
        size: 50,
        cell: ({ row }) => (
          <div className="flex justify-end pr-2">
            <ActionsMenu
              payment={row.original}
              onEdit={onEdit}
              onCancel={onCancel}
              onRefund={onRefund}
              onSoftDelete={onSoftDelete}
              onRestore={onRestore}
              onHardDelete={onHardDelete}
            />
          </div>
        ),
        meta: { noPinnedBorder: true },
      },
    ],
    [currentPage, pageSize, onEdit, onCancel, onRefund, onSoftDelete, onRestore, onHardDelete],
  );
