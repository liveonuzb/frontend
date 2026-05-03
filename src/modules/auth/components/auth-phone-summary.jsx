import React from "react";
import { ArrowLeftIcon, LockKeyholeIcon } from "lucide-react";
import { Button } from "@/components/ui/button.jsx";

const AuthPhoneSummary = ({ phone, label, onBack, backLabel, icon: Icon }) => {
  const SummaryIcon = Icon || LockKeyholeIcon;

  return (
    <div className="flex items-center justify-between gap-3 rounded-[1.35rem] border border-border/80 bg-muted/35 p-2.5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
          <SummaryIcon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="truncate text-sm font-semibold">{phone}</p>
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onBack}
        className="shrink-0 rounded-full"
        aria-label={backLabel}
      >
        <ArrowLeftIcon className="size-4" />
      </Button>
    </div>
  );
};

export default AuthPhoneSummary;
