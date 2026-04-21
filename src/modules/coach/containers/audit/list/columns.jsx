import React from "react";
import { get } from "lodash";
import {
  PlusCircleIcon,
  PencilIcon,
  Trash2Icon,
  RotateCcwIcon,
  XCircleIcon,
  ArrowUpDownIcon,
  ArchiveIcon,
  RefreshCwIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataGridColumnHeader } from "@/components/reui/data-grid";

const ACTION_CONFIG = {
  CREATE: { label: "Yaratish", variant: "success", icon: PlusCircleIcon },
  UPDATE: { label: "Yangilash", variant: "info", icon: PencilIcon },
  DELETE: { label: "O'chirish", variant: "destructive", icon: Trash2Icon },
  RESTORE: { label: "Tiklash", variant: "warning", icon: RotateCcwIcon },
  HARD_DELETE: { label: "Butunlay o'chirish", variant: "destructive", icon: XCircleIcon },
  REORDER: { label: "Tartiblashtirish", variant: "secondary", icon: ArrowUpDownIcon },
  BULK_TRASH: { label: "Ommaviy trash", variant: "destructive", icon: ArchiveIcon },
  BULK_RESTORE: { label: "Ommaviy tiklash", variant: "warning", icon: RefreshCwIcon },
};

const ENTITY_LABELS = {
  CLIENT: "Mijoz",
  PAYMENT: "To'lov",
  MEAL_PLAN: "Ovqatlanish rejasi",
  WORKOUT_PLAN: "Mashq rejasi",
  PROGRAM: "Dastur",
  CHALLENGE: "Challenge",
  GROUP: "Guruh",
  SNIPPET: "Snippet",
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("uz-UZ", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const useColumns = ({ currentPage, pageSize }) =>
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
        accessorKey: "entityType",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Ob'ekt turi" />
        ),
        enableSorting: false,
        size: 160,
        cell: ({ row }) => {
          const entityType = get(row.original, "entityType", "");
          return (
            <Badge variant="outline">
              {ENTITY_LABELS[entityType] ?? entityType}
            </Badge>
          );
        },
        meta: {
          cellClassName: "hidden sm:table-cell",
          headerClassName: "hidden sm:table-cell",
        },
      },
      {
        id: "entityLabel",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Ob'ekt" />
        ),
        enableSorting: false,
        cell: ({ row }) => {
          const label = get(
            row.original,
            "entityLabel",
            get(row.original, "entity.name", get(row.original, "entityId", "—")),
          );
          return (
            <span className="font-medium text-sm truncate max-w-[200px] block">{label}</span>
          );
        },
      },
      {
        accessorKey: "action",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Harakat" />
        ),
        enableSorting: false,
        size: 180,
        cell: ({ row }) => {
          const actionKey = get(row.original, "action", "");
          const config = ACTION_CONFIG[actionKey];
          if (!config) {
            return <Badge variant="secondary">{actionKey}</Badge>;
          }
          const Icon = config.icon;
          return (
            <Badge variant={config.variant} className="gap-1.5">
              <Icon className="size-3" />
              {config.label}
            </Badge>
          );
        },
      },
      {
        id: "summary",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Qisqacha" />
        ),
        enableSorting: false,
        cell: ({ row }) => {
          const summary = get(row.original, "summary", get(row.original, "description", ""));
          return (
            <p className="text-sm text-muted-foreground line-clamp-2 max-w-[320px]">
              {summary || "—"}
            </p>
          );
        },
        meta: {
          cellClassName: "hidden lg:table-cell",
          headerClassName: "hidden lg:table-cell",
        },
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Vaqt" />
        ),
        enableSorting: true,
        size: 160,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {formatDateTime(get(row.original, "createdAt"))}
          </span>
        ),
      },
    ],
    [currentPage, pageSize],
  );
