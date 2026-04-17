import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function SectionCard({ title, subtitle, right, className, children }) {
  return (
    <Card className={cn("rounded-3xl border-border/70 bg-card/95 backdrop-blur-sm", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-border/60 px-5 py-5 sm:px-6">
        <div className="space-y-1">
          <CardTitle className="text-xl">{title}</CardTitle>
          {subtitle ? (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </CardHeader>
      <CardContent className="space-y-4 px-5 py-5 sm:px-6">{children}</CardContent>
    </Card>
  );
}
