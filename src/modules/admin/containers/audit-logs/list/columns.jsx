import React from "react";
import { get } from "lodash";
import { Badge } from "@/components/ui/badge";
import { DataGridColumnHeader } from "@/components/reui/data-grid";
import { cn } from "@/lib/utils";
import { auditActionLabels, auditEntityLabels } from "./config.js";

const auditActionBadgeClassNames = {
  user_created:
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  user_updated:
    "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  user_deleted:
    "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
  user_session_revoked:
    "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800",
  user_note_created:
    "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-400 border-fuchsia-200 dark:border-fuchsia-800",
  user_note_updated:
    "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-400 border-fuchsia-200 dark:border-fuchsia-800",
  user_note_deleted:
    "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
  premium_gifted:
    "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  subscription_cancelled:
    "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800",
  subscription_extended:
    "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800",
  coach_status_updated:
    "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800",
  food_created:
    "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  food_updated:
    "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  food_deleted:
    "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
  food_restored:
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  food_verification_updated:
    "bg-lime-500/10 text-lime-700 dark:text-lime-400 border-lime-200 dark:border-lime-800",
  food_category_created:
    "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
  food_category_updated:
    "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
  food_category_deleted:
    "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
  language_created:
    "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800",
  language_updated:
    "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800",
  language_deleted:
    "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
  expense_created:
    "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-400 border-fuchsia-200 dark:border-fuchsia-800",
  expense_updated:
    "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-400 border-fuchsia-200 dark:border-fuchsia-800",
  expense_deleted:
    "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
};

const auditEntityBadgeClassNames = {
  user: "bg-muted text-foreground",
  coach:
    "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  subscription:
    "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  language:
    "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800",
  food_category:
    "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
  food: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  expense:
    "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-400 border-fuchsia-200 dark:border-fuchsia-800",
};

const formatAuditDate = (value) =>
  new Intl.DateTimeFormat("uz-UZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const getRelativeTimeLabel = (isoString) => {
  if (!isoString) return "Hozir";

  const deltaMinutes = Math.max(
    0,
    Math.round((Date.now() - new Date(isoString).getTime()) / 60000),
  );

  if (deltaMinutes < 1) return "Hozir";
  if (deltaMinutes < 60) return `${deltaMinutes} daqiqa oldin`;

  const deltaHours = Math.round(deltaMinutes / 60);
  if (deltaHours < 24) return `${deltaHours} soat oldin`;

  const deltaDays = Math.round(deltaHours / 24);
  return `${deltaDays} kun oldin`;
};

export const useColumns = ({ currentPage, pageSize }) => {
  const ITEMS_PER_PAGE = pageSize || 10;

  return React.useMemo(
    () => [
      {
        accessorKey: "id",
        header: "#",
        cell: (info) =>
          (currentPage - 1) * ITEMS_PER_PAGE + get(info, "row.index") + 1,
        size: 60,
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Sana" />
        ),
        enableSorting: true,
        cell: (info) => (
          <div className="min-w-[160px]">
            <p className="text-sm font-medium">
              {formatAuditDate(info.getValue())}
            </p>
            <p className="text-xs text-muted-foreground">
              {getRelativeTimeLabel(info.getValue())}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "adminUser",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Admin" />
        ),
        enableSorting: true,
        cell: (info) => (
          <span className="font-medium">{info.getValue()}</span>
        ),
      },
      {
        accessorKey: "action",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Action" />
        ),
        enableSorting: true,
        cell: (info) => (
          <Badge
            variant="outline"
            className={cn(
              "font-medium",
              get(auditActionBadgeClassNames, info.getValue()),
            )}
          >
            {get(auditActionLabels, info.getValue(), info.getValue())}
          </Badge>
        ),
      },
      {
        accessorKey: "entityType",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Entity" />
        ),
        enableSorting: true,
        cell: (info) => (
          <Badge
            variant="outline"
            className={cn(
              "font-medium",
              get(auditEntityBadgeClassNames, info.getValue()),
            )}
          >
            {get(auditEntityLabels, info.getValue(), info.getValue())}
          </Badge>
        ),
      },
      {
        accessorKey: "entityLabel",
        header: "Nishon",
        cell: (info) => (
          <span className="text-sm text-muted-foreground">
            {info.getValue() || "\u2014"}
          </span>
        ),
      },
      {
        accessorKey: "summary",
        header: "Izoh",
        cell: (info) => (
          <p className="min-w-[280px] text-sm leading-6">{info.getValue()}</p>
        ),
      },
    ],
    [currentPage, ITEMS_PER_PAGE],
  );
};
