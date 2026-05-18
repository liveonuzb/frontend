import React from "react";
import { Button } from "@/components/ui/button";
import { BookOpenIcon, SparklesIcon, PencilIcon } from "lucide-react";
import NutritionPlansList from "../nutrition-plans-list.jsx";

import { filter, map } from "lodash";

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
  onCreateFromTemplate,
}) {
  const [planFilter, setPlanFilter] = React.useState("all");
  const filteredPlans = React.useMemo(() => {
    if (planFilter === "all") {
      return orderedPlans;
    }

    return filter(orderedPlans, (plan) => plan.status === planFilter);
  }, [orderedPlans, planFilter]);
  const filterOptions = [
    { key: "all", label: "Barchasi" },
    { key: "active", label: "Faol" },
    { key: "draft", label: "Qoralama" },
    { key: "archived", label: "Arxiv" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Ovqatlanish rejalari
          </p>
          <h1 className="text-3xl font-black tracking-tight">
            Rejalar
          </h1>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={onCreateManual}>
            <PencilIcon className="size-4" />
            Qo&apos;lda yaratish
          </Button>
          <Button variant="outline" onClick={onCreateFromTemplate}>
            <BookOpenIcon className="size-4" />
            Shablondan tanlash
          </Button>
          <Button onClick={onCreateAI}>
            <SparklesIcon className="size-4" />
            AI bilan yaratish
          </Button>
        </div>
      </div>
      {currentPlan ? (
        <div className="rounded-3xl border border-primary/20 bg-primary/5 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">
            Faol reja
          </p>
          <h2 className="mt-2 text-xl font-black">{currentPlan.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {currentPlan.status === "active" ? "Ishlatilmoqda" : "Tanlangan"} •{" "}
            {currentPlan.source === "ai" ? "AI" : "Manual"}
          </p>
        </div>
      ) : null}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {map(filterOptions, (option) => (
          <Button
            key={option.key}
            type="button"
            variant={planFilter === option.key ? "default" : "outline"}
            className="shrink-0"
            onClick={() => setPlanFilter(option.key)}
          >
            {option.label}
          </Button>
        ))}
      </div>
      <div className="space-y-3">
        <NutritionPlansList
          orderedPlans={filteredPlans}
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
