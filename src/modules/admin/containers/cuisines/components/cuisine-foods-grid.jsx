import React from "react";
import { get, map, size, toString } from "lodash";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { LoaderCircleIcon } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  DataGrid,
  DataGridContainer,
  DataGridTable,
  DataGridTableDndRowHandle,
  DataGridTableDndRows,
} from "@/components/reui/data-grid";
import { useGetQuery, usePatchQuery } from "@/hooks/api";
import { adminListSkeletons } from "@/modules/admin/components/admin-list-skeletons.jsx";

import { getErrorMessage, resolveLabel } from "./utils.jsx";

const CuisineFoodsGrid = ({ canManage, cuisineId, currentLanguage }) => {
  const { data, isLoading, isFetching } = useGetQuery({
    url: `/admin/cuisines/${cuisineId}/foods`,
    queryProps: {
      queryKey: ["admin", "cuisine-foods", cuisineId],
      enabled: Boolean(cuisineId),
    },
  });
  const foods = get(data, "data.data", []);
  const reorderMutation = usePatchQuery({
    queryKey: ["admin", "cuisine-foods", cuisineId],
  });
  const columns = React.useMemo(
    () => [
      ...(canManage
        ? [
            {
              id: "dnd",
              header: "",
              cell: () => <DataGridTableDndRowHandle />,
              meta: { skeleton: adminListSkeletons.action },
              size: 32,
            },
          ]
        : []),
      {
        accessorKey: "name",
        header: "Ovqat",
        meta: {
          skeleton: adminListSkeletons.avatarText,
          cellClassName: "min-w-[260px]",
        },
        cell: (info) => {
          const food = info.row.original;
          return (
            <div className="flex items-center gap-3">
              {food.imageUrl ? (
                <img
                  loading="lazy"
                  src={food.imageUrl}
                  alt={food.name}
                  className="size-10 rounded-xl border object-cover"
                />
              ) : (
                <div className="flex size-10 items-center justify-center rounded-xl border bg-muted text-[10px] text-muted-foreground">
                  No
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {resolveLabel(food.translations, food.name, currentLanguage)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {food.calories} kcal
                </p>
              </div>
            </div>
          );
        },
      },
      {
        id: "macros",
        header: "Makrolar",
        meta: { skeleton: adminListSkeletons.text },
        cell: (info) => {
          const food = info.row.original;
          return (
            <span className="text-xs text-muted-foreground">
              P {food.protein} / C {food.carbs} / F {food.fat}
            </span>
          );
        },
      },
      {
        id: "serving",
        header: "Birlik",
        size: 96,
        meta: { skeleton: adminListSkeletons.text },
        cell: (info) => (
          <span className="text-xs text-muted-foreground">
            {get(info, "row.original.servingSize")}{" "}
            {get(info, "row.original.servingUnit")}
          </span>
        ),
      },
      {
        accessorKey: "isActive",
        header: "Status",
        size: 96,
        meta: { skeleton: adminListSkeletons.badge },
        cell: (info) =>
          info.getValue() ? (
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-700"
            >
              Faol
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="bg-slate-500/10 text-slate-700"
            >
              Nofaol
            </Badge>
          ),
      },
    ],
    [canManage, currentLanguage],
  );
  const table = useReactTable({
    data: foods,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => toString(row.id),
  });
  const handleDragEnd = React.useCallback(
    async ({ active, over }) => {
      if (!canManage || !active || !over || active.id === over.id) return;
      const dataIds = map(foods, (food) => toString(food.id));
      const oldIndex = dataIds.indexOf(active.id);
      const newIndex = dataIds.indexOf(over.id);
      if (oldIndex < 0 || newIndex < 0) return;
      const ordered = [...foods];
      const [movedFood] = ordered.splice(oldIndex, 1);
      ordered.splice(newIndex, 0, movedFood);
      try {
        await reorderMutation.mutateAsync({
          url: `/admin/cuisines/${cuisineId}/foods/reorder`,
          attributes: {
            movedId: toString(movedFood.id),
            prevId: ordered[newIndex - 1]
              ? toString(ordered[newIndex - 1].id)
              : undefined,
            nextId: ordered[newIndex + 1]
              ? toString(ordered[newIndex + 1].id)
              : undefined,
          },
        });
      } catch (error) {
        toast.error(
          getErrorMessage(error, "Ovqatlar tartibini saqlab bo'lmadi"),
        );
      }
    },
    [canManage, cuisineId, foods, reorderMutation],
  );

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-dashed bg-muted/20 px-4 py-4 text-sm text-muted-foreground">
        <LoaderCircleIcon className="animate-spin" />
        Oshxona ichidagi ovqatlar yuklanmoqda...
      </div>
    );
  }

  if (!size(foods)) {
    return (
      <div className="rounded-2xl border border-dashed bg-muted/20 px-4 py-4 text-sm text-muted-foreground">
        Bu oshxonada hozircha ovqat yo'q.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-4 pb-4">
      <DataGridContainer>
        <ScrollArea className="w-full">
          <DataGrid
            table={table}
            tableLayout={{ rowsDraggable: canManage, width: "auto" }}
            isLoading={isLoading}
          >
            {canManage ? (
              <DataGridTableDndRows
                dataIds={map(foods, (food) => toString(food.id))}
                handleDragEnd={handleDragEnd}
              />
            ) : (
              <DataGridTable />
            )}
          </DataGrid>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </DataGridContainer>
      {isFetching || reorderMutation.isPending ? (
        <p className="text-xs text-muted-foreground">
          O'zgarishlar yangilanmoqda...
        </p>
      ) : null}
    </div>
  );
};

export default CuisineFoodsGrid;
