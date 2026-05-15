import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
        "overflow-hidden rounded-[2rem] border-border/70 bg-card/95 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-slate-950/55 dark:shadow-2xl dark:shadow-cyan-950/20",
        className,
      )}
    >
      <CardHeader
        className={cn(
          "flex flex-row items-start justify-between gap-3 border-b border-border/60 px-5 py-5 sm:px-6 dark:border-white/10",
          headerClassName,
        )}
      >
        <div className="space-y-1">
          <CardTitle className="text-xl tracking-tight sm:text-2xl">
            {title}
          </CardTitle>
          {subtitle ? (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </CardHeader>
      <CardContent className={cn("space-y-4 px-5 py-5 sm:px-6", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
