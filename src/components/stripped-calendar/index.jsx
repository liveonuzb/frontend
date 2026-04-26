import React from "react";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Yak"];
const MONTH_LABELS = [
  "Yan",
  "Fev",
  "Mar",
  "Apr",
  "May",
  "Iyn",
  "Iyl",
  "Avg",
  "Sen",
  "Okt",
  "Noy",
  "Dek",
];

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/**
 * Horizontal weekday strip — replaces the old DateNav.
 *
 * Scrollable horizontal calendar. Tap a day → onChange(day).
 * Tapping the already-selected day fires onLabelClick(day) (used by the
 *   dashboard to open the daily detail page).
 * Auto-scrolls the selected day into view (only when it isn't already
 *   visible — keeps manual horizontal scrolls feeling natural).
 *
 * Range: `daysBack` days before today up to maxDate (defaults to 60 days
 * back, today). If `date` is older than that range, the range is extended
 * to keep it visible.
 */
const StrippedCalendar = ({
  date,
  onChange,
  maxDate,
  className,
  onLabelClick,
  daysBack = 60,
}) => {
  const max = startOfDay(maxDate ?? new Date());
  const today = startOfDay(new Date());
  const containerRef = React.useRef(null);
  const selectedRef = React.useRef(null);
  const hasInitialScrolledRef = React.useRef(false);

  // React Compiler memoizes this automatically — no manual useMemo needed.
  const buildDays = () => {
    const earliest = new Date(today);
    earliest.setDate(earliest.getDate() - daysBack);

    const selectedDay = startOfDay(date);
    if (selectedDay < earliest) {
      earliest.setTime(selectedDay.getTime());
      earliest.setDate(earliest.getDate() - 7);
    }

    const arr = [];
    const cursor = new Date(earliest);
    while (cursor <= max) {
      arr.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return arr;
  };
  const days = buildDays();

  // Center the selected day on first paint, then on later changes only when
  // it has scrolled out of view (so manual horizontal scrolling stays sticky).
  React.useLayoutEffect(() => {
    const container = containerRef.current;
    const selected = selectedRef.current;
    if (!container || !selected) return;

    const containerRect = container.getBoundingClientRect();
    const selectedRect = selected.getBoundingClientRect();
    const isInView =
      selectedRect.left >= containerRect.left &&
      selectedRect.right <= containerRect.right;

    if (hasInitialScrolledRef.current && isInView) return;

    const offset =
      selectedRect.left -
      containerRect.left -
      containerRect.width / 2 +
      selectedRect.width / 2;

    container.scrollBy({
      left: offset,
      behavior: hasInitialScrolledRef.current ? "smooth" : "auto",
    });
    hasInitialScrolledRef.current = true;
  }, [date]);

  const handleDayClick = (day) => {
    if (day > max) return;
    if (sameDay(day, date)) {
      if (onLabelClick) onLabelClick(day);
      return;
    }
    onChange(day);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex items-stretch gap-1.5 overflow-x-auto py-1",
        "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {days.map((day) => {
        const isSelected = sameDay(day, date);
        const isToday = sameDay(day, today);
        const isFirstOfMonth = day.getDate() === 1;
        const weekdayIdx = (day.getDay() + 6) % 7; // Mon = 0

        return (
          <button
            key={day.getTime()}
            ref={isSelected ? selectedRef : null}
            type="button"
            onClick={() => handleDayClick(day)}
            className={cn(
              "group relative flex min-w-[48px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl px-2.5 py-2 text-center transition-all",
              isSelected
                ? "bg-primary text-primary-foreground shadow-md"
                : isToday
                  ? "border border-primary/35 text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
            aria-pressed={isSelected}
            aria-current={isToday ? "date" : undefined}
          >
            <span
              className={cn(
                "text-[10px] font-semibold uppercase tracking-wide",
                isSelected ? "opacity-90" : "opacity-70",
              )}
            >
              {WEEKDAY_LABELS[weekdayIdx]}
            </span>
            <span
              className={cn(
                "text-base font-bold leading-none tabular-nums",
                isToday && !isSelected && "text-primary",
              )}
            >
              {day.getDate()}
            </span>
            {isFirstOfMonth ? (
              <span
                className={cn(
                  "text-[9px] font-semibold uppercase tracking-wide",
                  isSelected ? "opacity-90" : "text-muted-foreground/70",
                )}
              >
                {MONTH_LABELS[day.getMonth()]}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
};

export default StrippedCalendar;
