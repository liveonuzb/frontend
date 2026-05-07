import React from "react";
import { find, get, map, trim } from "lodash";
import { ImageIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { DataGridTableDndRowHandle } from "@/components/reui/data-grid";
import { cn } from "@/lib/utils";
import { adminListSkeletons } from "@/modules/admin/components/admin-list-skeletons.jsx";
import ActionsMenu from "./actions-menu.jsx";

const SWITCH_CELL_CLASS_NAME =
  "flex min-h-10 w-full items-center justify-center";

const SWITCH_COLUMN_META = {
  skeleton: adminListSkeletons.status,
  headerClassName: "text-center",
  cellClassName: "text-center",
};

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
  handleToggleOnboarding,
  handleToggleHome,
  handleToggleStreet,
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
        meta: { skeleton: adminListSkeletons.action },
      },
      {
        accessorKey: "imageUrl",
        header: "Rasm",
        enableSorting: false,
        size: 92,
        meta: { skeleton: adminListSkeletons.image },
        cell: (info) => {
          const equipment = info.row.original;

          return equipment.imageUrl ? (
            <div className="size-12 overflow-hidden rounded-xl border bg-muted">
              <img
                loading="lazy"
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
        enableSorting: true,
        size: 280,
        meta: {
          skeleton: adminListSkeletons.avatarText,
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
        enableSorting: false,
        size: 150,
        meta: { skeleton: adminListSkeletons.translations },
        cell: (info) => {
          const equipment = info.row.original;
          const translations = equipment.translations || {};

          return (
            <div className="flex items-center gap-1">
              {map(activeLanguages, (language) => {
                const code = get(language, "code");
                const hasTranslation = Boolean(
                  trim(get(translations, code, "")),
                );

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
        accessorKey: "isOnboarding",
        header: "Onboardingda",
        enableSorting: true,
        size: 120,
        meta: SWITCH_COLUMN_META,
        cell: (info) => {
          const equipment = info.row.original;

          return (
            <div className={SWITCH_CELL_CLASS_NAME}>
              <Switch
                checked={Boolean(equipment.isOnboarding)}
                onCheckedChange={(checked) =>
                  handleToggleOnboarding(equipment, checked)
                }
              />
            </div>
          );
        },
      },
      {
        accessorKey: "isHome",
        header: "Uyda",
        enableSorting: true,
        size: 96,
        meta: SWITCH_COLUMN_META,
        cell: (info) => {
          const equipment = info.row.original;

          return (
            <div className={SWITCH_CELL_CLASS_NAME}>
              <Switch
                checked={Boolean(equipment.isHome)}
                onCheckedChange={(checked) =>
                  handleToggleHome(equipment, checked)
                }
              />
            </div>
          );
        },
      },
      {
        accessorKey: "isStreet",
        header: "Street",
        enableSorting: true,
        size: 96,
        meta: SWITCH_COLUMN_META,
        cell: (info) => {
          const equipment = info.row.original;

          return (
            <div className={SWITCH_CELL_CLASS_NAME}>
              <Switch
                checked={Boolean(equipment.isStreet)}
                onCheckedChange={(checked) =>
                  handleToggleStreet(equipment, checked)
                }
              />
            </div>
          );
        },
      },
      {
        accessorKey: "isActive",
        header: "Status",
        enableSorting: true,
        size: 96,
        meta: SWITCH_COLUMN_META,
        cell: (info) => {
          const equipment = info.row.original;

          return (
            <div className={SWITCH_CELL_CLASS_NAME}>
              <Switch
                checked={equipment.isActive}
                onCheckedChange={(checked) =>
                  handleToggleStatus(equipment, checked)
                }
              />
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        size: 50,
        meta: { skeleton: adminListSkeletons.action },
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
      handleToggleHome,
      handleToggleOnboarding,
      handleToggleStreet,
      handleToggleStatus,
      isReorderEnabled,
      openEditDrawer,
      openTranslationsDrawer,
      setEquipmentToDelete,
    ],
  );
};
