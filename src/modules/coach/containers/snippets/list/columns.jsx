import React from "react";
import { map as lodashMap } from "lodash";
import { Badge } from "@/components/ui/badge";
import {
  DataGridColumnHeader,
  DataGridTableRowSelect,
  DataGridTableRowSelectAll,
  DataGridTableDndRowHandle,
} from "@/components/reui/data-grid";
import { cn } from "@/lib/utils";
import SnippetActionsMenu from "./actions-menu.jsx";

const MAX_VISIBLE_TAGS = 3;
const MAX_CONTENT_LENGTH = 80;

const TagsBadges = ({ tags = [] }) => {
  if (!tags || !tags.length) return null;

  const visible = tags.slice(0, MAX_VISIBLE_TAGS);
  const overflow = tags.length - MAX_VISIBLE_TAGS;

  return (
    <div className="flex flex-wrap gap-1">
      {lodashMap(visible, (tag) => (
        <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 h-5">
          {tag}
        </Badge>
      ))}
      {overflow > 0 ? (
        <Badge variant="outline" className="text-[10px] px-1.5 h-5">
          +{overflow}
        </Badge>
      ) : null}
    </div>
  );
};

export const useColumns = ({ canReorder, currentPage, pageSize, onEdit, onSoftDelete, onRestore, onHardDelete }) =>
  React.useMemo(
    () => [
      {
        id: "select",
        header: () => <DataGridTableRowSelectAll />,
        cell: ({ row }) => {
          const isDefault = Boolean(row.original.isDefault);
          return isDefault ? (
            <div className="size-4" />
          ) : (
            <DataGridTableRowSelect row={row} />
          );
        },
        enableSorting: false,
        size: 40,
      },
      ...(canReorder
        ? [
            {
              id: "dnd",
              header: "",
              cell: ({ row }) => {
                const isDefault = Boolean(row.original.isDefault);
                return isDefault ? (
                  <div className="size-4 opacity-0" />
                ) : (
                  <DataGridTableDndRowHandle />
                );
              },
              size: 32,
            },
          ]
        : []),
      {
        accessorKey: "id",
        header: "#",
        cell: (info) => (currentPage - 1) * pageSize + info.row.index + 1,
        size: 60,
        meta: {
          cellClassName: "hidden md:table-cell",
          headerClassName: "hidden md:table-cell",
        },
      },
      {
        accessorKey: "title",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Sarlavha" />
        ),
        enableSorting: true,
        cell: ({ row }) => {
          const isDefault = Boolean(row.original.isDefault);
          return (
            <div className={cn("flex items-center gap-2", isDefault && "opacity-60")}>
              <span className="font-semibold leading-tight">{row.original.title}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "tags",
        header: "Teglar",
        cell: ({ row }) => {
          const isDefault = Boolean(row.original.isDefault);
          return (
            <div className={cn(isDefault && "opacity-60")}>
              <TagsBadges tags={row.original.tags} />
            </div>
          );
        },
        size: 180,
      },
      {
        accessorKey: "content",
        header: "Mazmun",
        cell: ({ row }) => {
          const isDefault = Boolean(row.original.isDefault);
          const content = row.original.content ?? "";
          const truncated =
            content.length > MAX_CONTENT_LENGTH
              ? `${content.slice(0, MAX_CONTENT_LENGTH)}…`
              : content;

          return (
            <p className={cn("text-sm text-muted-foreground", isDefault && "opacity-60")}>
              {truncated}
            </p>
          );
        },
      },
      {
        accessorKey: "isDefault",
        header: "Turi",
        cell: ({ row }) => {
          if (!row.original.isDefault) return null;
          return (
            <Badge variant="outline" className="text-[10px] px-1.5 h-5 border-primary/30 text-primary">
              Standart
            </Badge>
          );
        },
        size: 100,
      },
      {
        id: "actions",
        header: "",
        size: 50,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <SnippetActionsMenu
              row={row}
              onEdit={onEdit}
              onSoftDelete={onSoftDelete}
              onRestore={onRestore}
              onHardDelete={onHardDelete}
            />
          </div>
        ),
      },
    ],
    [canReorder, currentPage, pageSize, onEdit, onSoftDelete, onRestore, onHardDelete],
  );
