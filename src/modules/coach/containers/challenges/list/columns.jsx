import React from "react";
import { format } from "date-fns";
import { TrophyIcon, ImagePlusIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DataGridColumnHeader,
  DataGridTableRowSelect,
  DataGridTableRowSelectAll,
} from "@/components/reui/data-grid";
import ActionsMenu from "./actions-menu.jsx";

const STATUS_META = {
  ACTIVE: {
    label: "Faol",
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200",
  },
  DRAFT: {
    label: "Qoralama",
    className: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200",
  },
  ENDED: {
    label: "Tugagan",
    className: "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-200",
  },
};

const StatusBadge = ({ status }) => {
  const meta = STATUS_META[status] || {
    label: status || "—",
    className: "bg-muted text-muted-foreground",
  };
  return (
    <Badge variant="outline" className={meta.className}>
      {meta.label}
    </Badge>
  );
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  try {
    return format(new Date(dateStr), "dd.MM.yyyy");
  } catch {
    return "—";
  }
};

export const useColumns = ({
  currentPage,
  pageSize,
  onEdit,
  onSoftDelete,
  onRestore,
  onHardDelete,
}) =>
  React.useMemo(
    () => [
      {
        id: "select",
        header: () => <DataGridTableRowSelectAll />,
        cell: ({ row }) => <DataGridTableRowSelect row={row} />,
        enableSorting: false,
        size: 40,
      },
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
        accessorKey: "imageUrl",
        header: "Rasm",
        enableSorting: false,
        size: 64,
        cell: (info) => {
          const url = info.getValue();
          return (
            <div className="size-10 shrink-0 overflow-hidden rounded-lg border bg-muted/30 flex items-center justify-center">
              {url ? (
                <img loading="lazy"
                  src={url}
                  alt={info.row.original.title || ""}
                  className="size-full object-cover"
                />
              ) : (
                <ImagePlusIcon className="size-4 text-muted-foreground" />
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "title",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Musobaqa" />
        ),
        enableSorting: true,
        cell: (info) => {
          const challenge = info.row.original;
          return (
            <div className="min-w-0">
              <p className="font-semibold leading-tight truncate max-w-[200px] sm:max-w-[300px]">
                {challenge.title || "—"}
              </p>
              <div className="mt-1">
                <StatusBadge status={challenge.status} />
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "participantsCount",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Ishtirokchilar" />
        ),
        enableSorting: true,
        size: 120,
        cell: (info) => {
          const count = info.getValue() ?? 0;
          return (
            <div className="flex items-center gap-1.5">
              <TrophyIcon className="size-3.5 text-muted-foreground" />
              <span className="text-sm font-medium">{count}</span>
            </div>
          );
        },
      },
      {
        id: "dates",
        header: "Davr",
        size: 160,
        cell: (info) => {
          const challenge = info.row.original;
          return (
            <div className="text-sm">
              <p className="font-medium">{formatDate(challenge.startDate)}</p>
              <p className="text-muted-foreground">{formatDate(challenge.endDate)}</p>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "",
        size: 50,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <ActionsMenu
              challenge={row.original}
              onEdit={onEdit}
              onSoftDelete={onSoftDelete}
              onRestore={onRestore}
              onHardDelete={onHardDelete}
            />
          </div>
        ),
      },
    ],
    [currentPage, pageSize, onEdit, onSoftDelete, onRestore, onHardDelete],
  );
