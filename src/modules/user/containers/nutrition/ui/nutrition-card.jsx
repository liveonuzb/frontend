import React from "react";
import { cn } from "@/lib/utils";

const surfaceByTone = {
  default: "border-border/70 bg-card/95 shadow-sm shadow-black/[0.03]",
  accent:
    "border-primary/20 bg-[linear-gradient(135deg,hsl(var(--card)),rgb(var(--accent-rgb)/0.08))] shadow-sm shadow-primary/5",
  muted: "border-border/70 bg-muted/25 shadow-sm shadow-black/[0.02]",
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
        "rounded-2xl border p-4 text-card-foreground sm:p-5",
        surfaceByTone[tone] || surfaceByTone.default,
        className,
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}

