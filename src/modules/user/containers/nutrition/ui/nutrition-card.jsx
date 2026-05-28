import React from "react";
import { cn } from "@/lib/utils";

const surfaceByTone = {
  default:
    "border-[rgb(var(--accent-rgb)/0.14)] bg-card/95 shadow-sm shadow-black/[0.03]",
  accent:
    "border-[rgb(var(--accent-rgb)/0.22)] bg-[linear-gradient(135deg,hsl(var(--card)),rgb(var(--accent-rgb)/0.07))] shadow-sm shadow-[rgb(var(--accent-rgb)/0.04)]",
  muted:
    "border-border/60 bg-muted/20 shadow-sm shadow-black/[0.02]",
};

export default function NutritionCard({
  as: Comp = "section",
  tone = "default",
  className,
  children,
  ...props
}) {
  return (
    <Comp
      className={cn(
        "rounded-[28px] border px-4 py-4 text-card-foreground sm:px-5 sm:py-5",
        surfaceByTone[tone] || surfaceByTone.default,
        className,
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}
