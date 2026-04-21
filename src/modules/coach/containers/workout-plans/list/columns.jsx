import React from "react";
import { get, size, slice } from "lodash";
import { ZapIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DataGridColumnHeader,
  DataGridTableDndRowHandle,
  DataGridTableRowSelect,
  DataGridTableRowSelectAll,
} from "@/components/reui/data-grid";
import ActionsMenu from "./actions-menu.jsx";

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("uz-UZ", { dateStyle: "medium" }).format(
        new Date(value),
      )
    : "\u2014";

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
        accessorKey: "name",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Template nomi" />
        ),
        enableSorting: true,
        cell: ({ row }) => {
          const plan = row.original;
          return (
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold leading-tight">{plan.name}</p>
                <Badge variant="outline">
                  {plan.source === "ai" ? "AI" : "Manual"}
                </Badge>
              </div>
              {plan.description ? (
                <p className="text-xs text-muted-foreground line-clamp-1 max-w-[260px]">
                  {plan.description}
                </p>
              ) : null}
            </div>
          );
        },
      },
      {
        accessorKey: "totalExercises",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Mashqlar" />
        ),
        enableSorting: true,
        cell: ({ row }) => (
          <Badge
            variant="secondary"
            className="bg-primary/5 text-primary border-primary/10 font-bold"
          >
            <ZapIcon className="mr-1 size-3" />
            {get(row.original, "totalExercises", 0)} ta
          </Badge>
        ),
        size: 100,
      },
      {
        accessorKey: "daysWithWorkouts",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Kunlar" />
        ),
        enableSorting: true,
        cell: ({ row }) => `${get(row.original, "daysWithWorkouts", 0)} kun`,
        size: 90,
      },
      {
        id: "assignedClientsCount",
        accessorFn: (row) => get(row, "assignedClients.length", 0),
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Biriktirilgan" />
        ),
        enableSorting: true,
        cell: ({ row }) => {
          const assignedClients = get(row.original, "assignedClients", []);
          if (!assignedClients.length) {
            return (
              <span className="text-muted-foreground text-sm">Yo'q</span>
            );
          }
          return (
            <div className="flex flex-wrap gap-1">
              {slice(assignedClients, 0, 2).map((client) => (
                <Badge
                  key={`${row.original.id}-${client.id}`}
                  variant="secondary"
                >
                  {client.name}
                </Badge>
              ))}
              {assignedClients.length > 2 ? (
                <Badge variant="outline">+{assignedClients.length - 2}</Badge>
              ) : null}
            </div>
          );
        },
      },
      {
        accessorKey: "updatedAt",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Yangilandi" />
        ),
        enableSorting: true,
        cell: ({ row }) => formatDate(row.original.updatedAt),
        size: 130,
      },
      {
        id: "actions",
        header: "",
        size: 50,
        enableSorting: false,
        cell: ({ row }) => (
          <div
            className="flex items-center justify-end"
            onClick={(event) => event.stopPropagation()}
          >
            <ActionsMenu
              plan={row.original}
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
