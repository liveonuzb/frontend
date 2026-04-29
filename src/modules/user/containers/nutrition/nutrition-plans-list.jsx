import React from "react";
import { map } from "lodash";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  CheckIcon,
  ChevronRightIcon,
  PencilIcon,
  PlayIcon,
  ShieldCheckIcon,
  ShoppingCartIcon,
  Trash2Icon,
} from "lucide-react";

export default function NutritionPlansList({
  orderedPlans,
  currentPlan,
  planInsightsMap,
  getPlanStatusMeta,
  getPlanSourceMeta,
  onActivatePlan,
  onOpenPlanActions,
  onRemovePlan,
  onSelectPlanForShopping,
}) {
  if (orderedPlans.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-dashed p-5 text-sm text-muted-foreground">
        Bu bo&apos;limda hozircha reja yo&apos;q.
      </div>
    );
  }

  return map(orderedPlans, (plan) => {
    const isSelected = plan.id === currentPlan?.id;
    const isActiveStatus = plan.status === "active";
    const insights = planInsightsMap[plan.id] || {
      filledDays: 0,
      totalItems: 0,
      updatedLabel: null,
    };

    return (
      <div
        key={plan.id}
        className={cn(
          "rounded-[1.5rem] border bg-card px-4 py-4 shadow-sm transition-all",
          isSelected
            ? "border-primary bg-primary/5 shadow-primary/10"
            : "hover:border-primary/25 hover:bg-accent/60",
        )}
      >
        <button
          type="button"
          onClick={() => void onActivatePlan(plan)}
          className="w-full text-left"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest",
                    getPlanStatusMeta(plan.status).badgeClassName,
                  )}
                >
                  {getPlanStatusMeta(plan.status).label.replace(" reja", "")}
                </span>
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] font-medium",
                    getPlanSourceMeta(plan.source).badgeClassName,
                  )}
                >
                  {getPlanSourceMeta(plan.source).label}
                </span>
                {plan.syncStatus === "update_available" ? (
                  <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-[11px] font-medium text-blue-600 dark:text-blue-300">
                    Yangilanish bor
                  </span>
                ) : null}
              </div>
              <p className="truncate text-base font-black">{plan.name}</p>
              {plan.description ? (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {plan.description}
                </p>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">
                  {plan.mealCount || 4} mahal uchun tuzilgan reja
                </p>
              )}
              {plan.source === "coach" && plan.coach?.name ? (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {plan.coach.avatar ? (
                    <img
                      loading="lazy"
                      src={plan.coach.avatar}
                      alt={plan.coach.name}
                      className="size-5 rounded-full object-cover"
                    />
                  ) : (
                    <ShieldCheckIcon className="size-3.5 text-blue-500" />
                  )}
                  <span className="truncate">{plan.coach.name} yuborgan</span>
                  {plan.coachTemplate?.version ? (
                    <span className="rounded-full border border-blue-500/15 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-300">
                      v{plan.coachTemplate.version}
                    </span>
                  ) : null}
                </div>
              ) : null}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-muted/40 px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Mahal
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {plan.mealCount || 4}
                  </p>
                </div>
                <div className="rounded-2xl bg-muted/40 px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Ovqat
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {insights.totalItems}
                  </p>
                </div>
                <div className="rounded-2xl bg-muted/40 px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    To&apos;ldirilgan kun
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {insights.filledDays}/7
                  </p>
                </div>
                <div className="rounded-2xl bg-muted/40 px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Yangilandi
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold">
                    {insights.updatedLabel || "\u2014"}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {isActiveStatus ? (
                <div className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
                  Faol
                </div>
              ) : isSelected ? (
                <div className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
                  Tanlangan
                </div>
              ) : null}
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-2xl border",
                  isSelected
                    ? "border-primary/20 bg-primary/10 text-primary"
                    : "text-muted-foreground",
                )}
              >
                {isSelected ? (
                  isActiveStatus ? (
                    <CheckIcon className="size-4" />
                  ) : (
                    <PlayIcon className="size-4" />
                  )
                ) : (
                  <ChevronRightIcon className="size-4" />
                )}
              </div>
              <p className="text-right text-[11px] text-muted-foreground">
                {isActiveStatus
                  ? "Hozir ishlatilmoqda"
                  : "Bosilsa faol bo\u2018ladi"}
              </p>
            </div>
          </div>
        </button>
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onOpenPlanActions(plan)}
            aria-label="Rejani tahrirlash"
          >
            <PencilIcon className="size-4" />
          </Button>
          {!isActiveStatus ? (
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => void onActivatePlan(plan)}
            >
              <PlayIcon className="size-4" />
              Faollashtirish
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onSelectPlanForShopping(plan.id)}
            >
              <ShoppingCartIcon className="size-4" />
              Xaridlar ro&apos;yxati
            </Button>
          )}
          {plan.source !== "coach" ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={() => void onRemovePlan(plan)}
              aria-label="Rejani o\u2018chirish"
            >
              <Trash2Icon className="size-4" />
            </Button>
          ) : null}
        </div>
      </div>
    );
  });
}
