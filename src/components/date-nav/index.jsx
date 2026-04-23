import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const formatLong = (date) =>
  date.toLocaleDateString("uz-UZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

const formatShort = (date) =>
  date.toLocaleDateString("uz-UZ", {
    day: "numeric",
    month: "short",
  });

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const DateNav = ({
  date,
  onChange,
  maxDate,
  format = "long",
  className,
  onLabelClick,
}) => {
  const max = maxDate ?? new Date();
  const isAtMax = isSameDay(date, max);
  const isToday = isSameDay(date, new Date());
  const formatter = format === "short" ? formatShort : formatLong;

  const shift = (days) => {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    if (next <= max) {
      onChange(next);
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={() => shift(-1)}
      >
        <ChevronLeft className="size-4" />
      </Button>
      <button
        type="button"
        onClick={() => {
          if (onLabelClick) {
            onLabelClick(date);
            return;
          }

          if (!isToday) {
            onChange(new Date());
          }
        }}
        className={cn(
          "min-w-[160px] text-center text-sm font-medium capitalize",
          onLabelClick || !isToday
            ? "cursor-pointer text-muted-foreground hover:text-foreground"
            : "text-primary",
        )}
      >
        {isToday ? "Bugun" : formatter(date)}
      </button>
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        disabled={isAtMax}
        onClick={() => shift(1)}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
};

export default DateNav;
