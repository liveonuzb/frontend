import { get, size } from "lodash";
import React, { useMemo } from "react";
import { getCoreRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { ZapIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  DataGrid,
  DataGridColumnHeader,
  DataGridContainer,
  DataGridTable,
} from "@/components/reui/data-grid";
import WorkoutPlanActionsMenu from "./workout-plan-actions-menu";

const formatDate = (value, locale = "uz-UZ") =>
  value
    ? new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
      }).format(new Date(value))
    : "—";

const WorkoutPlanTable = ({ workoutPlans, isLoading, onEdit, onAssign, onDelete, onSortingChange, sorting }) => {
  const { t, i18n } = useTranslation();

  const columns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title={t("coach.workoutPlans.table.columns.template")} />
        ),
        enableSorting: true,
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="font-bold tracking-tight">{get(row.original, "name")}</p>
            {get(row.original, "description") && (
              <p className="line-clamp-1 text-xs text-muted-foreground">
                {get(row.original, "description")}
              </p>
            )}
          </div>
        ),
      },
      {
        accessorKey: "totalExercises",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title={t("coach.workoutPlans.table.columns.exercises")} />
        ),
        enableSorting: true,
        cell: ({ row }) => (
          <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 font-bold">
            <ZapIcon className="mr-1 size-3" />
            {t("coach.workoutPlans.table.exerciseCount", { count: get(row.original, "totalExercises", 0) })}
          </Badge>
        ),
      },
      {
        accessorKey: "daysWithWorkouts",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title={t("coach.workoutPlans.table.columns.days")} />
        ),
        enableSorting: true,
        cell: ({ row }) => t("coach.workoutPlans.table.dayCount", { count: get(row.original, "daysWithWorkouts", 0) }),
      },
      {
        id: "assignedClientsCount",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title={t("coach.workoutPlans.table.columns.clients")} />
        ),
        enableSorting: true,
        cell: ({ row }) => {
          const count = size(get(row.original, "assignedClients"));
          return count > 0 ? (
            <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/20 font-bold">
              {t("coach.workoutPlans.table.clientCount", { count })}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-xs italic">
              {t("coach.workoutPlans.table.unassigned")}
            </span>
          );
        },
      },
      {
        accessorKey: "updatedAt",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title={t("coach.workoutPlans.table.columns.updated")} />
        ),
        enableSorting: true,
        cell: ({ row }) => formatDate(get(row.original, "updatedAt"), i18n.language),
      },
      {
        id: "actions",
        header: "",
        size: 50,
        meta: {
          noPinnedBorder: true,
        },
        cell: ({ row }) => (
          <div
            className="flex items-center justify-end"
            onClick={(event) => event.stopPropagation()}
          >
            <WorkoutPlanActionsMenu
              plan={row.original}
              onEdit={onEdit}
              onAssign={onAssign}
              onDelete={onDelete}
            />
          </div>
        ),
      },
    ],
    [onAssign, onDelete, onEdit, t, i18n.language],
  );

  const table = useReactTable({
    data: workoutPlans,
    columns,
    initialState: {
      columnPinning: {
        right: ["actions"],
      },
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange,
    state: { sorting },
  });

  return (
    <DataGridContainer>
      <ScrollArea className="w-full">
        <DataGrid
          table={table}
          isLoading={isLoading}
          recordCount={size(workoutPlans)}
          onRowClick={onEdit}
          tableLayout={{
            columnsPinnable: true,
          }}
        >
          <DataGridTable />
        </DataGrid>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </DataGridContainer>
  );
};

export default WorkoutPlanTable;
