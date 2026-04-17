import React from "react";
import { filter, find, get, map } from "lodash";
import {
  ChevronDownIcon,
  ChevronUpIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  DataGridTableDndRowHandle,
} from "@/components/reui/data-grid";
import { cn } from "@/lib/utils";
import { getCategoryBadgeAppearance } from "@/lib/category-badge";
import ActionsMenu from "./actions-menu.jsx";

const resolveLabel = (translations, fallback, language) => {
  if (translations && typeof translations === "object") {
    const direct = get(translations, language);
    if (typeof direct === "string" && direct.trim()) {
      return direct.trim();
    }

    const uz = get(translations, "uz");
    if (typeof uz === "string" && uz.trim()) {
      return uz.trim();
    }

    const first = find(
      Object.values(translations),
      (value) => typeof value === "string" && value.trim(),
    );
    if (typeof first === "string" && first.trim()) {
      return first.trim();
    }
  }

  return fallback;
};

const countFilledTranslations = (translations = {}) =>
  filter(
    Object.values(translations),
    (value) => typeof value === "string" && value.trim().length > 0,
  ).length;

export const useColumns = ({
  activeLanguages,
  currentLanguage,
  isReorderEnabled,
  isUpdating,
  handleToggleActive,
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
        size: 36,
      },
      {
        id: "expand",
        header: "",
        size: 52,
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
        meta: {
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
        size: 96,
        cell: (info) => (
          <Badge variant="outline">{info.getValue() ?? 0} ta</Badge>
        ),
      },
      {
        id: "translations",
        header: "Tarjimalar",
        size: 170,
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
        size: 120,
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
        size: 160,
        cell: (info) => {
          const isActive = info.getValue();
          const category = info.row.original;

          return (
            <div className="flex items-center gap-2">
              <Switch
                checked={isActive}
                disabled={isUpdating}
                onCheckedChange={() => handleToggleActive(category)}
              />
              <span
                className={cn(
                  "text-xs font-medium",
                  isActive ? "text-emerald-600" : "text-muted-foreground",
                )}
              >
                {isActive ? "Faol" : "Nofaol"}
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
      isReorderEnabled,
      isUpdating,
      openEditDrawer,
      openTranslationsDrawer,
      setCategoryToDelete,
      CategoryWorkoutsGrid,
    ],
  );
};
