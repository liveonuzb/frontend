import { AlertCircleIcon, RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const CoachErrorState = ({
  title = "Error loading data",
  description = "Something went wrong while loading the data. Please try again.",
  onRetry,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 px-6 py-12 text-center ${className}`}
    >
      <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-destructive/10">
        <AlertCircleIcon className="size-5 text-destructive" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
      {onRetry && (
        <Button
          variant="outline"
          className="mt-5 rounded-2xl"
          onClick={onRetry}
        >
          <RefreshCwIcon className="mr-1.5 size-4" />
          Try again
        </Button>
      )}
    </div>
  );
};

export default CoachErrorState;
