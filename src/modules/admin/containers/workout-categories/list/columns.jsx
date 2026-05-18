import React from "react";
import { filter, find, get, map, trim, values as lodashValues } from "lodash";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DataGridTableDndRowHandle } from "@/components/reui/data-grid";
import { cn } from "@/lib/utils";
import { getCategoryBadgeAppearance } from "@/lib/category-badge";
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
      lodashValues(translations),
      (value) => typeof value === "string" && trim(value),
    );
    if (typeof first === "string" && trim(first)) {
      return trim(first);
    }
  }

  return fallback;
};

const countFilledTranslations = (translations = {}) =>
  filter(
    lodashValues(translations),
    (value) => typeof value === "string" && trim(value).length > 0,
  ).length;

export const useColumns = ({
  activeLanguages,
  currentLanguage,
  isReorderEnabled,
  isUpdating,
  handleToggleActive,
  handleToggleOnboarding,
  openEditDrawer,
  openTranslationsDrawer,
  setCategoryToDelete,
  CategoryWorkoutsGrid,
}) => {
  return React.useMemo(
    () => [
      {
        id: "dnd",
        header: "",
        cell: () => (isReorderEnabled ? <DataGridTableDndRowHandle /> : null),
        meta: { skeleton: adminListSkeletons.action },
        size: 36,
      },
      {
        id: "expand",
        header: "",
        enableSorting: false,
        size: 52,
        meta: { skeleton: adminListSkeletons.action },
        cell: (info) => (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(event) => {
              event.stopPropagation();
              info.row.toggleExpanded();
            }}
          >
            {info.row.getIsExpanded() ? (
              <ChevronUpIcon className="size-4" />
            ) : (
              <ChevronDownIcon className="size-4" />
            )}
          </Button>
        ),
      },
      {
        accessorKey: "name",
        header: "Kategoriya",
        enableSorting: true,
        size: 300,
        meta: {
          skeleton: adminListSkeletons.avatarText,
          expandedContent: (row) => (
            <CategoryWorkoutsGrid
              categoryId={row.id}
              currentLanguage={currentLanguage}
            />
          ),
        },
        cell: (info) => {
          const category = info.row.original;
          const localizedName = resolveLabel(
            category.translations,
            category.name,
            currentLanguage,
          );
          const appearance = getCategoryBadgeAppearance(category.color);

          return (
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className={cn("h-6 rounded-full px-3", appearance.className)}
                style={appearance.style}
              >
                {localizedName}
              </Badge>
              <div className="min-w-0">
                <p className="truncate font-medium">{localizedName}</p>
                <p className="text-xs text-muted-foreground">
                  Asosiy nom: {category.name}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "workoutCount",
        header: "Mashqlar",
        enableSorting: false,
        size: 96,
        meta: { skeleton: adminListSkeletons.badge },
        cell: (info) => (
          <Badge variant="outline">{info.getValue() ?? 0} ta</Badge>
        ),
      },
      {
        id: "translations",
        header: "Tarjimalar",
        enableSorting: false,
        size: 170,
        meta: { skeleton: adminListSkeletons.translations },
        cell: (info) => {
          const translations = info.row.original.translations || {};
          const filledCount = countFilledTranslations(translations);

          return (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                {map(activeLanguages, (language) => (
                  <div
                    key={language.id}
                    title={`${language.name}: ${
                      translations[language.code] ? "Bor" : "Yo'q"
                    }`}
                    className={cn(
                      "flex size-6 items-center justify-center rounded-md border text-[10px]",
                      translations[language.code]
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-transparent bg-muted opacity-45",
                    )}
                  >
                    {language.flag}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {filledCount}/{Math.max(activeLanguages.length, 1)} to'ldirilgan
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: "color",
        header: "Badge rangi",
        enableSorting: false,
        size: 120,
        meta: { skeleton: adminListSkeletons.text },
        cell: (info) => {
          const appearance = getCategoryBadgeAppearance(info.getValue());

          return (
            <div className="flex items-center gap-2">
              <div
                className="size-4 rounded-full border border-border/70"
                style={appearance.swatchStyle}
              />
              <span className="text-xs text-muted-foreground">
                {appearance.label}
              </span>
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
          const isActive = info.getValue();
          const category = info.row.original;

          return (
            <div className={SWITCH_CELL_CLASS_NAME}>
              <Switch
                checked={isActive}
                disabled={isUpdating}
                onCheckedChange={() => handleToggleActive(category)}
              />
            </div>
          );
        },
      },
      {
        accessorKey: "isOnboarding",
        header: "Onboardingda",
        enableSorting: true,
        size: 132,
        meta: SWITCH_COLUMN_META,
        cell: (info) => {
          const category = info.row.original;

          return (
            <div className={SWITCH_CELL_CLASS_NAME}>
              <Switch
                checked={Boolean(info.getValue())}
                disabled={isUpdating}
                onCheckedChange={() => handleToggleOnboarding(category)}
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
              category={info.row.original}
              onEdit={openEditDrawer}
              onDelete={setCategoryToDelete}
              onTranslations={openTranslationsDrawer}
            />
          </div>
        ),
      },
    ],
    [
      activeLanguages,
      currentLanguage,
      handleToggleActive,
      handleToggleOnboarding,
      isReorderEnabled,
      isUpdating,
      openEditDrawer,
      openTranslationsDrawer,
      setCategoryToDelete,
      CategoryWorkoutsGrid,
    ],
  );
};



