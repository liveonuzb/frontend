import React from "react";
import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const CoachOptionCard = ({
  selected = false,
  onClick,
  title,
  description,
  icon,
  multi = false,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex w-full items-start gap-3 rounded-2xl border px-4 py-4 text-left transition-colors",
        selected ? "border-primary bg-primary/5" : "hover:bg-muted/60",
      )}
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-muted text-xl">
        {icon}
      </div>
      <div className="min-w-0 space-y-1">
        <div className="font-medium leading-none">{title}</div>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {selected ? (
        <span className="ml-auto inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <CheckIcon className="size-4" />
        </span>
      ) : multi ? (
        <span className="ml-auto text-xs text-muted-foreground">Tanlash</span>
      ) : null}
    </button>
  );
};

export default CoachOptionCard;
