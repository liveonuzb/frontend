import React from "react";
import { CheckIcon, XIcon, MinusIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const STYLES = {
  good: {
    bg: "bg-emerald-500 text-white",
    label: "Yaxshi",
  },
  average: {
    bg: "bg-amber-500 text-white",
    label: "O'rtacha",
  },
  bad: {
    bg: "bg-red-500 text-white",
    label: "Yomon",
  },
};

export default function DayStatusDot({ dayNumber, status, dayLabel }) {
  const style = STYLES[status] ?? STYLES.bad;
  const Icon = status === "good" ? CheckIcon : status === "average" ? MinusIcon : XIcon;

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] font-semibold text-muted-foreground">
        {dayNumber}
      </span>
      {dayLabel ? (
        <span className="text-[9px] font-medium text-muted-foreground/70">
          {dayLabel}
        </span>
      ) : null}
      <div
        className={cn(
          "flex size-7 items-center justify-center rounded-full shadow-sm",
          style.bg,
        )}
      >
        <Icon className="size-3.5" strokeWidth={3} />
      </div>
    </div>
  );
}
