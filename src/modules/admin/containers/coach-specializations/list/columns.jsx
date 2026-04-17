import React from "react";
import { get } from "lodash";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import SpecializationActionsMenu from "./actions-menu.jsx";

const CATEGORY_CONFIG = {
  FITNESS: { label: "Fitness", emoji: "\uD83D\uDCAA", color: "bg-orange-500/10 text-orange-700 border-orange-200" },
  YOGA: { label: "Yoga", emoji: "\uD83E\uDDD8", color: "bg-purple-500/10 text-purple-700 border-purple-200" },
  BOXING: { label: "Boks", emoji: "\uD83E\uDD4A", color: "bg-red-500/10 text-red-700 border-red-200" },
  FOOTBALL: { label: "Futbol", emoji: "\u26BD", color: "bg-green-500/10 text-green-700 border-green-200" },
  SWIMMING: { label: "Suzish", emoji: "\uD83C\uDFCA", color: "bg-blue-500/10 text-blue-700 border-blue-200" },
  TENNIS: { label: "Tennis", emoji: "\uD83C\uDFBE", color: "bg-yellow-500/10 text-yellow-700 border-yellow-200" },
  BASKETBALL: { label: "Basketbol", emoji: "\uD83C\uDFC0", color: "bg-amber-500/10 text-amber-700 border-amber-200" },
  MARTIAL_ARTS: { label: "Jang san'ati", emoji: "\uD83E\uDD4B", color: "bg-slate-500/10 text-slate-700 border-slate-200" },
  RUNNING: { label: "Yugurish", emoji: "\uD83C\uDFC3", color: "bg-cyan-500/10 text-cyan-700 border-cyan-200" },
  GYMNASTICS: { label: "Gimnastika", emoji: "\uD83E\uDD38", color: "bg-pink-500/10 text-pink-700 border-pink-200" },
  DANCE: { label: "Raqs", emoji: "\uD83D\uDC83", color: "bg-fuchsia-500/10 text-fuchsia-700 border-fuchsia-200" },
  CHEERLEADING: { label: "Cheerleading", emoji: "\uD83D\uDCE3", color: "bg-rose-500/10 text-rose-700 border-rose-200" },
  SKATING: { label: "Muz uchish", emoji: "\u26F8\uFE0F", color: "bg-sky-500/10 text-sky-700 border-sky-200" },
  CYCLING: { label: "Velosiped", emoji: "\uD83D\uDEB4", color: "bg-lime-500/10 text-lime-700 border-lime-200" },
  CLIMBING: { label: "Toqqa chiqish", emoji: "\uD83E\uDDD7", color: "bg-stone-500/10 text-stone-700 border-stone-200" },
  OTHER: { label: "Boshqa", emoji: "\uD83C\uDFC5", color: "bg-gray-500/10 text-gray-700 border-gray-200" },
};

export { CATEGORY_CONFIG };

export const useColumns = ({
  isUpdating,
  onToggleActive,
  onEdit,
  onDelete,
}) => {
  return React.useMemo(
    () => [
      {
        accessorKey: "emoji",
        header: "Emoji",
        cell: (info) => (
          <div className="text-2xl">{info.getValue() || "-"}</div>
        ),
        size: 70,
      },
      {
        accessorKey: "nameUz",
        header: "Nomi (UZ)",
        cell: (info) => (
          <div className="font-semibold">{info.getValue() || "-"}</div>
        ),
      },
      {
        accessorKey: "nameRu",
        header: "Nomi (RU)",
        cell: (info) => (
          <div className="text-muted-foreground text-sm">
            {info.getValue() || "-"}
          </div>
        ),
      },
      {
        accessorKey: "nameEn",
        header: "Nomi (EN)",
        cell: (info) => (
          <div className="text-muted-foreground text-sm">
            {info.getValue() || "-"}
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: "Kategoriya",
        cell: (info) => {
          const value = info.getValue();
          const config = get(CATEGORY_CONFIG, value);
          if (!config) {
            return <span className="text-muted-foreground text-sm">{value || "-"}</span>;
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
        size: 180,
      },
      {
        accessorKey: "sortOrder",
        header: "Tartib",
        cell: (info) => (
          <span className="text-muted-foreground text-sm font-mono">
            {info.getValue() ?? "-"}
          </span>
        ),
        size: 80,
      },
      {
        accessorKey: "isActive",
        header: "Holat",
        cell: (info) => {
          const isActive = info.getValue();
          const item = get(info, "row.original");
          return (
            <div className="flex items-center gap-2">
              <Switch
                checked={isActive}
                disabled={isUpdating}
                onCheckedChange={() => onToggleActive(item)}
              />
              <span
                className={cn(
                  "text-xs font-medium",
                  isActive ? "text-green-600" : "text-muted-foreground",
                )}
              >
                {isActive ? "Faol" : "Nofaol"}
              </span>
            </div>
          );
        },
        size: 150,
      },
      {
        id: "actions",
        header: "",
        size: 50,
        cell: (info) => (
          <div className="flex justify-end">
            <SpecializationActionsMenu
              item={get(info, "row.original")}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        ),
      },
    ],
    [isUpdating, onToggleActive, onEdit, onDelete],
  );
};
