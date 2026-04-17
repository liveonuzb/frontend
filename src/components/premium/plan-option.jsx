import React from "react";
import { CheckIcon, CrownIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const formatPremiumPrice = (value, locale = "uz-UZ") =>
  new Intl.NumberFormat(locale).format(Number(value) || 0);

export const getShortestPremiumPlan = (plans = []) => {
  const comparablePlans = plans.filter(
    (plan) => Number(plan?.durationDays) > 0 && Number(plan?.price) > 0,
  );

  if (!comparablePlans.length) {
    return null;
  }

  return [...comparablePlans].sort(
    (left, right) => Number(left.durationDays) - Number(right.durationDays),
  )[0];
};

export const getPlanMonthlyEquivalent = (plan) => {
  const durationDays = Number(plan?.durationDays) || 0;
  const price = Number(plan?.price) || 0;

  if (durationDays <= 30 || price <= 0) {
    return null;
  }

  return Math.round(price / (durationDays / 30));
};

export const getPlanSavings = (plan, basePlan) => {
  const planDurationDays = Number(plan?.durationDays) || 0;
  const baseDurationDays = Number(basePlan?.durationDays) || 0;
  const planPrice = Number(plan?.price) || 0;
  const basePrice = Number(basePlan?.price) || 0;

  if (
    !basePlan ||
    planDurationDays <= baseDurationDays ||
    planPrice <= 0 ||
    basePrice <= 0
  ) {
    return null;
  }

  const comparablePrice = Math.round(
    (basePrice / baseDurationDays) * planDurationDays,
  );
  const savings = comparablePrice - planPrice;

  return savings > 0 ? savings : null;
};

const getPlanFeatures = (plan) =>
  Array.isArray(plan?.features) ? plan.features.filter(Boolean) : [];

const PremiumPlanOption = React.forwardRef(function PremiumPlanOption(
  {
    plan,
    locale = "uz-UZ",
    basePlan = null,
    isSelected = false,
    isCurrent = false,
    isBestValue = false,
    interactive = true,
    compact = false,
    currencyLabel = "UZS",
    selectedLabel = "Selected",
    currentLabel = "Current",
    bestValueLabel = "Best value",
    perMonthLabel = "per month",
    savingsLabel = "saved",
    durationLabel,
    className,
    onClick,
  },
  ref,
) {
  const monthlyEquivalent = getPlanMonthlyEquivalent(plan);
  const savings = getPlanSavings(plan, basePlan);
  const features = getPlanFeatures(plan).slice(0, compact ? 0 : 4);
  const indicatorActive = isSelected || isCurrent;
  const Wrapper = interactive ? "button" : "div";
  const badgeText = isCurrent
    ? currentLabel
    : isSelected
      ? selectedLabel
      : isBestValue || savings
        ? bestValueLabel
        : null;

  return (
    <Wrapper
      ref={ref}
      type={interactive ? "button" : undefined}
      onClick={interactive ? onClick : undefined}
      className={cn(
        interactive &&
          "block w-full text-left transition-transform duration-150 active:scale-[0.99]",
        className,
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] p-5 transition-all duration-200",
          indicatorActive
            ? "border-amber-400/90 bg-amber-500/[0.08] shadow-[0_0_0_1px_rgba(251,191,36,0.18)]"
            : "hover:border-white/20 hover:bg-white/[0.05]",
        )}
      >
        <div
          className={cn(
            "absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent",
            indicatorActive && "via-amber-300/90",
          )}
        />

        <div className="flex gap-4">
          <div
            className={cn(
              "mt-1 flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors",
              indicatorActive
                ? "border-amber-400 bg-amber-400 text-black"
                : "border-white/15 bg-transparent text-transparent",
            )}
          >
            <CheckIcon className="size-3.5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2">
                    <CrownIcon className="size-4 text-amber-400/80" />
                    <p className="text-lg font-semibold tracking-tight">
                      {plan?.name}
                    </p>
                  </div>
                  {plan?.period ? (
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                      {plan.period}
                    </span>
                  ) : null}
                </div>

                {!compact ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {plan?.description || plan?.period}
                  </p>
                ) : null}
              </div>

              {badgeText ? (
                isCurrent || isSelected ? (
                  <Badge className="rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-black hover:bg-amber-400">
                    {badgeText}
                  </Badge>
                ) : (
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                    {badgeText}
                  </span>
                )
              ) : null}
            </div>

            <div className={cn("flex items-end justify-between gap-4", compact ? "mt-4" : "mt-5")}>
              <div>
                <p
                  className={cn(
                    "font-semibold leading-none tracking-tight",
                    compact ? "text-[1.8rem]" : "text-[2rem]",
                  )}
                >
                  {formatPremiumPrice(plan?.price, locale)}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  {currencyLabel}
                </p>
              </div>

              <div className="text-right">
                {monthlyEquivalent ? (
                  <p className="text-sm font-medium text-foreground/85">
                    ~{formatPremiumPrice(monthlyEquivalent, locale)} {currencyLabel} /{" "}
                    {perMonthLabel}
                  </p>
                ) : plan?.period ? (
                  <p className="text-sm font-medium text-foreground/85">
                    {plan.period}
                  </p>
                ) : null}

                {savings ? (
                  <p className="mt-1 text-xs font-medium text-emerald-400">
                    {formatPremiumPrice(savings, locale)} {currencyLabel}{" "}
                    {savingsLabel}
                  </p>
                ) : plan?.durationDays ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {typeof durationLabel === "function"
                      ? durationLabel(plan.durationDays)
                      : durationLabel}
                  </p>
                ) : null}
              </div>
            </div>

            {!compact && features.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {features.map((feature) => (
                  <span
                    key={feature}
                    className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Wrapper>
  );
});

export default PremiumPlanOption;
