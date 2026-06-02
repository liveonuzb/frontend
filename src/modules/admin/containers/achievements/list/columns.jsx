import React from "react";
import get from "lodash/get";
import lodashMap from "lodash/map";
import dayjs from "dayjs";
import { ImageIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DataGridColumnHeader,
  DataGridTableDndRowHandle,
} from "@/components/reui/data-grid";
import { cn } from "@/lib/utils";
import SafeAdminText from "@/modules/admin/components/safe-admin-text.jsx";
import {
  ACHIEVEMENT_CATEGORY_LABELS,
  ACHIEVEMENT_METRIC_LABELS,
  resolveAchievementImage,
} from "../api";
import AchievementActionsMenu from "./actions-menu.jsx";

const imageSkeleton = (
  <div className="flex h-[41px] items-center">
    <Skeleton className="size-10 rounded-xl" />
  </div>
);

const textSkeleton = (
  <div className="flex h-[41px] items-center">
    <Skeleton className="h-5 w-28" />
  </div>
);

const nameSkeleton = (
  <div className="flex h-[41px] items-center gap-3">
    <Skeleton className="size-10 rounded-xl" />
    <div className="space-y-1">
      <Skeleton className="h-5 w-28" />
      <Skeleton className="h-4 w-40" />
    </div>
  </div>
);

const statusSkeleton = (
  <div className="flex h-[41px] items-center">
    <Skeleton className="h-6 w-10 rounded-full" />
  </div>
);

const translationsSkeleton = (
  <div className="flex h-[41px] items-center gap-1">
    <Skeleton className="size-5 rounded" />
    <Skeleton className="size-5 rounded" />
    <Skeleton className="size-5 rounded" />
  </div>
);

const iconSkeleton = (
  <div className="flex h-[41px] items-center justify-end">
    <Skeleton className="size-8 rounded-md" />
  </div>
);

const formatDate = (value) => {
  if (!value) return "-";
  return dayjs(value).format("DD.MM.YYYY HH:mm");
};

export const useColumns = ({
  activeLanguages,
  canManage,
  canReorder,
  currentMode,
  currentLanguage,
  isUpdating,
  onToggleActive,
  onImages,
  onTranslate,
  onEdit,
  onDelete,
}) => {
  return React.useMemo(
    () => [
      {
        id: "dnd",
        header: "",
        cell: () => (canReorder ? <DataGridTableDndRowHandle /> : null),
        enableSorting: false,
        meta: { skeleton: iconSkeleton },
        size: 32,
      },
      {
        id: "image",
        header: "Rasm",
        cell: (info) => {
          const item = get(info, "row.original");
          const imageUrl = resolveAchievementImage(item, currentMode);

          return (
            <div className="flex size-12 items-center justify-center overflow-hidden rounded-xl border bg-muted/30">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={get(item, "name", "Achievement rasmi")}
                  className="size-full object-cover"
                />
              ) : (
                <ImageIcon className="size-5 text-muted-foreground" />
              )}
            </div>
          );
        },
        meta: { skeleton: imageSkeleton },
        enableSorting: false,
        size: 72,
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Nomi" />
        ),
        cell: (info) => {
          const item = get(info, "row.original");
          const name =
            get(item, `translations.${currentLanguage}`) ||
            get(item, "translations.uz") ||
            get(item, "name");
          const description =
            get(item, `descriptionTranslations.${currentLanguage}`) ||
            get(item, "descriptionTranslations.uz") ||
            get(item, "description");
          return (
            <div className="min-w-0">
              <SafeAdminText
                as="div"
                className="truncate font-medium"
                value={name}
                fallback="Nomsiz"
                title
              />
              <SafeAdminText
                as="div"
                className="line-clamp-1 text-xs text-muted-foreground"
                value={description}
              />
            </div>
          );
        },
        meta: { skeleton: nameSkeleton },
        enableSorting: true,
        size: 280,
      },
      {
        id: "translations",
        header: "Tarjimalar",
        cell: (info) => {
          const item = get(info, "row.original");

          return (
            <div className="flex items-center gap-1">
              {lodashMap(activeLanguages, (language) => {
                const code = get(language, "code");
                const hasTranslation =
                  Boolean(get(item, `translations.${code}`)) &&
                  Boolean(get(item, `descriptionTranslations.${code}`));

                return (
                  <div
                    key={get(language, "id", code)}
                    className={cn(
                      "flex size-5 items-center justify-center rounded border text-[10px]",
                      hasTranslation
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-transparent bg-muted opacity-40",
                    )}
                  >
                    {get(language, "flag")}
                  </div>
                );
              })}
            </div>
          );
        },
        meta: { skeleton: translationsSkeleton },
        enableSorting: false,
        size: 120,
      },
      {
        accessorKey: "category",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Kategoriya" />
        ),
        cell: (info) => (
          <Badge variant="outline">
            {ACHIEVEMENT_CATEGORY_LABELS[info.getValue()] ?? info.getValue()}
          </Badge>
        ),
        meta: { skeleton: textSkeleton },
        enableSorting: true,
        size: 150,
      },
      {
        accessorKey: "metric",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Metric" />
        ),
        cell: (info) => (
          <span className="text-sm">
            {ACHIEVEMENT_METRIC_LABELS[info.getValue()] ?? info.getValue()}
          </span>
        ),
        meta: { skeleton: textSkeleton },
        enableSorting: true,
        size: 170,
      },
      {
        accessorKey: "threshold",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Threshold" />
        ),
        cell: (info) => <span className="text-sm">{info.getValue()}</span>,
        meta: { skeleton: textSkeleton },
        enableSorting: true,
        size: 120,
      },
      {
        accessorKey: "xpReward",
        header: ({ column }) => <DataGridColumnHeader column={column} title="XP" />,
        cell: (info) => (
          <span className="text-sm font-medium">+{info.getValue()}</span>
        ),
        meta: { skeleton: textSkeleton },
        enableSorting: true,
        size: 90,
      },
      {
        id: "usage",
        header: "Foydalanish",
        cell: (info) => {
          const item = get(info, "row.original");
          return (
            <div className="text-sm">
              <p>{get(item, "userAchievementCount", 0)} ta progress</p>
              <p className="text-xs text-muted-foreground">
                {get(item, "unlockedUsersCount", 0)} ta unlock
              </p>
            </div>
          );
        },
        meta: { skeleton: textSkeleton },
        enableSorting: false,
        size: 140,
      },
      {
        accessorKey: "isActive",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Status" />
        ),
        cell: (info) => {
          const item = get(info, "row.original");
          return (
            <div className="flex items-center">
              <Switch
                checked={info.getValue()}
                disabled={!canManage || isUpdating}
                onCheckedChange={() => onToggleActive(item)}
              />
            </div>
          );
        },
        meta: { skeleton: statusSkeleton },
        enableSorting: true,
        size: 84,
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Yaratilgan" />
        ),
        cell: (info) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(info.getValue())}
          </span>
        ),
        meta: { skeleton: textSkeleton },
        enableSorting: true,
        size: 140,
      },
      {
        id: "actions",
        header: "",
        size: 50,
        enableSorting: false,
        cell: (info) => (
          <div className={cn("flex justify-end")}>
            <AchievementActionsMenu
              item={get(info, "row.original")}
              canManage={canManage}
              onImages={onImages}
              onTranslate={onTranslate}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        ),
        meta: { skeleton: iconSkeleton },
      },
    ],
    [
      activeLanguages,
      canManage,
      canReorder,
      currentMode,
      currentLanguage,
      isUpdating,
      onToggleActive,
      onImages,
      onTranslate,
      onEdit,
      onDelete,
    ],
  );
};
