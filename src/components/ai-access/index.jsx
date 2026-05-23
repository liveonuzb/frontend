import { SparklesIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getAiAccessStatus } from "@/hooks/app/use-ai-access";

export const AiAccessBadge = ({ access, wallet, className }) => {
  const status = getAiAccessStatus({ access, wallet });

  return (
    <Badge
      variant={status.isDisabled ? "destructive" : "secondary"}
      className={cn("h-6 gap-1", className)}
      title={status.label}
    >
      <SparklesIcon className="size-3" aria-hidden="true" />
      {status.label}
    </Badge>
  );
};

export const AiAccessStatusText = ({ access, wallet, className }) => {
  const status = getAiAccessStatus({ access, wallet });

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs text-muted-foreground",
        status.isDisabled && "text-destructive",
        className,
      )}
    >
      <SparklesIcon className="size-3" aria-hidden="true" />
      {status.label}
    </span>
  );
};
