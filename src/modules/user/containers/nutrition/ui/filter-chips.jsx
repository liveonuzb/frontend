import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { map } from "lodash";

export default function FilterChips({
  options,
  value,
  onChange,
  className,
  ariaLabel = "Filtrlar",
}) {
  return (
    <div
      className={cn("flex gap-2 overflow-x-auto pb-1", className)}
      role="tablist"
      aria-label={ariaLabel}
    >
      {map(options, (option) => {
        const isActive = value === option.key;

        return (
          <Button
            key={option.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            variant={isActive ? "default" : "outline"}
            className={cn(
              "shrink-0 rounded-full px-4",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "border-primary/15 bg-card/80 hover:border-primary/30 hover:bg-primary/5",
            )}
            onClick={() => onChange(option.key)}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
