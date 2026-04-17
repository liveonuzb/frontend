import {
  get,
  join,
  map,
  split,
  take,
  toUpper,
} from "lodash";
import React from "react";
import { useTranslation } from "react-i18next";
import { PaperclipIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ActionsMenu from "./actions-menu.jsx";

const formatMoney = (value, t, locale = "uz-UZ") => {
  const normalized = Number(value);
  if (!Number.isFinite(normalized) || normalized <= 0) {
    return t("coach.payments.table.negotiable");
  }
  return `${new Intl.NumberFormat(locale).format(normalized)} ${t("coach.payments.table.currency")}`;
};

const formatDate = (value, locale = "uz-UZ") => {
  if (!value) return "\u2014";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "\u2014";
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
};

const getInitials = (value = "") =>
  toUpper(join(take(map(split(String(value), " "), (part) => get(part, "[0]", "")), 2), ""));

export const useColumns = ({ locale, onEdit, onRefund, onCancel }) => {
  const { t } = useTranslation();

  return React.useMemo(
    () => [
      {
        accessorKey: "client",
        header: t("coach.payments.table.columns.client"),
        cell: ({ getValue }) => {
          const client = getValue();
          return (
            <div className="flex items-center gap-3">
              <Avatar className="size-9">
                <AvatarImage src={get(client, "avatar")} />
                <AvatarFallback className="text-[10px]">
                  {getInitials(get(client, "name") || "N")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">
                  {get(client, "name") ||
                    t("coach.payments.table.unknownClient")}
                </p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {get(client, "phone") || get(client, "email")}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "amount",
        header: t("coach.payments.table.columns.amount"),
        cell: ({ getValue }) => (
          <span className="font-semibold text-primary">
            {formatMoney(getValue(), t, locale)}
          </span>
        ),
      },
      {
        accessorKey: "paidAt",
        header: t("coach.payments.table.columns.date"),
        cell: ({ getValue }) => formatDate(getValue(), locale),
        meta: {
          headerClassName: "hidden md:table-cell",
          cellClassName: "hidden md:table-cell",
        },
      },
      {
        accessorKey: "note",
        header: t("coach.payments.table.columns.note"),
        cell: ({ row }) => (
          <div className="flex max-w-[200px] items-center gap-2">
            <span className="truncate text-xs text-muted-foreground">
              {row.original.note || "\u2014"}
            </span>
            {row.original.receiptUrl && (
              <a
                href={row.original.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded p-1 transition-colors hover:bg-primary/10"
                title={t("coach.payments.table.viewReceipt")}
                onClick={(e) => e.stopPropagation()}
              >
                <PaperclipIcon className="size-3 text-primary" />
              </a>
            )}
          </div>
        ),
        meta: {
          headerClassName: "hidden md:table-cell",
          cellClassName: "hidden md:table-cell",
        },
      },
      {
        accessorKey: "method",
        header: t("coach.payments.table.columns.method"),
        cell: ({ getValue }) => (
          <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
            {getValue()
              ? t(`coach.payments.methods.${getValue()}`)
              : t("coach.payments.methods.OTHER")}
          </span>
        ),
        meta: {
          headerClassName: "hidden md:table-cell",
          cellClassName: "hidden md:table-cell",
        },
      },
      {
        accessorKey: "status",
        header: t("coach.payments.table.columns.status"),
        cell: ({ row }) => {
          const status = row.original.status;
          if (status === "cancelled") {
            return (
              <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight text-destructive">
                {t("coach.payments.status.cancelled")}
              </span>
            );
          }
          if (status === "refunded") {
            return (
              <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight text-orange-600">
                {t("coach.payments.status.refunded")}
              </span>
            );
          }
          return (
            <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight text-green-600">
              {t("coach.payments.status.completed")}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "",
        size: 50,
        cell: ({ row }) => (
          <div className="flex justify-end pr-2">
            <ActionsMenu
              payment={row.original}
              onEdit={onEdit}
              onRefund={onRefund}
              onCancel={onCancel}
            />
          </div>
        ),
        meta: { noPinnedBorder: true },
      },
    ],
    [locale, onEdit, onRefund, onCancel, t],
  );
};
