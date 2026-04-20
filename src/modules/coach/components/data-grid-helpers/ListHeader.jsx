import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const ListHeader = ({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
}) => (
  <div
    className={cn(
      "flex flex-col gap-4 rounded-[2rem] border border-border/60 bg-card/60 p-5 backdrop-blur-sm",
      className,
    )}
  >
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="space-y-1">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>

      {Array.isArray(actions) && actions.length ? (
        <div className="flex flex-wrap items-center gap-2">
          {actions.map((action) => (
            <Button
              key={action.key || action.label}
              type="button"
              variant={action.variant || "default"}
              size={action.size || "sm"}
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {action.icon ? <action.icon className="size-4" /> : null}
              {action.label}
            </Button>
          ))}
        </div>
      ) : null}
    </div>

    {children}
  </div>
);

export default ListHeader;
