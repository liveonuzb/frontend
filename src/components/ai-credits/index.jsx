import { SparklesIcon } from "lucide-react";
import { get } from "lodash";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  getAiCreditFeatureLabel,
  getAiCreditStatus,
} from "@/hooks/app/use-ai-credits";

export const AiCreditCostBadge = ({
  feature,
  costs = {},
  className,
  showLabel = false,
}) => {
  const cost = get(costs, feature);

  if (cost === null || cost === undefined) {
    return null;
  }

  return (
    <Badge
      variant="outline"
      className={cn("h-6 gap-1 border-primary/15 bg-primary/5", className)}
      title={getAiCreditFeatureLabel(feature)}
    >
      <SparklesIcon className="size-3 text-primary" aria-hidden="true" />
      {showLabel ? `${getAiCreditFeatureLabel(feature)}: ` : null}
      {cost} AI
    </Badge>
  );
};

export const AiCreditBalanceBadge = ({ wallet, className }) => {
  const remaining = get(wallet, "remaining");

  if (remaining === null || remaining === undefined) {
    return null;
  }

  return (
    <Badge
      variant={get(wallet, "isExhausted") ? "destructive" : "secondary"}
      className={cn("h-6 gap-1", className)}
      title="AI credits remaining"
    >
      <SparklesIcon className="size-3" aria-hidden="true" />
      {remaining} left
    </Badge>
  );
};

export const AiCreditStatusText = ({ feature, wallet, costs, className }) => {
  const status = getAiCreditStatus({ feature, wallet, costs });

  if (status.cost === null && status.remaining === null) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs text-muted-foreground",
        status.isDisabled && "text-destructive",
        className,
      )}
    >
      <SparklesIcon className="size-3" aria-hidden="true" />
      {status.cost ?? "-"} AI
      {status.remaining !== null ? ` | ${status.remaining} left` : null}
    </span>
  );
};
