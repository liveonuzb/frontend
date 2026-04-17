import React from "react";
import { CrownIcon, LockIcon, SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store";
import { cn } from "@/lib/utils";

const isPremiumActive = (user) => {
  const status = user?.premium?.status;
  const planCode = user?.premium?.planCode;
  if (!status || !planCode) return false;
  if (planCode === "FREE" || planCode === "free") return false;
  return status === "active";
};

/**
 * Wraps children with a premium lock when user is on FREE plan.
 *
 * Props:
 *  - feature: string — name of the feature (for display)
 *  - description: string — short description of what premium unlocks
 *  - variant: "overlay" | "inline" | "blur" — how to show the gate
 *  - onUpgrade: function — called when user clicks upgrade button
 *  - children: ReactNode
 */
const PremiumGate = ({
  feature,
  description,
  variant = "overlay",
  onUpgrade,
  children,
  className,
}) => {
  const { user } = useAuthStore();
  const hasPremium = isPremiumActive(user);

  if (hasPremium) return children;

  if (variant === "inline") {
    return (
      <div className={cn("relative", className)}>
        <div className="pointer-events-none select-none opacity-40">{children}</div>
        <div className="mt-2 flex items-start gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-3 py-2">
          <CrownIcon className="mt-0.5 size-4 shrink-0 text-amber-500" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-amber-700">
              {feature || "Premium"} kerak
            </p>
            {description ? (
              <p className="mt-0.5 text-[11px] text-amber-600/80">{description}</p>
            ) : null}
          </div>
          {onUpgrade ? (
            <Button
              size="sm"
              className="h-7 shrink-0 rounded-lg bg-amber-500 px-2.5 text-xs text-white hover:bg-amber-600"
              onClick={onUpgrade}
            >
              <SparklesIcon className="mr-1 size-3" />
              Premium
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  if (variant === "blur") {
    return (
      <div className={cn("relative overflow-hidden rounded-2xl", className)}>
        <div className="pointer-events-none select-none blur-sm">{children}</div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl bg-background/70 backdrop-blur-[2px]">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
            <CrownIcon className="size-5" />
          </div>
          <p className="text-center text-sm font-bold">
            {feature || "Bu funksiya"} — Premium
          </p>
          {description ? (
            <p className="max-w-[200px] text-center text-xs text-muted-foreground">
              {description}
            </p>
          ) : null}
          {onUpgrade ? (
            <Button
              size="sm"
              className="mt-1 rounded-xl"
              onClick={onUpgrade}
            >
              <SparklesIcon className="mr-1.5 size-3.5" />
              Premium olish
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  // Default: overlay
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div className="pointer-events-none select-none opacity-30">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[inherit] bg-gradient-to-b from-background/80 to-background/95 backdrop-blur-[1px]">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/30">
          <LockIcon className="size-5" />
        </div>
        <div className="text-center">
          <p className="text-sm font-black">
            {feature || "Bu funksiya"} — Premium
          </p>
          {description ? (
            <p className="mt-0.5 max-w-[220px] text-xs text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {onUpgrade ? (
          <Button
            size="sm"
            className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 shadow-md shadow-amber-500/20 hover:from-amber-600 hover:to-amber-700"
            onClick={onUpgrade}
          >
            <CrownIcon className="mr-1.5 size-3.5" />
            Premium olish
          </Button>
        ) : null}
      </div>
    </div>
  );
};

/**
 * Small inline badge showing "Premium" tag — use on nav items or feature titles
 */
export const PremiumBadge = ({ className }) => (
  <span
    className={cn(
      "inline-flex items-center gap-0.5 rounded-md border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-600",
      className,
    )}
  >
    <CrownIcon className="size-2.5" />
    PRO
  </span>
);

/**
 * Hook — returns whether user has active premium
 */
export const useIsPremium = () => {
  const { user } = useAuthStore();
  return isPremiumActive(user);
};

export default PremiumGate;
