import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const EarningsSectionCard = ({
  title,
  description,
  children,
  className,
}) => (
  <Card
    className={cn("rounded-[32px] border-border/60 bg-card/95 py-6", className)}
  >
    <CardHeader className="space-y-2 px-6">
      <CardTitle className="text-lg font-black tracking-tight">
        {title}
      </CardTitle>
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
    </CardHeader>
    <CardContent className="px-6">{children}</CardContent>
  </Card>
);

export default EarningsSectionCard;
