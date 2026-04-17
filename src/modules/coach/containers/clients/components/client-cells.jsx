import { get } from "lodash";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { 
  getStatusConfig, 
  getInitials, 
  formatMoney, 
  normalizeProgress 
} from "../utils";

export const NameCell = ({ client, onOpenDetail }) => {
  const { t, i18n } = useTranslation();
  const isInvitation = get(client, "entityType") === "invitation";

  return (
    <div className="flex items-center gap-4 py-1 pr-4">
      <Avatar className="size-10 border shadow-sm shrink-0">
        <AvatarImage src={get(client, "avatar")} alt={get(client, "name")} />
        <AvatarFallback className="bg-primary/5 text-primary font-semibold">
          {getInitials(get(client, "name")) || "M"}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex flex-col gap-0.5">
        <button
          type="button"
          className="flex items-center text-left hover:underline text-primary w-full max-w-full"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetail(client);
          }}
        >
          <span className="truncate font-semibold text-foreground text-sm tracking-tight">
            {get(client, "name")}
          </span>
        </button>
        <div className="flex flex-col gap-1 text-[11px] text-muted-foreground leading-none">
          <div className="flex items-center gap-2 truncate">
            {get(client, "email") && <span className="truncate">{get(client, "email")}</span>}
            {get(client, "email") && get(client, "phone") && <span className="text-border">•</span>}
            {get(client, "phone") && <span className="shrink-0">{get(client, "phone")}</span>}
          </div>
          {isInvitation && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge 
                variant="outline" 
                className="h-4 px-1.5 text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 border-amber-500/20"
              >
                {t("coach.clients.cells.invitationVia", { method: t(`coach.clients.inviteSteps.method.${get(client, "contactMethod", "phone")}.label`) })}
              </Badge>
                  <Badge 
                    variant="outline" 
                    className="h-4 px-1.5 text-[9px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-600 border-rose-500/20"
                  >
                    {t("coach.clients.cells.declined")}
                  </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const StatusCell = ({ status }) => {
  const { t } = useTranslation();
  const statusConfig = getStatusConfig(t);
  const config = get(statusConfig, status, { label: status, className: "" });
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
};

export const ProgressCell = ({ progress: rawProgress, isInvitation }) => {
  if (isInvitation) return <span className="text-muted-foreground">—</span>;
  const progress = normalizeProgress(rawProgress);

  return (
    <div className="min-w-28 space-y-1.5 py-1">
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            progress >= 75 ? "bg-green-500" : 
            progress >= 40 ? "bg-amber-500" : "bg-slate-400"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export const PaymentCell = ({ client }) => {
  const { t, i18n } = useTranslation();
  if (get(client, "entityType") !== "client") return <span className="text-muted-foreground">—</span>;
  const statusLabel = get(client, "paymentSummary.label", t("coach.clients.cells.payment.notSet"));
  const dayLabel = get(client, "paymentSummary.dayOfMonth")
    ? t("coach.clients.cells.payment.dayFormat", { day: get(client, "paymentSummary.dayOfMonth") })
    : t("coach.clients.cells.payment.noDay");

  return (
    <div className="space-y-1">
      <p className="text-sm font-medium">{formatMoney(get(client, "agreedAmount"), t, i18n.language)}</p>
      <p className="text-xs text-muted-foreground">{statusLabel}</p>
      <p className="text-xs text-muted-foreground">{dayLabel}</p>
    </div>
  );
};

export const PlanCell = ({ client }) => {
  const { t } = useTranslation();
  if (get(client, "entityType") !== "client") return <span className="text-muted-foreground">—</span>;
  const hasPlan = Boolean(get(client, "activePlanName"));
  
  return (
    <Badge
      variant="outline"
      className={cn(
        "bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
        !hasPlan && "bg-slate-500/10 text-slate-500 border-slate-200 dark:border-slate-700"
      )}
    >
      {hasPlan ? t("coach.clients.cells.plan.assigned") : t("coach.clients.cells.plan.notAssigned")}
    </Badge>
  );
};
