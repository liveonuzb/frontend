import React from "react";
import { ChevronRightIcon } from "lucide-react";

export default function NutritionPlansSection({
  currentPlan,
  currentPlanDayStatus,
  onOpenPlans,
  plans,
}) {
  const planStatusLabel = currentPlanDayStatus?.isExpired
    ? "30 kunlik reja tugadi"
    : currentPlanDayStatus?.isDurationPlan
      ? `${currentPlanDayStatus.dayNumber}/${currentPlanDayStatus.durationDays}-kun`
      : currentPlan?.status === "active"
        ? "Faol reja"
        : "Saqlangan reja";

  if (plans.length > 0) {
    return (
      <button
        type="button"
        onClick={onOpenPlans}
        className="rounded-[2rem] border p-4 text-left transition-colors hover:bg-accent/40 sm:p-5"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Mening rejalarim
            </p>
            <h3 className="mt-1 truncate text-base font-black">
              {currentPlan?.name || "Reja tanlang"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {plans.length} ta reja • {planStatusLabel}
            </p>
            {currentPlanDayStatus?.isExpired ? (
              <p className="mt-1 text-xs font-semibold text-primary">
                Yangi template tanlang yoki rejani yangilang.
              </p>
            ) : null}
          </div>
          <ChevronRightIcon className="size-5 shrink-0 text-muted-foreground" />
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpenPlans}
      className="rounded-[2rem] border border-dashed p-5 text-left transition-colors hover:bg-accent/30"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Mening rejalarim
          </p>
          <h3 className="mt-1 text-base font-black">
            Ovqatlanish rejasi yo&apos;q
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Qo&apos;lda yoki AI bilan yangi reja yarating
          </p>
        </div>
        <ChevronRightIcon className="size-5 shrink-0 text-muted-foreground" />
      </div>
    </button>
  );
}
