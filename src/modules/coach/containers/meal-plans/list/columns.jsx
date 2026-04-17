import { forEach, slice } from "lodash";
import React from "react";
import { FlameIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { DataGridColumnHeader } from "@/components/reui/data-grid";
import ActionsMenu from "./actions-menu.jsx";

const formatDate = (value, locale = "uz-UZ") =>
  value
    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
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
  locale,
  onEdit,
  onAssign,
  onDuplicate,
  onDelete,
  isDeleting,
}) => {
  const { t } = useTranslation();

  return React.useMemo(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => (
          <DataGridColumnHeader
            column={column}
            title={t("coach.mealPlans.table.columns.template")}
          />
        ),
        enableSorting: true,
        cell: ({ row }) => {
          const plan = row.original;
          return (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{plan.title}</p>
                <Badge variant="outline">
                  {plan.source === "ai"
                    ? t("coach.mealPlans.filters.ai")
                    : t("coach.mealPlans.filters.manual")}
                </Badge>
              </div>
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {plan.description || t("coach.mealPlans.noDescription")}
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: "mealsCount",
        header: ({ column }) => (
          <DataGridColumnHeader
            column={column}
            title={t("coach.mealPlans.table.columns.meals")}
          />
        ),
        enableSorting: true,
        cell: ({ row }) =>
          t("coach.mealPlans.table.mealCount", {
            count: row.original.mealsCount,
          }),
      },
      {
        accessorKey: "daysWithMeals",
        header: ({ column }) => (
          <DataGridColumnHeader
            column={column}
            title={t("coach.mealPlans.table.columns.days")}
          />
        ),
        enableSorting: true,
        cell: ({ row }) =>
          t("coach.mealPlans.table.dayCount", {
            count: row.original.daysWithMeals,
          }),
      },
      {
        accessorKey: "totalCalories",
        accessorFn: (row) => calculateTotalCalories(row.weeklyKanban),
        header: ({ column }) => (
          <DataGridColumnHeader
            column={column}
            title={t("coach.mealPlans.table.columns.calories")}
          />
        ),
        enableSorting: true,
        cell: ({ row }) => {
          const totalCal =
            calculateTotalCalories(row.original.weeklyKanban) || 0;
          return (
            <Badge
              variant="secondary"
              className="font-bold bg-orange-500/10 text-orange-600 border-orange-500/20"
            >
              <FlameIcon className="mr-1 size-3" />
              {totalCal} {t("coach.mealPlans.table.calorieUnit")}
            </Badge>
          );
        },
      },
      {
        id: "assignedClientsCount",
        accessorFn: (row) => row.assignedClients.length,
        header: ({ column }) => (
          <DataGridColumnHeader
            column={column}
            title={t("coach.mealPlans.table.columns.assigned")}
          />
        ),
        enableSorting: true,
        cell: ({ row }) => {
          const assignedClients = row.original.assignedClients;
          if (!assignedClients.length) {
            return (
              <span className="text-muted-foreground">
                {t("coach.mealPlans.table.unassigned")}
              </span>
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
                <Badge variant="outline">
                  +{assignedClients.length - 2}
                </Badge>
              ) : null}
            </div>
          );
        },
      },
      {
        accessorKey: "updatedAt",
        header: ({ column }) => (
          <DataGridColumnHeader
            column={column}
            title={t("coach.mealPlans.table.columns.updated")}
          />
        ),
        enableSorting: true,
        cell: ({ row }) => formatDate(row.original.updatedAt, locale),
      },
      {
        id: "actions",
        header: "",
        size: 50,
        enableSorting: false,
        meta: { noPinnedBorder: true },
        cell: ({ row }) => {
          const plan = row.original;
          return (
            <div
              className="flex items-center justify-end"
              onClick={(event) => event.stopPropagation()}
            >
              <ActionsMenu
                plan={plan}
                onEdit={onEdit}
                onAssign={onAssign}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
                isDeleting={isDeleting}
              />
            </div>
          );
        },
      },
    ],
    [locale, onEdit, onAssign, onDuplicate, onDelete, isDeleting, t],
  );
};
