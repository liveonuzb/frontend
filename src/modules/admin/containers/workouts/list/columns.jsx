import React from "react";
import {
  filter as lodashFilter,
  get,
  isObject,
  map as lodashMap,
  trim,
  find,
} from "lodash";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DataGridColumnHeader,
  DataGridTableRowSelect,
  DataGridTableRowSelectAll,
  DataGridTableDndRowHandle,
} from "@/components/reui/data-grid";
import { cn } from "@/lib/utils";
import { getCategoryBadgeAppearance } from "@/lib/category-badge";
import { adminListSkeletons } from "@/modules/admin/components/admin-list-skeletons.jsx";
import ActionsMenu from "./actions-menu.jsx";
import WorkoutImageCell from "./workout-image-cell.jsx";

const resolveLabel = (translations, fallback, language) => {
  if (isObject(translations)) {
    const direct = trim(String(get(translations, language, "")));
    if (direct) return direct;

    const uz = trim(String(get(translations, "uz", "")));
    if (uz) return uz;

    const first = find(Object.values(translations), (value) =>
      trim(String(value)),
    );
    if (first) return trim(String(first));
  }

  return fallback;
};

const ITEMS_PER_PAGE = 10;

export const useColumns = ({
  activeLanguages,
  canHardDelete,
  canReorder,
  categoryById,
  currentLanguage,
  currentPage,
  handleToggleOnboarding,
  handleToggleStatus,
  handleRestoreWorkout,
  openEditDrawer,
  openTranslationsDrawer,
  setWorkoutToDelete,
  setHardDeleteTarget,
}) => {
  return React.useMemo(
    () => [
      {
        id: "select",
        header: () => <DataGridTableRowSelectAll />,
        cell: ({ row }) => <DataGridTableRowSelect row={row} />,
        enableSorting: false,
        meta: { skeleton: adminListSkeletons.action },
        size: 40,
      },
      ...(canReorder
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
        accessorKey: "id",
        header: "#",
        cell: (info) => (currentPage - 1) * ITEMS_PER_PAGE + info.row.index + 1,
        meta: { skeleton: adminListSkeletons.index },
        size: 60,
      },
      {
        id: "image",
        header: "Rasm/Video",
        cell: (info) => <WorkoutImageCell workout={info.row.original} />,
        meta: { skeleton: adminListSkeletons.image },
        size: 72,
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Mashg'ulot" />
        ),
        enableSorting: true,
        meta: { skeleton: adminListSkeletons.avatarText },
        cell: (info) => (
          <div className="flex flex-col gap-0.5">
            <div className="font-medium">
              {resolveLabel(
                info.row.original.translations,
                info.row.original.name,
                currentLanguage,
              )}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "equipments",
        header: "Inventar",
        meta: { skeleton: adminListSkeletons.badge },
        cell: (info) => (
          <div className="flex flex-wrap gap-1 max-w-[150px]">
            {lodashMap(info.getValue(), (eq, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                className="text-[9px] px-1 h-4"
              >
                {eq}
              </Badge>
            ))}
          </div>
        ),
        size: 150,
      },
      {
        accessorKey: "categoryIds",
        header: "Kategoriyalar",
        meta: { skeleton: adminListSkeletons.badge },
        cell: (info) => (
          <div className="flex flex-wrap gap-1">
            {lodashMap(info.row.original.categories || [], (item) => {
              const category = item || get(categoryById, item?.id);
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
        meta: { skeleton: adminListSkeletons.translations },
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
        accessorKey: "isOnboarding",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Onboarding" />
        ),
        enableSorting: true,
        meta: { skeleton: adminListSkeletons.status },
        cell: (info) => {
          const workout = info.row.original;

          return (
            <div className="flex justify-center">
              <Switch
                checked={Boolean(info.getValue())}
                onCheckedChange={() => void handleToggleOnboarding(workout)}
                disabled={workout.isTrashed}
              />
            </div>
          );
        },
        size: 120,
      },
      {
        accessorKey: "isActive",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Status" />
        ),
        enableSorting: true,
        meta: { skeleton: adminListSkeletons.status },
        cell: (info) => {
          const workout = info.row.original;

          return (
            <div className="flex justify-center">
              <Switch
                checked={Boolean(info.getValue())}
                onCheckedChange={() => void handleToggleStatus(workout)}
                disabled={workout.isTrashed}
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
        meta: { skeleton: adminListSkeletons.action },
        cell: (info) => (
          <div className="flex justify-end">
            <ActionsMenu
              workout={info.row.original}
              canHardDelete={canHardDelete}
              onEdit={openEditDrawer}
              onDelete={setWorkoutToDelete}
              onRestore={handleRestoreWorkout}
              onHardDelete={setHardDeleteTarget}
              onTranslations={openTranslationsDrawer}
            />
          </div>
        ),
      },
    ],
    [
      activeLanguages,
      canHardDelete,
      canReorder,
      categoryById,
      currentLanguage,
      currentPage,
      handleRestoreWorkout,
      handleToggleOnboarding,
      handleToggleStatus,
      openEditDrawer,
      openTranslationsDrawer,
      setWorkoutToDelete,
      setHardDeleteTarget,
    ],
  );
};
