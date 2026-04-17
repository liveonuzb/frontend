import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const DetailSection = ({ title, description, children, action }) => (
  <Card className="border-border/60 shadow-sm">
    <CardContent className="space-y-4 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h4 className="text-sm font-semibold tracking-tight">{title}</h4>
          {description ? (
            <p className="text-xs leading-5 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </CardContent>
  </Card>
);

const DetailStatCard = ({
  icon: Icon,
  label,
  value,
  hint,
  tone = "bg-primary/10 text-primary",
}) => (
  <Card className="border-border/60 shadow-sm">
    <CardContent className="space-y-3 p-4">
      <div
        className={cn(
          "flex size-10 items-center justify-center rounded-xl",
          tone,
        )}
      >
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        <p className="mt-1 text-xs font-medium text-muted-foreground">
          {label}
        </p>
      </div>
      {hint ? (
        <p className="text-xs leading-5 text-muted-foreground">{hint}</p>
      ) : null}
    </CardContent>
  </Card>
);

export { DetailSection, DetailStatCard };
