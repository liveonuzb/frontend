import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const SessionSummaryCard = ({ title, value, hint, icon: Icon, tone }) => (
  <Card className="py-5">
    <CardContent className="flex items-start justify-between gap-3">
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <div className={cn("rounded-2xl p-3", tone)}>
        <Icon className="size-5" />
      </div>
    </CardContent>
  </Card>
);

export default SessionSummaryCard;
