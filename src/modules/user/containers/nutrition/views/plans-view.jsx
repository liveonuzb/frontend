import React from "react";
import { Button } from "@/components/ui/button";
import { SparklesIcon, PencilIcon } from "lucide-react";
import NutritionPlansList from "../nutrition-plans-list.jsx";

export default function NutritionPlansView({
  orderedPlans,
  currentPlan,
  planInsightsMap,
  getPlanStatusMeta,
  getPlanSourceMeta,
  onActivatePlan,
  onOpenPlanActions,
  onRemovePlan,
  onSelectPlanForShopping,
  onCreateManual,
  onCreateAI,
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Plan management
          </p>
          <h1 className="text-3xl font-black tracking-tight">
            Mening rejalarim
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Rejalarni faollashtirish, tahrirlash yoki yangi reja yaratish
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={onCreateManual}>
            <PencilIcon className="size-4" />
            Qo&apos;lda yaratish
          </Button>
          <Button onClick={onCreateAI}>
            <SparklesIcon className="size-4" />
            AI bilan yaratish
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <NutritionPlansList
          orderedPlans={orderedPlans}
          currentPlan={currentPlan}
          planInsightsMap={planInsightsMap}
          getPlanStatusMeta={getPlanStatusMeta}
          getPlanSourceMeta={getPlanSourceMeta}
          onActivatePlan={onActivatePlan}
          onOpenPlanActions={onOpenPlanActions}
          onRemovePlan={onRemovePlan}
          onSelectPlanForShopping={onSelectPlanForShopping}
        />
      </div>
    </div>
  );
}
