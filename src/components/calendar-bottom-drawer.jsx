import React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

const startOfDay = (date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const clampToRange = (date, minDate, maxDate) => {
  const next = startOfDay(date);

  if (minDate && next < minDate) return minDate;
  if (maxDate && next > maxDate) return maxDate;

  return next;
};

export default function CalendarBottomDrawer({
  open,
  onOpenChange,
  date,
  onChange,
  title = "Sana tanlang",
  description = "Ma'lumotlarni tanlangan kunga moslab ko'ring.",
  minDate,
  maxDate,
  closeOnSelect = true,
  className,
  calendarClassName,
}) {
  const selectedDate = React.useMemo(
    () => startOfDay(date ?? new Date()),
    [date],
  );
  const min = React.useMemo(
    () => (minDate ? startOfDay(minDate) : undefined),
    [minDate],
  );
  const max = React.useMemo(
    () => (maxDate ? startOfDay(maxDate) : undefined),
    [maxDate],
  );
  const today = React.useMemo(() => startOfDay(new Date()), []);
  const disabledDays = React.useMemo(() => {
    const rules = [];

    if (min) rules.push({ before: min });
    if (max) rules.push({ after: max });

    return rules.length > 0 ? rules : undefined;
  }, [max, min]);

  const handleSelect = React.useCallback(
    (nextDate) => {
      if (!nextDate) return;

      onChange?.(startOfDay(nextDate));

      if (closeOnSelect) {
        onOpenChange?.(false);
      }
    },
    [closeOnSelect, onChange, onOpenChange],
  );

  const handleTodayClick = React.useCallback(() => {
    onChange?.(clampToRange(today, min, max));
    onOpenChange?.(false);
  }, [max, min, onChange, onOpenChange, today]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent
        data-calendar-bottom-drawer="true"
        className={cn(
          "data-[vaul-drawer-direction=bottom]:!mx-auto data-[vaul-drawer-direction=bottom]:!w-[min(100vw,28rem)] data-[vaul-drawer-direction=bottom]:!max-w-md",
          className,
        )}
      >
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>

        <DrawerBody className="px-4 pb-0">
          <div className="w-full">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleSelect}
              disabled={disabledDays}
              startMonth={min}
              endMonth={max}
              fixedWeeks
              initialFocus
              className={cn(
                "min-h-[25rem] w-full rounded-[1.5rem] bg-muted/30 p-4 [--cell-size:2.75rem] sm:[--cell-size:3rem]",
                calendarClassName,
              )}
              classNames={{
                root: "w-full",
                months: "relative flex w-full flex-col",
                month: "flex min-h-[22rem] w-full flex-col gap-4",
                nav: "absolute right-1 top-0 flex h-(--cell-size) items-center justify-end gap-2",
                month_caption:
                  "flex h-(--cell-size) w-full items-center justify-start pl-1 pr-28",
                caption_label: "select-none text-lg font-bold text-foreground",
                chevron: "size-5",
                month_grid: "w-full flex-1 border-collapse",
                weekdays: "flex w-full gap-1",
                weekday:
                  "flex-1 rounded-(--cell-radius) text-xs font-medium text-muted-foreground select-none",
                weeks: "flex flex-1 flex-col justify-between",
                week: "flex w-full gap-1",
                today:
                  "relative text-foreground after:absolute after:bottom-1.5 after:left-1/2 after:z-20 after:size-1.5 after:-translate-x-1/2 after:rounded-full after:bg-primary after:content-['']",
                day_button:
                  "text-lg font-semibold data-[selected-single=true]:border data-[selected-single=true]:border-primary data-[selected-single=true]:bg-transparent data-[selected-single=true]:text-foreground data-[selected-single=true]:shadow-none",
              }}
            />
          </div>
        </DrawerBody>

        <DrawerFooter>
          <Button type="button" variant="outline" onClick={handleTodayClick}>
            Bugun
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
