import React from "react";
import { ClipboardListIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DataGridColumnHeader,
  DataGridTableRowSelect,
  DataGridTableRowSelectAll,
  DataGridTableDndRowHandle,
} from "@/components/reui/data-grid";
import ActionsMenu from "./actions-menu.jsx";

const STATUS_BADGE = {
  DRAFT: { variant: "secondary", label: "Qoralama" },
  ACTIVE: { variant: "default", label: "Faol" },
  ARCHIVED: { variant: "outline", label: "Arxivlangan" },
};

export const useColumns = ({
  canReorder,
  currentPage,
  pageSize,
  onEdit,
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
      ...(canReorder
        ? [
            {
              id: "dnd",
              header: "",
              cell: () => <DataGridTableDndRowHandle />,
              size: 32,
            },
          ]
        : []),
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
        accessorKey: "title",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Dastur nomi" />
        ),
        enableSorting: true,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ClipboardListIcon className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold leading-tight">{row.original.title}</p>
              {row.original.description ? (
                <p className="text-xs text-muted-foreground line-clamp-1 truncate max-w-[200px] sm:max-w-[300px]">
                  {row.original.description}
                </p>
              ) : null}
            </div>
          </div>
        ),
      },
      {
        id: "status",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Holat" />
        ),
        cell: ({ row }) => {
          const statusKey = row.original.status?.toUpperCase();
          const badge = STATUS_BADGE[statusKey] ?? { variant: "secondary", label: statusKey ?? "—" };
          return (
            <Badge variant={badge.variant} className="rounded-lg h-7 px-2.5">
              {badge.label}
            </Badge>
          );
        },
        size: 130,
      },
      {
        id: "weeks",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Davomiylik" />
        ),
        cell: ({ row }) => (
          <Badge variant="secondary" className="rounded-lg h-7 px-2.5">
            {row.original.durationWeeks ?? "—"} hafta
          </Badge>
        ),
        size: 120,
      },
      {
        id: "actions",
        header: "",
        size: 50,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <ActionsMenu
              program={row.original}
              onEdit={onEdit}
              onSoftDelete={onSoftDelete}
              onRestore={onRestore}
              onHardDelete={onHardDelete}
            />
          </div>
        ),
      },
    ],
    [canReorder, currentPage, pageSize, onEdit, onSoftDelete, onRestore, onHardDelete],
  );
