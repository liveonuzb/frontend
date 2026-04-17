import { get, map } from "lodash";
import React from "react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DataGridColumnHeader } from "@/components/reui/data-grid";
import {
  getStatusConfig,
  getInitials,
  formatDate,
  formatMoney,
} from "../utils";
import ActionsMenu from "./actions-menu.jsx";
import ClientTagsEditor, { ClientTagBadge } from "@/components/coach-clients/client-tags-editor";

export const useColumns = ({
  currentPage,
  pageSize,
  handleView,
  handleOpenPayment,
  handleOpenPaymentDay,
  handleCancelPayment,
  handleRemove,
  handleResendInvite,
  handleCancelInvitation,
  handleAssignPlan,
  isInviting,
  isRemoving,
  getClientTags,
  toggleTag,
}) => {
  const { t, i18n } = useTranslation();

  return React.useMemo(
    () => [
      {
        id: "index",
        header: "#",
        size: 56,
        cell: (info) => (currentPage - 1) * pageSize + info.row.index + 1,
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title={t("coach.clients.table.columns.client")} />
        ),
        enableSorting: true,
        meta: { cellClassName: "min-w-[240px]" },
        cell: ({ row }) => {
          const client = row.original;
          const isInvitation = get(client, "entityType") === "invitation";

          return (
            <div className="flex items-center gap-3 py-1">
              <Avatar className="size-9 border shadow-sm shrink-0">
                <AvatarImage src={get(client, "avatar")} alt={get(client, "name")} />
                <AvatarFallback className="bg-primary/5 text-primary font-semibold text-xs">
                  {getInitials(get(client, "name")) || "M"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    className="text-left hover:underline underline-offset-4 max-w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleView(client);
                    }}
                  >
                    <span className="truncate font-semibold text-sm tracking-tight">
                      {get(client, "name")}
                    </span>
                  </button>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground leading-none truncate">
                  {get(client, "email") && <span className="truncate">{get(client, "email")}</span>}
                  {get(client, "email") && get(client, "phone") && <span className="text-border">|</span>}
                  {get(client, "phone") && <span className="shrink-0">{get(client, "phone")}</span>}
                </div>
                {isInvitation && (
                  <Badge
                    variant="outline"
                    className="h-4 w-fit px-1.5 text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 border-amber-500/20 mt-0.5"
                  >
                    {t("common.status.pending")}
                  </Badge>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title={t("coach.clients.table.columns.status")} />
        ),
        enableSorting: true,
        meta: { cellClassName: "min-w-[120px]" },
        cell: ({ row }) => {
          const status = get(row.original, "status");
          const statusConfig = getStatusConfig(t);
          const config = get(statusConfig, status, { label: status, className: "" });

          return (
            <Badge variant="outline" className={config.className}>
              {config.label}
            </Badge>
          );
        },
      },
      {
        id: "contact",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title={t("coach.clients.table.columns.contact", { defaultValue: "Kontakt" })} />
        ),
        meta: { cellClassName: "min-w-[160px]" },
        cell: ({ row }) => {
          const client = row.original;
          const phone = get(client, "phone");
          const email = get(client, "email");

          if (!phone && !email) {
            return <span className="text-xs text-muted-foreground italic">{t("common.notProvided", { defaultValue: "Kiritilmagan" })}</span>;
          }

          return (
            <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
              {phone && <span>{phone}</span>}
              {email && <span className="truncate">{email}</span>}
            </div>
          );
        },
      },
      {
        accessorKey: "lastActivityDate",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title={t("coach.clients.table.columns.lastActivity")} />
        ),
        enableSorting: true,
        meta: { cellClassName: "min-w-[130px]" },
        cell: ({ row }) => {
          const client = row.original;
          const isInvitation = get(client, "entityType") === "invitation";

          return (
            <span className="text-xs text-muted-foreground">
              {isInvitation
                ? formatDate(get(client, "createdAt"), i18n.language)
                : formatDate(get(client, "lastActivityDate"), i18n.language)}
            </span>
          );
        },
      },
      {
        id: "payment",
        header: t("coach.clients.table.columns.payment"),
        meta: { cellClassName: "min-w-[150px]" },
        cell: ({ row }) => {
          const client = row.original;
          const entityType = get(client, "entityType");

          if (entityType !== "client") {
            return <span className="text-muted-foreground">--</span>;
          }

          const amount = get(client, "agreedAmount");
          const statusLabel = get(client, "paymentSummary.label");
          const dayOfMonth = get(client, "paymentSummary.dayOfMonth");

          return (
            <div className="space-y-0.5">
              <p className="text-sm font-medium">
                {formatMoney(amount, t, i18n.language)}
              </p>
              {statusLabel && (
                <p className="text-[11px] text-muted-foreground">{statusLabel}</p>
              )}
              {dayOfMonth && (
                <p className="text-[11px] text-muted-foreground">
                  {t("coach.clients.cells.payment.dayFormat", { day: dayOfMonth })}
                </p>
              )}
            </div>
          );
        },
      },
      {
        id: "tags",
        header: "Teglar",
        meta: { cellClassName: "min-w-[180px]" },
        cell: ({ row }) => {
          const client = row.original;
          const clientId = get(client, "id");
          const isInvitation = get(client, "entityType") === "invitation";
          if (isInvitation || !clientId) return null;
          const tags = getClientTags ? getClientTags(clientId) : [];
          return (
            <div className="flex flex-wrap items-center gap-1" onClick={(e) => e.stopPropagation()}>
              {map(tags, (tagId) => (
                <ClientTagBadge key={tagId} tagId={tagId} />
              ))}
              <ClientTagsEditor
                clientId={clientId}
                clientTags={tags}
                onToggle={toggleTag}
              />
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "",
        size: 56,
        cell: ({ row }) => (
          <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
            <ActionsMenu
              client={row.original}
              onView={handleView}
              onPayment={handleOpenPayment}
              onPaymentDay={handleOpenPaymentDay}
              onCancelPayment={handleCancelPayment}
              onRemove={handleRemove}
              onResendInvite={handleResendInvite}
              onCancelInvitation={handleCancelInvitation}
              onAssignPlan={handleAssignPlan}
              isInviting={isInviting}
              isRemoving={isRemoving}
            />
          </div>
        ),
      },
    ],
    [
      currentPage,
      pageSize,
      handleView,
      handleOpenPayment,
      handleOpenPaymentDay,
      handleCancelPayment,
      handleRemove,
      handleResendInvite,
      handleCancelInvitation,
      handleAssignPlan,
      isInviting,
      isRemoving,
      getClientTags,
      toggleTag,
      t,
      i18n.language,
    ],
  );
};
