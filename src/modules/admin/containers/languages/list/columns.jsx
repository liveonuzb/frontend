import React from "react";
import { get } from "lodash";
import { Switch } from "@/components/ui/switch";
import {
  DataGridTableDndRowHandle,
} from "@/components/reui/data-grid";
import { cn } from "@/lib/utils";
import LanguageActionsMenu from "./actions-menu.jsx";

export const useColumns = ({
  isUpdating,
  onToggleActive,
  onEdit,
  onDelete,
}) => {
  return React.useMemo(
    () => [
      {
        id: "dnd",
        header: "",
        cell: () => <DataGridTableDndRowHandle />,
        size: 30,
      },
      {
        accessorKey: "flag",
        header: "Bayroq",
        cell: (info) => <div className="text-2xl">{info.getValue()}</div>,
        size: 80,
      },
      {
        accessorKey: "name",
        header: "Nomi",
        cell: (info) => <div className="font-bold">{info.getValue()}</div>,
      },
      {
        accessorKey: "code",
        header: "Kodi",
        cell: (info) => (
          <div className="text-muted-foreground uppercase">
            {info.getValue()}
          </div>
        ),
        size: 100,
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: (info) => {
          const isActive = info.getValue();
          const language = get(info, "row.original");
          return (
            <div className="flex items-center gap-2">
              <Switch
                checked={isActive}
                disabled={isUpdating}
                onCheckedChange={() => onToggleActive(language)}
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
            <LanguageActionsMenu
              language={get(info, "row.original")}
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
