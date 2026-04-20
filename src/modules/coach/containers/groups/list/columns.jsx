import React from "react";
import { get } from "lodash";
import { UsersIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DataGridColumnHeader,
  DataGridTableRowSelect,
  DataGridTableRowSelectAll,
  DataGridTableDndRowHandle,
} from "@/components/reui/data-grid";
import ActionsMenu from "./actions-menu.jsx";

export const useColumns = ({ canReorder, currentPage, pageSize, onEdit, onSoftDelete, onRestore, onHardDelete }) =>
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
        accessorKey: "name",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Guruh nomi" />
        ),
        enableSorting: true,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UsersIcon className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold leading-tight">{row.original.name}</p>
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
        id: "members",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="A'zolar" />
        ),
        cell: ({ row }) => {
          const count = get(row.original, "membersCount", get(row.original, "clientIds.length", 0));
          return (
            <Badge variant="secondary" className="rounded-lg h-7 px-2.5">
              {count} ta
            </Badge>
          );
        },
        size: 110,
      },
      {
        id: "actions",
        header: "",
        size: 50,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <ActionsMenu
              group={row.original}
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
