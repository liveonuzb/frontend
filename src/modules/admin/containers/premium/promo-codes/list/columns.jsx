import React from "react";
import { get } from "lodash";
import { Badge } from "@/components/ui/badge";
import ActionsMenu from "./actions-menu.jsx";

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("uz-UZ", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return dateStr;
  }
};

const formatDiscount = (row) => {
  const type = get(row, "discountType");
  const value = get(row, "discountValue");
  if (type === "PERCENTAGE") return `${value}%`;
  if (type === "FIXED_AMOUNT") return `${Number(value).toLocaleString("uz-UZ")} UZS`;
  return String(value);
};

const getStatusBadge = (row) => {
  const isActive = get(row, "isActive");
  const validTo = get(row, "validTo");

  if (validTo && new Date(validTo) < new Date()) {
    return (
      <Badge
        variant="outline"
        className="bg-orange-500/10 text-orange-700 dark:text-orange-400"
      >
        Muddati tugagan
      </Badge>
    );
  }

  if (isActive) {
    return (
      <Badge
        variant="outline"
        className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
      >
        Faol
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="bg-slate-500/10 text-slate-700 dark:text-slate-300"
    >
      Nofaol
    </Badge>
  );
};

export const useColumns = ({ handleToggleActive, onEdit, onDelete }) => {
  return React.useMemo(
    () => [
      {
        accessorKey: "code",
        header: "Kod",
        cell: (info) => (
          <Badge variant="outline" className="font-mono">
            {info.getValue()}
          </Badge>
        ),
      },
      {
        id: "discount",
        header: "Chegirma",
        cell: (info) => {
          const row = get(info, "row.original");
          return (
            <span className="text-sm font-medium">{formatDiscount(row)}</span>
          );
        },
      },
      {
        id: "usage",
        header: "Ishlatish",
        cell: (info) => {
          const row = get(info, "row.original");
          const usedCount = get(row, "usedCount", 0);
          const maxUses = get(row, "maxUses");
          return (
            <span className="text-sm text-muted-foreground">
              {usedCount} / {maxUses != null ? maxUses : "\u221E"}
            </span>
          );
        },
      },
      {
        accessorKey: "stackable",
        header: "Stackable",
        size: 100,
        cell: (info) =>
          info.getValue() ? (
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            >
              Ha
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="bg-slate-500/10 text-slate-700 dark:text-slate-300"
            >
              Yo'q
            </Badge>
          ),
      },
      {
        id: "validity",
        header: "Amal muddati",
        cell: (info) => {
          const row = get(info, "row.original");
          return (
            <span className="text-sm text-muted-foreground">
              {formatDate(get(row, "validFrom"))} -{" "}
              {formatDate(get(row, "validTo"))}
            </span>
          );
        },
      },
      {
        id: "status",
        header: "Status",
        size: 130,
        cell: (info) => getStatusBadge(get(info, "row.original")),
      },
      {
        id: "actions",
        header: "",
        size: 50,
        cell: (info) => (
          <div className="flex justify-end">
            <ActionsMenu
              promoCode={info.row.original}
              onEdit={onEdit}
              onToggleActive={handleToggleActive}
              onDelete={onDelete}
            />
          </div>
        ),
      },
    ],
    [handleToggleActive, onEdit, onDelete],
  );
};
