import React from "react";
import {
  filter as lodashFilter,
  find,
  get,
  map,
  size,
  trim,
  toString,
} from "lodash";
import { ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DataGridTableDndRowHandle,
} from "@/components/reui/data-grid";
import ActionsMenu from "./actions-menu.jsx";

const resolveLabel = (translations, fallback, language) => {
  if (translations && typeof translations === "object") {
    const direct = get(translations, language);
    if (typeof direct === "string" && trim(direct)) {
      return trim(direct);
    }

    const uz = get(translations, "uz");
    if (typeof uz === "string" && trim(uz)) {
      return trim(uz);
    }

    const first = find(
      Object.values(translations),
      (value) => typeof value === "string" && trim(value),
    );
    if (typeof first === "string" && trim(first)) {
      return trim(first);
    }
  }

  return fallback;
};

const countFilledTranslations = (translations = {}) =>
  size(
    lodashFilter(
      Object.values(translations),
      (value) => typeof value === "string" && trim(value).length > 0,
    ),
  );

export const useColumns = ({
  activeLanguages,
  currentLanguage,
  isReorderEnabled,
  handleToggleStatus,
  openEditDrawer,
  openTranslationsDrawer,
  setEquipmentToDelete,
}) => {
  return React.useMemo(
    () => [
      {
        id: "dnd",
        header: "",
        size: 32,
        cell: () =>
          isReorderEnabled ? (
            <DataGridTableDndRowHandle />
          ) : (
            <span className="block size-4" />
          ),
      },
      {
        accessorKey: "imageUrl",
        header: "Rasm",
        size: 92,
        cell: (info) => {
          const equipment = info.row.original;

          return equipment.imageUrl ? (
            <div className="size-12 overflow-hidden rounded-xl border bg-muted">
              <img
                src={equipment.imageUrl}
                alt={equipment.name}
                className="size-full object-cover"
              />
            </div>
          ) : (
            <div className="flex size-12 items-center justify-center rounded-xl border border-dashed bg-muted/30 text-muted-foreground">
              <ImageIcon className="size-4" />
            </div>
          );
        },
      },
      {
        accessorKey: "name",
        header: "Jihoz",
        meta: {
          cellClassName: "w-[34%]",
        },
        cell: (info) => {
          const equipment = info.row.original;
          const localizedName = resolveLabel(
            equipment.translations,
            equipment.name,
            currentLanguage,
          );

          return (
            <div className="min-w-0">
              <p className="truncate font-medium">{localizedName}</p>
              <p className="truncate text-xs text-muted-foreground">
                Asl nom: {equipment.name}
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: "translations",
        header: "Tarjimalar",
        size: 150,
        cell: (info) => {
          const equipment = info.row.original;
          const filledCount = countFilledTranslations(
            equipment.translations || {},
          );
          const isComplete =
            activeLanguages.length > 0 && filledCount >= activeLanguages.length;

          return (
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {filledCount}/{activeLanguages.length || 1}
              </Badge>
              {isComplete ? (
                <Badge
                  variant="outline"
                  className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                >
                  To'liq
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-amber-500/10 text-amber-700 dark:text-amber-400"
                >
                  Kam
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "isActive",
        header: "Status",
        size: 110,
        cell: (info) => {
          const equipment = info.row.original;

          return (
            <div className="flex items-center gap-3">
              <Switch
                checked={equipment.isActive}
                onCheckedChange={(checked) =>
                  handleToggleStatus(equipment, checked)
                }
              />
              <span className="text-sm">
                {equipment.isActive ? "Faol" : "Nofaol"}
              </span>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "",
        size: 50,
        cell: (info) => (
          <div className="flex justify-end">
            <ActionsMenu
              equipment={get(info, "row.original")}
              onEdit={openEditDrawer}
              onDelete={setEquipmentToDelete}
              onTranslations={openTranslationsDrawer}
            />
          </div>
        ),
      },
    ],
    [
      activeLanguages.length,
      currentLanguage,
      handleToggleStatus,
      isReorderEnabled,
      openEditDrawer,
      openTranslationsDrawer,
      setEquipmentToDelete,
    ],
  );
};
