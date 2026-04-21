import React from "react";
import { forEach, get, slice } from "lodash";
import { FlameIcon } from "lucide-react";
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

const calculateTotalCalories = (weeklyKanban) => {
  if (!weeklyKanban) return 0;
  let total = 0;
  forEach(Object.values(weeklyKanban), (columns) => {
    forEach(columns, (column) => {
      forEach(column.items || [], (item) => {
        total += item.cal || 0;
      });
    });
  });
  return total;
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
          <DataGridColumnHeader column={column} title="Reja nomi" />
        ),
        enableSorting: true,
        cell: ({ row }) => {
          const plan = row.original;
          return (
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold leading-tight">{plan.title}</p>
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
        accessorKey: "mealsCount",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Ovqat" />
        ),
        enableSorting: true,
        cell: ({ row }) => `${get(row.original, "mealsCount", 0)} ta`,
        size: 90,
      },
      {
        accessorKey: "daysWithMeals",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Kun" />
        ),
        enableSorting: true,
        cell: ({ row }) => `${get(row.original, "daysWithMeals", 0)} kun`,
        size: 90,
      },
      {
        accessorKey: "totalCalories",
        accessorFn: (row) => calculateTotalCalories(row.weeklyKanban),
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Kaloriya" />
        ),
        enableSorting: true,
        cell: ({ row }) => {
          const totalCal = calculateTotalCalories(row.original.weeklyKanban) || 0;
          return (
            <Badge
              variant="secondary"
              className="font-bold bg-orange-500/10 text-orange-600 border-orange-500/20"
            >
              <FlameIcon className="mr-1 size-3" />
              {totalCal} kkal
            </Badge>
          );
        },
        size: 120,
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
