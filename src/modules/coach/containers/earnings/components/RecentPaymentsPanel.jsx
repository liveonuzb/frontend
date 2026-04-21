import React from "react";
import { get, map, size, toUpper } from "lodash";
import { cn } from "@/lib/utils";
import EarningsSectionCard from "./EarningsSectionCard.jsx";
import { formatDate, formatMoney, STATUS_LABELS } from "./earnings-utils.js";

export const RecentPaymentsPanel = ({ payments = [] }) => (
  <EarningsSectionCard
    title="So'nggi to'lovlar"
    description="Eng oxirgi qayd etilgan to'lovlar."
  >
    {size(payments) ? (
      <div className="space-y-3">
        {map(payments, (payment) => (
          <div
            key={get(payment, "id")}
            className="rounded-2xl border border-border/60 px-4 py-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="font-semibold">
                {get(payment, "client.fullName") ||
                  get(payment, "client.name") ||
                  "Noma'lum"}
              </div>
              <div className="text-sm font-semibold">
                {formatMoney(get(payment, "amount"))}
              </div>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {toUpper(get(payment, "method", ""))} &bull;{" "}
                {formatDate(get(payment, "paidAt"))}
              </span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  get(payment, "status") === "completed" &&
                    "bg-emerald-500/10 text-emerald-600",
                  get(payment, "status") === "pending" &&
                    "bg-amber-500/10 text-amber-600",
                  get(payment, "status") === "overdue" &&
                    "bg-rose-500/10 text-rose-600",
                  get(payment, "status") === "cancelled" &&
                    "bg-zinc-500/10 text-zinc-500",
                  get(payment, "status") === "refunded" &&
                    "bg-sky-500/10 text-sky-600",
                )}
              >
                {STATUS_LABELS[get(payment, "status")] || get(payment, "status")}
              </span>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="rounded-2xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
        Hali to&apos;lov yozuvlari yo&apos;q
      </div>
    )}
  </EarningsSectionCard>
);

export default RecentPaymentsPanel;
