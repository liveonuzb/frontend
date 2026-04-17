import React from "react";
import { trim } from "lodash";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { getPermissionTranslation } from "@/lib/permission-utils";
import ActionsMenu from "./actions-menu.jsx";

const PERMISSION_LANGUAGES = [
  { code: "uz", label: "UZ" },
  { code: "ru", label: "RU" },
  { code: "en", label: "EN" },
];

const countFilledTitleTranslations = (node) =>
  PERMISSION_LANGUAGES.filter((language) =>
    trim(getPermissionTranslation(node?.titleTranslations, language.code)),
  ).length;

export const useColumns = ({
  currentLanguage,
  isUpdating,
  handleToggleActive,
  openCreateAction,
  openEditNode,
  openTranslationsDrawer,
  PermissionActionsPanel,
}) => {
  return React.useMemo(
    () => [
      {
        accessorKey: "titleTranslations",
        header: "Permission",
        meta: {
          cellClassName: "min-w-[320px]",
          expandedContent: (group) => (
            <PermissionActionsPanel
              group={group}
              currentLanguage={currentLanguage}
              isUpdating={isUpdating}
              onAddAction={openCreateAction}
              onEdit={openEditNode}
              onToggleActive={handleToggleActive}
              onTranslations={openTranslationsDrawer}
            />
          ),
        },
        cell: (info) => {
          const group = info.row.original;
          const title =
            getPermissionTranslation(group.titleTranslations, currentLanguage) ||
            group.key;

          return (
            <div className="flex items-start gap-3">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="mt-0.5 shrink-0 rounded-md"
                onClick={(event) => {
                  event.stopPropagation();
                  info.row.toggleExpanded();
                }}
              >
                {info.row.getIsExpanded() ? (
                  <ChevronDownIcon className="size-4" />
                ) : (
                  <ChevronRightIcon className="size-4" />
                )}
              </Button>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium">{title}</p>
                  <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                    Group
                  </Badge>
                  <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                    {group.children?.length || 0} action
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{group.code}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {getPermissionTranslation(
                    group.descriptionTranslations,
                    currentLanguage,
                  ) || "Izoh kiritilmagan"}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "sortOrder",
        header: "Sort",
        size: 100,
        cell: (info) => (
          <Badge variant="outline" className="rounded-full px-3 py-1">
            {info.getValue()}
          </Badge>
        ),
      },
      {
        id: "translations",
        header: "Tarjimalar",
        size: 180,
        cell: (info) => {
          const group = info.row.original;
          const filledCount = countFilledTitleTranslations(group);

          return (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                {PERMISSION_LANGUAGES.map((language) => (
                  <div
                    key={language.code}
                    title={`${language.label}: ${
                      trim(
                        getPermissionTranslation(
                          group.titleTranslations,
                          language.code,
                        ),
                      )
                        ? "Bor"
                        : "Yo'q"
                    }`}
                    className={cn(
                      "flex size-6 items-center justify-center rounded-md border text-[10px]",
                      trim(
                        getPermissionTranslation(
                          group.titleTranslations,
                          language.code,
                        ),
                      )
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-transparent bg-muted opacity-45",
                    )}
                  >
                    {language.label}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {filledCount}/{PERMISSION_LANGUAGES.length} to&apos;ldirilgan
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
          const node = info.row.original;

          return (
            <div className="flex items-center gap-2">
              <Switch
                checked={Boolean(info.getValue())}
                disabled={isUpdating}
                onCheckedChange={() => handleToggleActive(node)}
              />
              <span
                className={cn(
                  "text-xs font-medium",
                  info.getValue() ? "text-emerald-600" : "text-muted-foreground",
                )}
              >
                {info.getValue() ? "Faol" : "Nofaol"}
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
              node={info.row.original}
              onAddAction={openCreateAction}
              onEdit={openEditNode}
              onTranslations={openTranslationsDrawer}
            />
          </div>
        ),
      },
    ],
    [
      currentLanguage,
      handleToggleActive,
      isUpdating,
      openCreateAction,
      openEditNode,
      openTranslationsDrawer,
      PermissionActionsPanel,
    ],
  );
};
