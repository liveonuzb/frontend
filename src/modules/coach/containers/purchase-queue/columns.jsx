import { get } from "lodash";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  CheckIcon,
  Clock3Icon,
  MoreVerticalIcon,
  ShieldBanIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataGridColumnHeader } from "@/components/reui/data-grid";

const STATUS_CLASS = {
  PENDING_RECEIPT: "bg-slate-500/10 text-slate-700 border-slate-500/20",
  PENDING_REVIEW: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  APPROVED: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  REJECTED: "bg-rose-500/10 text-rose-700 border-rose-500/20",
  EXPIRED: "bg-zinc-500/10 text-zinc-700 border-zinc-500/20",
  CANCELLED: "bg-zinc-500/10 text-zinc-700 border-zinc-500/20",
};

const formatMoney = (amount) =>
  `${Number(amount || 0).toLocaleString("uz-UZ")} so'm`;

export const useColumns = ({
  handleApprove,
  handleReject,
  handleRevoke,
  handleExtendOpen,
  isApproving,
  isRejecting,
  isRevoking,
}) => {
  const { t } = useTranslation();

  return React.useMemo(
    () => [
      {
        id: "index",
        header: "#",
        size: 56,
        cell: (info) => (
          <span className="text-muted-foreground text-xs">
            {info.row.index + 1}
          </span>
        ),
      },
      {
        id: "course",
        accessorFn: (row) => get(row, "course.title", ""),
        header: ({ column }) => (
          <DataGridColumnHeader
            column={column}
            title={t("coach.commerce.queue.columns.course", {
              defaultValue: "Kurs",
            })}
          />
        ),
        enableSorting: true,
        meta: { cellClassName: "min-w-[180px]" },
        cell: ({ row }) => (
          <span className="font-medium text-sm">
            {get(row.original, "course.title") || "—"}
          </span>
        ),
      },
      {
        id: "customer",
        accessorFn: (row) =>
          get(row, "user.name") ||
          get(row, "telegramUser.firstName") ||
          "",
        header: ({ column }) => (
          <DataGridColumnHeader
            column={column}
            title={t("coach.commerce.queue.columns.customer", {
              defaultValue: "Mijoz",
            })}
          />
        ),
        enableSorting: true,
        meta: { cellClassName: "min-w-[180px]" },
        cell: ({ row }) => {
          const purchase = row.original;
          const name =
            get(purchase, "user.name") ||
            get(purchase, "telegramUser.firstName") ||
            get(purchase, "telegramUser.username") ||
            get(purchase, "telegramUser.telegramId") ||
            t("coach.commerce.queue.unknownUser", {
              defaultValue: "Noma'lum",
            });
          const phone =
            get(purchase, "user.phone") ||
            get(purchase, "telegramUser.phone");
          const tgUsername = get(purchase, "telegramUser.username");

          return (
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">{name}</span>
              {phone && (
                <span className="text-xs text-muted-foreground">{phone}</span>
              )}
              {tgUsername && !phone && (
                <span className="text-xs text-muted-foreground">
                  @{tgUsername}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "amount",
        header: ({ column }) => (
          <DataGridColumnHeader
            column={column}
            title={t("coach.commerce.queue.columns.amount", {
              defaultValue: "Summa",
            })}
          />
        ),
        enableSorting: true,
        meta: { cellClassName: "min-w-[120px]" },
        cell: ({ row }) => (
          <span className="text-sm font-medium tabular-nums">
            {formatMoney(row.original.amount)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataGridColumnHeader
            column={column}
            title={t("coach.commerce.queue.columns.status", {
              defaultValue: "Holat",
            })}
          />
        ),
        enableSorting: true,
        meta: { cellClassName: "min-w-[130px]" },
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Badge variant="outline" className={STATUS_CLASS[status] || ""}>
              {t(`coach.commerce.queue.status.${status}`, {
                defaultValue: status,
              })}
            </Badge>
          );
        },
      },
      {
        accessorKey: "requestedAt",
        header: ({ column }) => (
          <DataGridColumnHeader
            column={column}
            title={t("coach.commerce.queue.columns.requestedAt", {
              defaultValue: "So'rov sanasi",
            })}
          />
        ),
        enableSorting: true,
        meta: { cellClassName: "min-w-[150px]" },
        cell: ({ row }) => {
          const val = row.original.requestedAt;
          return (
            <span className="text-xs text-muted-foreground">
              {val ? new Date(val).toLocaleString("uz-UZ") : "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "accessEndsAt",
        header: ({ column }) => (
          <DataGridColumnHeader
            column={column}
            title={t("coach.commerce.queue.columns.accessEndsAt", {
              defaultValue: "Kirish tugashi",
            })}
          />
        ),
        enableSorting: true,
        meta: { cellClassName: "min-w-[140px]" },
        cell: ({ row }) => {
          const val = row.original.accessEndsAt;
          return (
            <span className="text-xs text-muted-foreground">
              {val ? new Date(val).toLocaleDateString("uz-UZ") : "—"}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "",
        size: 56,
        cell: ({ row }) => {
          const purchase = row.original;
          const status = purchase.status;

          return (
            <div
              className="flex justify-end"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label="Amallar">
                    <MoreVerticalIcon className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  {status === "PENDING_REVIEW" && (
                    <>
                      <DropdownMenuItem
                        disabled={isApproving}
                        onClick={() => handleApprove(purchase.id)}
                      >
                        <CheckIcon className="size-4" />
                        {t("coach.commerce.queue.actions.approve")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={isRejecting}
                        onClick={() => handleReject(purchase.id)}
                      >
                        <ShieldBanIcon className="size-4" />
                        {t("coach.commerce.queue.actions.reject")}
                      </DropdownMenuItem>
                    </>
                  )}

                  {status === "APPROVED" && (
                    <>
                      <DropdownMenuItem
                        onClick={() => handleExtendOpen(purchase.id)}
                      >
                        <Clock3Icon className="size-4" />
                        {t("coach.commerce.queue.actions.extend")}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        disabled={isRevoking}
                        onClick={() => handleRevoke(purchase.id)}
                      >
                        <ShieldBanIcon className="size-4" />
                        {t("coach.commerce.queue.actions.revoke")}
                      </DropdownMenuItem>
                    </>
                  )}

                  {status !== "PENDING_REVIEW" && status !== "APPROVED" && (
                    <DropdownMenuItem disabled>
                      {t("coach.commerce.queue.noActionsAvailable", {
                        defaultValue: "Amallar mavjud emas",
                      })}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [
      t,
      handleApprove,
      handleReject,
      handleRevoke,
      handleExtendOpen,
      isApproving,
      isRejecting,
      isRevoking,
    ],
  );
};
