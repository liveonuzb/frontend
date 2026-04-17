import {
  find,
  get,
  isArray,
  map,
  size,
} from "lodash";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { 
  getInviteMethodOptions, 
  getWeekdayOptions, 
  formatPaymentDay, 
  normalizeProgress, 
  formatMoney,
  getPaymentDayOptions
} from "../utils";

export const ClientExpandedRow = ({ client }) => {
  const { t } = useTranslation();
  const isInvitation = get(client, "entityType") === "invitation";
  const inviteMethodOptions = getInviteMethodOptions(t);
  const weekdayOptions = getWeekdayOptions(t);

  if (isInvitation) {
    return (
      <div className="px-14 py-4 space-y-4 bg-muted/20 border-t">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">{t("coach.clients.expanded.contactMethod")}</p>
            <p className="text-sm font-medium">
              {get(find(inviteMethodOptions, { value: get(client, "contactMethod") }), "label", "—")}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("coach.clients.expanded.value")}</p>
            <p className="text-sm font-medium">{get(client, "identifierValue", "—")}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("coach.clients.expanded.price")}</p>
            <p className="text-sm font-medium">
              {get(client, "agreedAmount") ? `${formatMoney(get(client, "agreedAmount"), t)}` : t("coach.clients.expanded.noAgreement")}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("coach.clients.expanded.agreedAmountLabel")}</p>
            <p className="text-sm font-medium">{formatPaymentDay(get(client, "paymentDate"))}</p>
          </div>
        </div>
        {get(client, "notes") && (
          <div>
            <p className="text-xs text-muted-foreground">{t("coach.clients.expanded.coachNotes")}</p>
            <p className="text-sm leading-relaxed">{get(client, "notes")}</p>
          </div>
        )}
        {isArray(get(client, "trainingSchedule")) && size(get(client, "trainingSchedule")) > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">{t("coach.clients.expanded.schedule")}</p>
            <div className="flex flex-wrap gap-2">
              {map(get(client, "trainingSchedule"), (slot, i) => (
                <div key={i} className="px-3 py-1.5 rounded-full border bg-background text-xs">
                  <span className="font-medium">
                    {get(find(weekdayOptions, { value: get(slot, "day") }), "label", get(slot, "day"))}
                  </span>
                  <span className="text-muted-foreground"> · {get(slot, "time")}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-14 py-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 bg-muted/20 border-t items-start">
      <div className="space-y-1">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t("coach.clients.expanded.activePlans")}</p>
        <p className="text-sm">{get(client, "activePlanName", t("coach.clients.expanded.noActivePlans"))}</p>
      </div>
      <div className="space-y-1">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t("coach.clients.expanded.goalLabel")}</p>
        <p className="text-sm">{get(client, "goal", t("coach.clients.expanded.noGoal"))}</p>
        {(get(client, "currentWeight") || get(client, "targetWeight")) && (
          <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
            {get(client, "currentWeight") && <span>{t("coach.clients.expanded.weightLabel")}: {get(client, "currentWeight")}kg</span>}
            {get(client, "currentWeight") && get(client, "targetWeight") && <span className="text-border">•</span>}
            {get(client, "targetWeight") && <span>{t("coach.clients.expanded.targetWeightLabel")}: {get(client, "targetWeight")}kg</span>}
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t("coach.clients.expanded.progressLabel")}</p>
        <div className="flex items-center gap-3">
          <div className="h-1.5 flex-1 max-w-[120px] rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                normalizeProgress(get(client, "progress")) >= 75 ? "bg-green-500" :
                normalizeProgress(get(client, "progress")) >= 40 ? "bg-amber-500" : "bg-slate-400"
              )}
              style={{ width: `${normalizeProgress(get(client, "progress"))}%` }}
            />
          </div>
          <span className="text-xs font-semibold">{normalizeProgress(get(client, "progress"))}%</span>
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t("coach.clients.expanded.paymentStatusLabel")}</p>
        {get(client, "paymentSummary.label") ? (
           <div className="text-sm">
             {get(client, "paymentSummary.label")} ({get(client, "paymentSummary.dayOfMonth") ? t("coach.clients.cells.payment.dayFormat", { day: get(client, "paymentSummary.dayOfMonth") }) : t("coach.clients.cells.payment.noDay")})
             <br/>
             {get(client, "agreedAmount") && <span className="font-medium text-foreground">{formatMoney(get(client, "agreedAmount"), t)}</span>}
           </div>
        ) : (
          <p className="text-sm">{t("coach.clients.expanded.noPaymentInfo")}</p>
        )}
      </div>
    </div>
  );
};
