/* eslint-disable react-refresh/only-export-components */
import React from "react";
import { useTranslation } from "react-i18next";
import { get, isObject, map as lodashMap, trim, find, values as lodashValues } from "lodash";
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

const SWITCH_CELL_CLASS_NAME =
  "flex min-h-10 w-full items-center justify-center";

const SWITCH_COLUMN_META = {
  skeleton: adminListSkeletons.status,
  headerClassName: "text-center",
  cellClassName: "text-center",
};

const CenteredColumnHeader = ({ column, title }) => (
  <div className="flex w-full justify-center">
    <DataGridColumnHeader
      column={column}
      title={title}
      className="mx-0 justify-center"
    />
  </div>
);

const resolveLabel = (translations, fallback, language) => {
  if (isObject(translations)) {
    const direct = trim(String(get(translations, language, "")));
    if (direct) return direct;

    const uz = trim(String(get(translations, "uz", "")));
    if (uz) return uz;

    const first = find(lodashValues(translations), (value) =>
      trim(String(value)),
    );
    if (first) return trim(String(first));
  }

  return fallback;
};

const ITEMS_PER_PAGE = 10;

const useColumns = ({
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
  const { t } = useTranslation();

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
        header: t("admin.workouts.columns.media"),
        cell: (info) => <WorkoutImageCell workout={info.row.original} />,
        meta: { skeleton: adminListSkeletons.image },
        size: 72,
      },
      {
        id: "mediaReview",
        header: t("admin.workouts.columns.mediaStatus"),
        meta: { skeleton: adminListSkeletons.badge },
        cell: (info) => {
          const media = get(info.row.original, "mediaReview", {});
          const imageStatus = get(media, "imageStatus", "missing");
          const videoStatus = get(media, "videoStatus", "missing");
          const moderationStatus = get(
            media,
            "moderationStatus",
            "needs_review",
          );

          return (
            <div className="flex max-w-[190px] flex-wrap gap-1">
              <Badge
                variant={imageStatus === "ready" ? "secondary" : "outline"}
                className="h-5 px-1.5 text-[10px]"
              >
                {t("admin.workouts.columns.imageStatus", {
                  status: imageStatus,
                })}
              </Badge>
              <Badge
                variant={videoStatus === "review" ? "destructive" : "outline"}
                className="h-5 px-1.5 text-[10px]"
              >
                {t("admin.workouts.columns.videoStatus", {
                  status: videoStatus,
                })}
              </Badge>
              <Badge
                variant={
                  moderationStatus === "approved" ? "secondary" : "outline"
                }
                className="h-5 px-1.5 text-[10px]"
              >
                {moderationStatus}
              </Badge>
            </div>
          );
        },
        size: 200,
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataGridColumnHeader
            column={column}
            title={t("admin.workouts.columns.workout")}
          />
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
        header: t("admin.workouts.columns.equipment"),
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
        header: t("admin.workouts.columns.categories"),
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
        header: t("admin.workoutPlans.columns.translations"),
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
          <CenteredColumnHeader
            column={column}
            title={t("admin.workouts.columns.onboarding")}
          />
        ),
        enableSorting: true,
        meta: SWITCH_COLUMN_META,
        cell: (info) => {
          const workout = info.row.original;

          return (
            <div className={SWITCH_CELL_CLASS_NAME}>
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
          <CenteredColumnHeader column={column} title={t("admin.common.status")} />
        ),
        enableSorting: true,
        meta: SWITCH_COLUMN_META,
        cell: (info) => {
          const workout = info.row.original;

          return (
            <div className={SWITCH_CELL_CLASS_NAME}>
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
      t,
    ],
  );
};

export default useColumns;
