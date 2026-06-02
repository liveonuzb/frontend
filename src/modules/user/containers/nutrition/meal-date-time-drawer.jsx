import React, { useEffect, useMemo } from "react";
import {
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer.jsx";
import { Button } from "@/components/ui/button.jsx";
import { ScrollPicker } from "@/components/ui/scroll-picker.jsx";
import { NutritionDrawerContent } from "./nutrition-drawer-layout.jsx";
import {
  clampMealDateKey,
  getCameraDateOptions,
} from "./meal-date-time-utils.js";

import map from "lodash/map";
import toNumber from "lodash/toNumber";

export default function MealDateTimeDrawer({
  open,
  onOpenChange,
  value,
  onChange,
  onDone,
  locale = "uz-latn",
  minDateKey,
}) {
  const safeDateKey = clampMealDateKey(value?.dateKey, minDateKey);
  const currentValue = {
    dateKey: safeDateKey,
    hour: value?.hour || 12,
    minute: value?.minute || 0,
    period: value?.period || "PM",
  };
  const dateOptions = useMemo(
    () => getCameraDateOptions(minDateKey, locale),
    [locale, minDateKey],
  );
  const datePickerItems = useMemo(
    () =>
      map(dateOptions, (option) => ({
        value: option.dateKey,
        label: option.label,
      })),
    [dateOptions],
  );
  const hours = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => {
        const hour = index + 1;
        return {
          value: String(hour).padStart(2, "0"),
          label: String(hour).padStart(2, "0"),
        };
      }),
    [],
  );
  const minutes = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => {
        const minute = index * 5;
        return {
          value: String(minute).padStart(2, "0"),
          label: String(minute).padStart(2, "0"),
        };
      }),
    [],
  );
  const periods = useMemo(
    () => [
      { value: "AM", label: "AM" },
      { value: "PM", label: "PM" },
    ],
    [],
  );

  useEffect(() => {
    if (!open || !value || value.dateKey === safeDateKey) return;
    onChange({ ...value, dateKey: safeDateKey });
  }, [onChange, open, safeDateKey, value]);

  const handleDateChange = (dateKeyValue) => {
    onChange({
      ...currentValue,
      dateKey: clampMealDateKey(dateKeyValue, minDateKey),
    });
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <NutritionDrawerContent size="sm">
        <DrawerHeader className="pb-1 text-center">
          <DrawerTitle className="text-lg font-black tracking-tight">
            Ovqat sanasi va vaqti
          </DrawerTitle>
        </DrawerHeader>

        <DrawerBody className="px-4 pb-3" data-vaul-no-drag>
          <div className="relative grid grid-cols-[1.45fr_0.62fr_0.62fr_0.62fr] items-center gap-1.5 py-3">
            <div className="pointer-events-none absolute inset-x-0 top-1/2 h-12 -translate-y-1/2 rounded-3xl bg-muted/80" />

            <div className="relative min-w-0">
              <ScrollPicker
                items={datePickerItems}
                value={currentValue.dateKey}
                onChange={handleDateChange}
                itemHeight={48}
                selectedClassName="text-[22px] font-black text-foreground"
                unselectedClassName="text-lg font-black text-muted-foreground/35"
              />
            </div>

            <div className="relative min-w-0">
              <ScrollPicker
                items={hours}
                value={String(currentValue.hour).padStart(2, "0")}
                onChange={(hourValue) =>
                  onChange({ ...currentValue, hour: toNumber(hourValue) })
                }
                itemHeight={48}
                selectedClassName="text-[24px] font-black text-foreground"
                unselectedClassName="text-xl font-black text-muted-foreground/35"
              />
            </div>

            <div className="relative min-w-0">
              <ScrollPicker
                items={minutes}
                value={String(currentValue.minute).padStart(2, "0")}
                onChange={(minuteValue) =>
                  onChange({ ...currentValue, minute: toNumber(minuteValue) })
                }
                itemHeight={48}
                selectedClassName="text-[24px] font-black text-foreground"
                unselectedClassName="text-xl font-black text-muted-foreground/35"
              />
            </div>

            <div className="relative min-w-0">
              <ScrollPicker
                items={periods}
                value={currentValue.period}
                onChange={(periodValue) =>
                  onChange({ ...currentValue, period: periodValue })
                }
                itemHeight={48}
                selectedClassName="text-[22px] font-black text-foreground"
                unselectedClassName="text-lg font-black text-muted-foreground/35"
              />
            </div>
          </div>
        </DrawerBody>

        <DrawerFooter>
          <Button
            type="button"
            className="h-14 rounded-full text-base font-black"
            onClick={onDone}
          >
            Tayyor
          </Button>
        </DrawerFooter>
      </NutritionDrawerContent>
    </Drawer>
  );
}
