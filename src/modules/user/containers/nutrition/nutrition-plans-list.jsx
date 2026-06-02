import React from "react";
import map from "lodash/map";
import toNumber from "lodash/toNumber";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  CheckIcon,
  ChevronRightIcon,
  MoreVerticalIcon,
  PencilIcon,
  PlayIcon,
  ShoppingCartIcon,
  Trash2Icon,
} from "lucide-react";

const getDurationDays = (plan) =>
  Number.isFinite(Number(plan.durationDays)) && Number(plan.durationDays) > 0
    ? Number(plan.durationDays)
    : 7;

const getPlanCalories = (plan, goals) =>
  toNumber(plan?.appliedTargetCalories || goals?.calories || 0);

const getMealCount = (plan) => toNumber(plan?.mealCount || 4) || 4;

const getSourceLabel = (getPlanSourceMeta, plan) =>
  getPlanSourceMeta(plan.source).label;

const getStatusLabel = (getPlanStatusMeta, plan) =>
  getPlanStatusMeta(plan.status).label.replace(" reja", "");

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
  goals,
  variant = "cards",
}) {
  if (orderedPlans.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-dashed p-5 text-sm text-muted-foreground">
        Bu bo&apos;limda hozircha reja yo&apos;q.
      </div>
    );
  }

  const renderPlanCard = (plan) => {
    const isSelected = plan.id === currentPlan?.id;
    const isActiveStatus = plan.status === "active";
    const insights = planInsightsMap[plan.id] || {
      filledDays: 0,
      totalItems: 0,
      updatedLabel: null,
    };
    const durationDays = getDurationDays(plan);
    const mealCount = getMealCount(plan);
    const totalItems = toNumber(insights.totalItems || 0);

    return (
      <div
        key={plan.id}
        className={cn(
          "rounded-[1.5rem] border bg-card p-4 shadow-sm transition-all",
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
                  {getStatusLabel(getPlanStatusMeta, plan)}
                </span>
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] font-medium",
                    getPlanSourceMeta(plan.source).badgeClassName,
                  )}
                >
                  {getSourceLabel(getPlanSourceMeta, plan)}
                </span>
              </div>
              <p className="truncate text-base font-black">{plan.name}</p>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-bold text-muted-foreground">
                <span className="rounded-full border bg-background px-2.5 py-1">
                  {durationDays} kunlik
                </span>
                <span className="rounded-full border bg-background px-2.5 py-1">
                  {mealCount} mahal / kun
                </span>
                <span className="rounded-full border bg-background px-2.5 py-1">
                  {totalItems} ta ovqat
                </span>
              </div>
              {plan.description ? (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {plan.description}
                </p>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">
                  {plan.mealCount || 4} mahal uchun tuzilgan reja
                </p>
              )}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-muted/40 px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Mahal
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {mealCount}
                  </p>
                </div>
                <div className="rounded-2xl bg-muted/40 px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Ovqat
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {totalItems}
                  </p>
                </div>
                <div className="rounded-2xl bg-muted/40 px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    To&apos;ldirilgan kun
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {insights.filledDays}/{durationDays}
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
                  : "Bosilsa faol bo'ladi"}
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
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={() => void onRemovePlan(plan)}
            aria-label="Rejani o'chirish"
          >
            <Trash2Icon className="size-4" />
          </Button>
        </div>
      </div>
    );
  };

  if (variant !== "table") {
    return map(orderedPlans, renderPlanCard);
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b text-[11px] uppercase text-muted-foreground">
              <th className="px-5 py-4 font-bold">Reja nomi</th>
              <th className="px-5 py-4 font-bold">Taomlar</th>
              <th className="px-5 py-4 font-bold">Kaloriya / kun</th>
              <th className="px-5 py-4 font-bold">Yangilangan</th>
              <th className="px-5 py-4 font-bold">Status</th>
              <th className="px-5 py-4 text-right font-bold" aria-label="Amallar" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70">
            {map(orderedPlans, (plan) => {
              const isSelected = plan.id === currentPlan?.id;
              const isActiveStatus = plan.status === "active";
              const insights = planInsightsMap[plan.id] || {
                updatedLabel: null,
              };
              const durationDays = getDurationDays(plan);
              const mealCount = getMealCount(plan);
              const totalItems = toNumber(insights.totalItems || 0);
              const calories = getPlanCalories(plan, goals);

              return (
                <tr
                  key={plan.id}
                  className={cn(
                    "transition-colors hover:bg-muted/25",
                    isSelected && "bg-primary/5",
                  )}
                >
                  <td className="min-w-[280px] p-5">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "size-2.5 rounded-full",
                          isActiveStatus
                            ? "bg-primary"
                            : "bg-muted-foreground/35",
                        )}
                      />
                      <div className="min-w-0">
                        <p className="truncate font-black">{plan.name}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                            {durationDays} kunlik
                          </span>
                          <span className="rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                            {mealCount} mahal / kun
                          </span>
                          {isActiveStatus ? (
                            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                              Faol
                            </span>
                          ) : null}
                          <span
                            className={cn(
                              "rounded-full border px-3 py-1 text-xs font-medium",
                              getPlanSourceMeta(plan.source).badgeClassName,
                            )}
                          >
                            {getSourceLabel(getPlanSourceMeta, plan)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-5 font-semibold">
                    <p>{mealCount} mahal / kun</p>
                    <p className="mt-1 text-xs font-medium text-muted-foreground">
                      {totalItems} ta ovqat
                    </p>
                  </td>
                  <td className="p-5 font-semibold">
                    {calories
                      ? `${calories.toLocaleString("en-US")} kcal`
                      : "-"}
                  </td>
                  <td className="p-5 font-semibold">
                    {insights.updatedLabel || "-"}
                  </td>
                  <td className="p-5">
                    <span className="inline-flex items-center gap-2 font-semibold text-muted-foreground">
                      <span
                        className={cn(
                          "size-2 rounded-full",
                          isActiveStatus
                            ? "bg-primary"
                            : "bg-muted-foreground/35",
                        )}
                      />
                      {getStatusLabel(getPlanStatusMeta, plan)}
                    </span>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center justify-end gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 rounded-xl px-7 text-primary"
                        onClick={() => void onActivatePlan(plan)}
                      >
                        Ko'rish
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-11 rounded-full"
                        onClick={() => onOpenPlanActions(plan)}
                        aria-label="Reja amallari"
                      >
                        <MoreVerticalIcon className="size-5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="border-t px-5 py-4 text-center">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full text-sm font-black text-primary outline-none transition hover:text-primary/80 focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => currentPlan && onActivatePlan(currentPlan)}
          >
            Barcha rejalarni ko'rish
            <ChevronRightIcon className="size-4" />
          </button>
        </div>
      </div>
      <div className="space-y-3 p-3 md:hidden">
        {map(orderedPlans, renderPlanCard)}
      </div>
    </>
  );
}
