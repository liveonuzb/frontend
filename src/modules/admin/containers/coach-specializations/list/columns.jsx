/* eslint-disable react-refresh/only-export-components */
import React from "react";
import { get, map as lodashMap } from "lodash";
import dayjs from "dayjs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DataGridColumnHeader,
  DataGridTableDndRowHandle,
} from "@/components/reui/data-grid";
import { cn } from "@/lib/utils";
import SpecializationActionsMenu from "./actions-menu.jsx";

const CATEGORY_CONFIG = {
  FITNESS: {
    label: "Fitness",
    emoji: "\uD83D\uDCAA",
    color: "bg-orange-500/10 text-orange-700 border-orange-200",
  },
  YOGA: {
    label: "Yoga",
    emoji: "\uD83E\uDDD8",
    color: "bg-purple-500/10 text-purple-700 border-purple-200",
  },
  BOXING: {
    label: "Boks",
    emoji: "\uD83E\uDD4A",
    color: "bg-red-500/10 text-red-700 border-red-200",
  },
  FOOTBALL: {
    label: "Futbol",
    emoji: "\u26BD",
    color: "bg-green-500/10 text-green-700 border-green-200",
  },
  SWIMMING: {
    label: "Suzish",
    emoji: "\uD83C\uDFCA",
    color: "bg-blue-500/10 text-blue-700 border-blue-200",
  },
  TENNIS: {
    label: "Tennis",
    emoji: "\uD83C\uDFBE",
    color: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
  },
  BASKETBALL: {
    label: "Basketbol",
    emoji: "\uD83C\uDFC0",
    color: "bg-amber-500/10 text-amber-700 border-amber-200",
  },
  MARTIAL_ARTS: {
    label: "Jang san'ati",
    emoji: "\uD83E\uDD4B",
    color: "bg-slate-500/10 text-slate-700 border-slate-200",
  },
  RUNNING: {
    label: "Yugurish",
    emoji: "\uD83C\uDFC3",
    color: "bg-cyan-500/10 text-cyan-700 border-cyan-200",
  },
  GYMNASTICS: {
    label: "Gimnastika",
    emoji: "\uD83E\uDD38",
    color: "bg-pink-500/10 text-pink-700 border-pink-200",
  },
  DANCE: {
    label: "Raqs",
    emoji: "\uD83D\uDC83",
    color: "bg-fuchsia-500/10 text-fuchsia-700 border-fuchsia-200",
  },
  CHEERLEADING: {
    label: "Cheerleading",
    emoji: "\uD83D\uDCE3",
    color: "bg-rose-500/10 text-rose-700 border-rose-200",
  },
  SKATING: {
    label: "Muz uchish",
    emoji: "\u26F8\uFE0F",
    color: "bg-sky-500/10 text-sky-700 border-sky-200",
  },
  CYCLING: {
    label: "Velosiped",
    emoji: "\uD83D\uDEB4",
    color: "bg-lime-500/10 text-lime-700 border-lime-200",
  },
  CLIMBING: {
    label: "Toqqa chiqish",
    emoji: "\uD83E\uDDD7",
    color: "bg-stone-500/10 text-stone-700 border-stone-200",
  },
  OTHER: {
    label: "Boshqa",
    emoji: "\uD83C\uDFC5",
    color: "bg-gray-500/10 text-gray-700 border-gray-200",
  },
};

export { CATEGORY_CONFIG };

const imageSkeleton = (
  <div className="flex h-[41px] items-center">
    <Skeleton className="size-8 rounded-full" />
  </div>
);

const nameSkeleton = (
  <div className="flex h-[41px] items-center gap-3">
    <Skeleton className="size-8 rounded-full" />
    <div className="space-y-1">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-4 w-16" />
    </div>
  </div>
);

const translationsSkeleton = (
  <div className="flex h-[41px] items-center gap-1">
    <Skeleton className="size-5 rounded" />
    <Skeleton className="size-5 rounded" />
    <Skeleton className="size-5 rounded" />
  </div>
);

const categorySkeleton = (
  <div className="flex h-[41px] items-center">
    <Skeleton className="h-6 w-28 rounded-full" />
  </div>
);

const statusSkeleton = (
  <div className="flex h-[41px] items-center">
    <Skeleton className="h-6 w-10 rounded-full" />
  </div>
);

const dateSkeleton = (
  <div className="flex h-[41px] items-center">
    <Skeleton className="h-5 w-24" />
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
  canReorder,
  currentLanguage,
  isUpdating,
  onToggleActive,
  resolveLabel,
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
        meta: {
          skeleton: iconSkeleton,
        },
        size: 32,
      },
      {
        accessorKey: "imageUrl",
        header: "Rasm",
        cell: (info) => {
          const item = get(info, "row.original");
          const imageUrl = info.getValue();

          return (
            <div className="flex size-12 items-center justify-center overflow-hidden rounded-xl border bg-muted/30">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={get(item, "name", "Yo'nalish rasmi")}
                  className="size-full object-cover"
                />
              ) : (
                <span className="text-xl">{get(item, "emoji") || "-"}</span>
              )}
            </div>
          );
        },
        meta: {
          skeleton: imageSkeleton,
        },
        enableSorting: false,
        size: 72,
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Nomi" />
        ),
        cell: (info) => (
          <div className="font-medium">
            {resolveLabel(info.row.original, currentLanguage)}
          </div>
        ),
        meta: {
          skeleton: nameSkeleton,
        },
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
              {lodashMap(activeLanguages, (language) => (
                <div
                  key={get(language, "id", get(language, "code"))}
                  className={cn(
                    "flex size-5 items-center justify-center rounded border text-[10px]",
                    resolveLabel(item, get(language, "code"), false)
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-transparent bg-muted opacity-40",
                  )}
                >
                  {get(language, "flag")}
                </div>
              ))}
            </div>
          );
        },
        meta: {
          skeleton: translationsSkeleton,
        },
        enableSorting: false,
        size: 120,
      },
      {
        accessorKey: "category",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Kategoriya" />
        ),
        cell: (info) => {
          const value = info.getValue();
          const config = get(CATEGORY_CONFIG, value);
          if (!config) {
            return (
              <span className="text-sm text-muted-foreground">
                {value || "-"}
              </span>
            );
          }
          return (
            <Badge
              variant="outline"
              className={cn("gap-1 font-medium", get(config, "color"))}
            >
              {get(config, "emoji")} {get(config, "label")}
            </Badge>
          );
        },
        meta: {
          skeleton: categorySkeleton,
        },
        enableSorting: true,
        size: 170,
      },
      {
        accessorKey: "isActive",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Status" />
        ),
        cell: (info) => {
          const isActive = info.getValue();
          const item = get(info, "row.original");
          return (
            <div className="flex items-center">
              <Switch
                checked={isActive}
                disabled={isUpdating}
                onCheckedChange={() => onToggleActive(item)}
              />
            </div>
          );
        },
        meta: {
          skeleton: statusSkeleton,
        },
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
        meta: {
          skeleton: dateSkeleton,
        },
        enableSorting: true,
        size: 140,
      },
      {
        id: "actions",
        header: "",
        size: 50,
        enableSorting: false,
        cell: (info) => (
          <div className="flex justify-end">
            <SpecializationActionsMenu
              item={get(info, "row.original")}
              onTranslate={onTranslate}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        ),
        meta: {
          skeleton: iconSkeleton,
        },
      },
    ],
    [
      activeLanguages,
      canReorder,
      currentLanguage,
      isUpdating,
      onToggleActive,
      resolveLabel,
      onTranslate,
      onEdit,
      onDelete,
    ],
  );
};
