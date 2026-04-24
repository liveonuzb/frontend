import React from "react";
import { ChevronRightIcon, FileHeartIcon, SparklesIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const OnboardingHealthReportCard = ({
  title,
  description,
  badge,
  actionLabel,
  onAction,
  compact = false,
  className,
}) => {
  return (
    <Card
      className={cn(
        "overflow-hidden border-primary/15 bg-gradient-to-br from-primary/[0.09] via-card to-amber-500/[0.08] py-0 shadow-none",
        compact && "bg-gradient-to-br from-primary/[0.08] via-card to-card",
        className,
      )}
    >
      <CardContent
        className={cn(
          "flex flex-col gap-4 p-5",
          compact ? "sm:flex-row sm:items-center sm:justify-between" : "",
        )}
      >
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
            <FileHeartIcon className="size-5" />
          </div>

          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {badge ? (
                <Badge variant="outline" className="border-primary/20 bg-background/70">
                  <SparklesIcon className="size-3" />
                  {badge}
                </Badge>
              ) : null}
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-semibold tracking-tight md:text-lg">
                {title}
              </h3>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            </div>
          </div>
        </div>

        <div className={cn("flex shrink-0", compact ? "sm:justify-end" : "")}>
          <Button
            type="button"
            size={compact ? "sm" : "lg"}
            className="w-full gap-2 border-transparent sm:w-auto"
            onClick={onAction}
          >
            {actionLabel}
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OnboardingHealthReportCard;
