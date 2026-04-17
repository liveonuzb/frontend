import React from "react";
import { get, map as lodashMap } from "lodash";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { DataGridColumnHeader, DataGridTableRowSelect, DataGridTableRowSelectAll, DataGridTableDndRowHandle } from "@/components/reui/data-grid";
import { cn } from "@/lib/utils";
import { getCategoryBadgeAppearance } from "@/lib/category-badge";
import ActionsMenu from "./actions-menu.jsx";
import FoodImageCell from "./food-image-cell.jsx";

export const useColumns = ({
  activeLanguages,
  canReorder,
  categoryById,
  currentLanguage,
  currentPage,
  pageSize,
  resolveLabel,
  handleToggleStatus,
  handleRestoreFood,
  openEditDrawer,
  openTranslationsDrawer,
  setFoodToDelete,
  setHardDeleteTarget,
}) => {
  return React.useMemo(
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
        accessorKey: "imageUrl",
        header: "Rasm",
        cell: (info) => <FoodImageCell food={info.row.original} />,
        size: 72,
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Ovqat" />
        ),
        enableSorting: true,
        cell: (info) => (
          <div className="font-medium">
            {resolveLabel(
              info.row.original.translations,
              info.row.original.name,
              currentLanguage,
            )}
          </div>
        ),
      },
      {
        accessorKey: "categoryIds",
        header: "Kategoriyalar",
        cell: (info) => (
          <div className="flex flex-wrap gap-1">
            {lodashMap(info.getValue(), (categoryId) => {
              const category = get(categoryById, categoryId);
              if (!category) return null;
              const appearance = getCategoryBadgeAppearance(category.color);

              return (
                <Badge
                  key={category.id}
                  variant="outline"
                  className={cn("text-[10px] px-1.5 h-5", appearance.className)}
                  style={appearance.style}
                >
                  {resolveLabel(
                    category.translations,
                    category.name,
                    currentLanguage,
                  )}
                </Badge>
              );
            })}
          </div>
        ),
      },
      {
        id: "translations",
        header: "Tarjimalar",
        cell: (info) => {
          const translations = get(info, "row.original.translations", {});

          return (
            <div className="flex items-center gap-1">
              {lodashMap(activeLanguages, (language) => (
                <div
                  key={language.id}
                  className={cn(
                    "size-5 rounded border flex items-center justify-center text-[10px]",
                    get(translations, language.code)
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-muted border-transparent opacity-40",
                  )}
                >
                  {language.flag}
                </div>
              ))}
            </div>
          );
        },
      },
      {
        accessorKey: "calories",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Kaloriya" />
        ),
        enableSorting: true,
        cell: (info) => (
          <div className="text-right font-medium">{info.getValue()}</div>
        ),
        size: 90,
      },
      {
        accessorKey: "servingSize",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Birlik" />
        ),
        enableSorting: true,
        cell: (info) => (
          <div className="text-muted-foreground text-xs">
            {info.getValue()} {info.row.original.servingUnit}
          </div>
        ),
        size: 100,
      },
      {
        accessorKey: "isActive",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Status" />
        ),
        enableSorting: true,
        cell: (info) => {
          const food = info.row.original;

          return (
            <div className="flex justify-center">
              <Switch
                checked={Boolean(info.getValue())}
                onCheckedChange={() => void handleToggleStatus(food)}
                disabled={food.isTrashed}
              />
            </div>
          );
        },
        size: 84,
      },
      {
        id: "actions",
        header: "",
        size: 50,
        cell: (info) => (
          <div className="flex justify-end">
            <ActionsMenu
              food={info.row.original}
              onEdit={openEditDrawer}
              onDelete={setFoodToDelete}
              onRestore={handleRestoreFood}
              onHardDelete={setHardDeleteTarget}
              onTranslations={openTranslationsDrawer}
            />
          </div>
        ),
      },
    ],
    [
      activeLanguages,
      canReorder,
      categoryById,
      currentLanguage,
      currentPage,
      pageSize,
      resolveLabel,
      handleToggleStatus,
      handleRestoreFood,
      openEditDrawer,
      openTranslationsDrawer,
      setFoodToDelete,
      setHardDeleteTarget,
    ],
  );
};
