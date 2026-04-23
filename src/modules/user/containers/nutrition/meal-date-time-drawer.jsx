import React, { useEffect, useMemo } from "react";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import "dayjs/locale/ru";
import "dayjs/locale/uz-latn";
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

dayjs.extend(localizedFormat);

export const resolveDayjsLocale = (language) => {
  if (String(language || "").startsWith("ru")) return "ru";
  if (String(language || "").startsWith("uz")) return "uz-latn";
  return "en";
};

export const getDateKey = (date) => dayjs(date).format("YYYY-MM-DD");

const isValidDateKey = (dateKey) =>
  /^\d{4}-\d{2}-\d{2}$/.test(String(dateKey || "")) &&
  dayjs(dateKey).format("YYYY-MM-DD") === dateKey;

export const getMealDateStartKey = (user, fallbackDateKey) => {
  const rawDate =
    user?.createdAt ||
    user?.joinedAt ||
    user?.registeredAt ||
    user?.profile?.createdAt ||
    fallbackDateKey ||
    new Date();
  const parsed = dayjs(rawDate);

  return parsed.isValid() ? parsed.format("YYYY-MM-DD") : getDateKey(new Date());
};

export const clampMealDateKey = (dateKey, minDateKey) => {
  const today = dayjs().startOf("day");
  const minDate = dayjs(minDateKey || today).isValid()
    ? dayjs(minDateKey || today).startOf("day")
    : today;
  const startDate = minDate.isAfter(today) ? today : minDate;
  const selectedDate = isValidDateKey(dateKey)
    ? dayjs(dateKey).startOf("day")
    : today;

  if (selectedDate.isAfter(today)) return today.format("YYYY-MM-DD");
  if (selectedDate.isBefore(startDate)) return startDate.format("YYYY-MM-DD");

  return selectedDate.format("YYYY-MM-DD");
};

const getRelativeDateLabel = (dateKey, locale = "en") => {
  if (!dateKey) return "Today";
  const day = dayjs(dateKey).locale(locale);
  const today = dayjs().locale(locale);

  if (day.isSame(today, "day")) {
    return locale === "ru" ? "Сегодня" : locale === "uz-latn" ? "Bugun" : "Today";
  }

  if (day.isSame(today.subtract(1, "day"), "day")) {
    return locale === "ru" ? "Вчера" : locale === "uz-latn" ? "Kecha" : "Yesterday";
  }

  return day.format("ddd, MMM D");
};

const getCameraDateOptions = (minDateKey, locale = "en") => {
  const today = dayjs().startOf("day");
  const parsedStart = dayjs(minDateKey || today);
  const start = parsedStart.isValid()
    ? parsedStart.startOf("day")
    : today;
  const startDate = start.isAfter(today) ? today : start;
  const daysCount = today.diff(startDate, "day") + 1;

  return Array.from({ length: Math.max(daysCount, 1) }, (_, index) => {
    const dateKey = startDate.add(index, "day").format("YYYY-MM-DD");

    return {
      dateKey,
      label: getRelativeDateLabel(dateKey, locale),
    };
  });
};

export const getTimePartsFromDate = (value = new Date()) => {
  const date = dayjs(value);
  const fallback = dayjs();
  const hour24 = date.isValid() ? date.hour() : fallback.hour();
  const minute = date.isValid() ? date.minute() : fallback.minute();
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;

  return {
    hour: hour12,
    minute: Math.round(minute / 5) * 5 % 60,
    period,
  };
};

export const formatMealTime = ({ dateKey, hour, minute, period }, locale = "en") => {
  const formattedMinute = String(minute).padStart(2, "0");
  return `${getRelativeDateLabel(dateKey, locale)}, ${hour}:${formattedMinute} ${period}`;
};

export const toMealDateTimeIso = ({ dateKey, hour, minute, period }) => {
  const safeDateKey = dateKey || getDateKey(new Date());
  const hour24 =
    period === "PM" ? (hour % 12) + 12 : hour === 12 ? 0 : hour;

  return dayjs(
    `${safeDateKey}T${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`,
  ).toISOString();
};

export default function MealDateTimeDrawer({
  open,
  onOpenChange,
  value,
  onChange,
  onDone,
  locale = "en",
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
      dateOptions.map((option) => ({
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
            Meal date & time
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
                  onChange({ ...currentValue, hour: Number(hourValue) })
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
                  onChange({ ...currentValue, minute: Number(minuteValue) })
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
            Done
          </Button>
        </DrawerFooter>
      </NutritionDrawerContent>
    </Drawer>
  );
}
