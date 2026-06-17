import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { userCardClassName } from "@/modules/user/lib/card-styles";

export default function SectionCard({
  title,
  subtitle,
  right,
  className,
  headerClassName,
  contentClassName,
  children,
}) {
  return (
    <Card
      className={cn(
        userCardClassName,
        "relative overflow-hidden py-4 transition-colors hover:bg-muted/30",
        className,
      )}
    >
      <CardHeader
        className={cn(
          "flex flex-row items-start justify-between gap-3 px-4 pb-2",
          headerClassName,
        )}
      >
        <div className="space-y-1">
          <CardTitle className="text-base font-bold tracking-tight">
            {title}
          </CardTitle>
          {subtitle ? (
            <p className="max-w-2xl text-sm text-muted-foreground">
              {subtitle}
            </p>
          ) : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </CardHeader>
      <CardContent className={cn("space-y-4 px-4 pb-4", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
