import React from "react";
import {
  find,
  get,
  map,
  trim,
} from "lodash";
import { ImageIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  DataGridTableDndRowHandle,
} from "@/components/reui/data-grid";
import { cn } from "@/lib/utils";
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
              <img loading="lazy"
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
        id: "translations",
        header: "Tarjimalar",
        size: 150,
        cell: (info) => {
          const equipment = info.row.original;
          const translations = equipment.translations || {};

          return (
            <div className="flex items-center gap-1">
              {map(activeLanguages, (language) => {
                const code = get(language, "code");
                const hasTranslation = Boolean(trim(get(translations, code, "")));

                return (
                  <div
                    key={get(language, "id", code)}
                    title={`${get(language, "name", code)}: ${hasTranslation ? "Bor" : "Yo'q"}`}
                    className={cn(
                      "flex size-5 items-center justify-center rounded border text-[10px]",
                      hasTranslation
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-transparent bg-muted opacity-40",
                    )}
                  >
                    {get(language, "flag") || code}
                  </div>
                );
              })}
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
      activeLanguages,
      currentLanguage,
      handleToggleStatus,
      isReorderEnabled,
      openEditDrawer,
      openTranslationsDrawer,
      setEquipmentToDelete,
    ],
  );
};
