import React from "react";
import { get, map, size, filter as lodashFilter, toString, trim } from "lodash";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DataGridTableDndRowHandle } from "@/components/reui/data-grid";
import { cn } from "@/lib/utils";
import { getCategoryBadgeAppearance } from "@/lib/category-badge";
import ActionsMenu from "./actions-menu.jsx";

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
  isUpdating,
  resolveLabel,
  handleToggleActive,
  openEditDrawer,
  openTranslationsDrawer,
  setCategoryToDelete,
  CategoryFoodsGrid,
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
            <CategoryFoodsGrid
              categoryId={row.id}
              currentLanguage={currentLanguage}
            />
          ),
        },
        cell: (info) => {
          const category = get(info, "row.original");
          const localizedName = resolveLabel(
            get(category, "translations"),
            get(category, "name"),
            currentLanguage,
          );
          const appearance = getCategoryBadgeAppearance(get(category, "color"));

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
                  Asosiy nom: {get(category, "name")}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "foodCount",
        header: "Foods",
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
          const translations = get(info, "row.original.translations", {});
          const filledCount = countFilledTranslations(translations);

          return (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                {map(activeLanguages, (language) => (
                  <div
                    key={get(language, "id")}
                    title={`${get(language, "name")}: ${
                      get(translations, get(language, "code")) ? "Bor" : "Yo'q"
                    }`}
                    className={cn(
                      "flex size-6 items-center justify-center rounded-md border text-[10px]",
                      get(translations, get(language, "code"))
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-transparent bg-muted opacity-45",
                    )}
                  >
                    {get(language, "flag")}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {filledCount}/{Math.max(size(activeLanguages), 1)} to'ldirilgan
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
          const category = get(info, "row.original");

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
      resolveLabel,
      openEditDrawer,
      openTranslationsDrawer,
      setCategoryToDelete,
      CategoryFoodsGrid,
    ],
  );
};
