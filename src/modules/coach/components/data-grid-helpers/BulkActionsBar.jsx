import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const BulkActionsBar = ({
  selectedCount = 0,
  title,
  description,
  actions = [],
  onClear,
  className,
}) => {
  if (!selectedCount) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-3xl border border-border/70 bg-card/80 px-4 py-3 md:flex-row md:items-center md:justify-between",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="rounded-full px-2.5 py-1">
          {selectedCount} ta tanlandi
        </Badge>
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-foreground">
            {title || "Bulk actions"}
          </p>
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {actions.map((action) => (
          <Button
            key={action.key || action.label}
            type="button"
            size="sm"
            variant={action.variant || "outline"}
            onClick={action.onClick}
            disabled={action.disabled}
          >
            {action.icon ? <action.icon className="size-4" /> : null}
            {action.label}
          </Button>
        ))}

        {onClear ? (
          <Button type="button" size="sm" variant="ghost" onClick={onClear}>
            Tozalash
          </Button>
        ) : null}
      </div>
    </div>
  );
};

export default BulkActionsBar;
