import React from "react";
import { get, initial, join, map, size } from "lodash";
import { ChevronDownIcon, ChevronRightIcon, LoaderIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { countFilledLocationTranslations } from "@/lib/location-translations.js";
import ActionsMenu from "./actions-menu.jsx";

const TYPE_LABELS = {
  country: "Country",
  region: "Region",
  district: "District",
  city: "City",
};

const TYPE_BADGE_STYLES = {
  country: "border-sky-200 bg-sky-500/10 text-sky-700 dark:border-sky-900 dark:text-sky-300",
  region: "border-violet-200 bg-violet-500/10 text-violet-700 dark:border-violet-900 dark:text-violet-300",
  district: "border-amber-200 bg-amber-500/10 text-amber-700 dark:border-amber-900 dark:text-amber-300",
  city: "border-emerald-200 bg-emerald-500/10 text-emerald-700 dark:border-emerald-900 dark:text-emerald-300",
};

const NEXT_TYPE_MAP = {
  country: "region",
  region: "district",
  district: "city",
  city: null,
};

export const useColumns = ({
  activeLanguages,
  expandedIds,
  loadingIds,
  isUpdating,
  handleToggleActive,
  handleExpand,
  openChildDrawer,
  openEditDrawer,
  openTranslationsDrawer,
  setLocationToDelete,
}) => {
  return React.useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Location",
        meta: { cellClassName: "min-w-[320px]" },
        cell: (info) => {
          const location = info.row.original;
          const depth = location.depth || 0;
          const canExpand = Boolean(location.hasChildren || location._count?.children > 0 || location.childrenCount > 0);
          const isExpanded = Boolean(expandedIds[location.id]);
          const isLoadingChildren = Boolean(loadingIds[location.id]);
          const parentPath = join(initial(location.path || []), " / ");
          const childCount = location._count?.children ?? location.childrenCount ?? 0;

          return (
            <div
              className="flex items-start gap-3"
              style={{ paddingLeft: `${depth * 24}px` }}
            >
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className={cn(
                  "mt-0.5 shrink-0 rounded-md",
                  !canExpand && "pointer-events-none opacity-0",
                )}
                disabled={isLoadingChildren}
                onClick={(event) => {
                  event.stopPropagation();
                  handleExpand(location.id);
                }}
              >
                {isLoadingChildren ? (
                  <LoaderIcon className="size-4 animate-spin" />
                ) : isExpanded ? (
                  <ChevronDownIcon className="size-4" />
                ) : (
                  <ChevronRightIcon className="size-4" />
                )}
              </Button>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium">{location.name}</p>
                  {childCount > 0 ? (
                    <Badge variant="outline" className="rounded-full px-2 py-0 text-[10px]">
                      {childCount} child
                    </Badge>
                  ) : null}
                </div>
                {parentPath ? (
                  <p className="mt-1 text-xs text-muted-foreground">{parentPath}</p>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">Ildiz element</p>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "type",
        header: "Tur",
        size: 120,
        cell: (info) => {
          const type = info.getValue();

          return (
            <Badge
              variant="outline"
              className={cn(
                "rounded-full px-3 py-1 font-medium",
                TYPE_BADGE_STYLES[type] || "border-border/70",
              )}
            >
              {TYPE_LABELS[type] || type}
            </Badge>
          );
        },
      },
      {
        accessorKey: "pathLabel",
        header: "Tree path",
        meta: { cellClassName: "min-w-[260px]" },
        cell: (info) => (
          <div className="text-xs text-muted-foreground">{info.getValue()}</div>
        ),
      },
      {
        id: "translations",
        header: "Tarjimalar",
        size: 180,
        cell: (info) => {
          const translations = get(info, "row.original.translations", {});
          const filledCount = countFilledLocationTranslations(translations);

          return (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                {map(activeLanguages, (language) => (
                  <div
                    key={language.id}
                    title={`${language.name}: ${get(translations, language.code) ? "Bor" : "Yo'q"}`}
                    className={cn(
                      "flex size-6 items-center justify-center rounded-md border text-[10px]",
                      get(translations, language.code)
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-transparent bg-muted opacity-45",
                    )}
                  >
                    {language.flag}
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
        accessorKey: "isActive",
        header: "Status",
        size: 150,
        cell: (info) => {
          const isActive = info.getValue();
          const location = info.row.original;

          return (
            <div className="flex items-center gap-2">
              <Switch
                checked={isActive}
                disabled={isUpdating}
                onCheckedChange={() => handleToggleActive(location)}
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
        size: 56,
        cell: (info) => (
          <div className="flex justify-end">
            <ActionsMenu
              location={info.row.original}
              nextType={NEXT_TYPE_MAP[get(info, "row.original.type")]}
              onAddChild={openChildDrawer}
              onEdit={openEditDrawer}
              onDelete={setLocationToDelete}
              onTranslations={openTranslationsDrawer}
            />
          </div>
        ),
      },
    ],
    [
      activeLanguages,
      expandedIds,
      loadingIds,
      handleToggleActive,
      handleExpand,
      isUpdating,
      openChildDrawer,
      openEditDrawer,
      openTranslationsDrawer,
      setLocationToDelete,
    ],
  );
};
