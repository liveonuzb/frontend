import React from "react";
import { BookOpenIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils.js";

const EmptyState = ({
  icon: Icon = BookOpenIcon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => (
  <Card className={cn("min-h-56 justify-center", className)}>
    <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-muted text-primary">
        <Icon className="size-5" />
      </span>
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {description ? (
          <p className="max-w-sm text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actionLabel ? (
        <Button type="button" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </CardContent>
  </Card>
);

export default EmptyState;
