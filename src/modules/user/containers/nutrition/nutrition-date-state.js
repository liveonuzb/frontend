import React from "react";

import { map, split, toNumber } from "lodash";

export const WEEK_DAYS = [
  "Dushanba",
  "Seshanba",
  "Chorshanba",
  "Payshanba",
  "Juma",
  "Shanba",
  "Yakshanba",
];

const ISO_DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

const DATE_SHORTCUTS = [
  { id: "yesterday", label: "Kecha", offset: -1 },
  { id: "today", label: "Bugun", offset: 0 },
  { id: "tomorrow", label: "Ertaga", offset: 1 },
];

const padDatePart = (value) => String(value).padStart(2, "0");

const shiftDate = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

export const getDateKey = (date) => {
  const value = date instanceof Date ? date : new Date(date);

  return [
    value.getFullYear(),
    padDatePart(value.getMonth() + 1),
    padDatePart(value.getDate()),
  ].join("-");
};

export const isValidDateKey = (value) => {
  const dateKey = String(value || "");
  if (!ISO_DATE_KEY_RE.test(dateKey)) {
    return false;
  }

  const [year, month, day] = map(split(dateKey, "-"), toNumber);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
};

export const getDateQueryKey = (search) => {
  const value = new URLSearchParams(search || "").get("date");
  return isValidDateKey(value) ? value : null;
};

export const getSelectedDateLabel = (date) =>
  date.toLocaleDateString("uz-UZ", {
    day: "numeric",
    month: "short",
  });

export const getSelectedDay = (date) => WEEK_DAYS[(date.getDay() + 6) % 7];

export const getYesterdayKey = (date) => {
  return getDateKey(shiftDate(date, -1));
};

export const getTomorrowKey = (date) => getDateKey(shiftDate(date, 1));

export const getTodayDate = (todayKey) => new Date(`${todayKey}T12:00:00`);

export const getRelativeDateShortcuts = (selectedDate, todayKey) => {
  const todayDate = getTodayDate(todayKey);
  const selectedDateKey = getDateKey(selectedDate);

  return map(DATE_SHORTCUTS, (shortcut) => {
    const date = shiftDate(todayDate, shortcut.offset);
    const dateKey = getDateKey(date);

    return {
      id: shortcut.id,
      label: shortcut.label,
      date,
      dateKey,
      active: dateKey === selectedDateKey,
    };
  });
};

export const useNutritionDateState = ({ location, navigate, todayKey }) => {
  const [date, setDate] = React.useState(new Date());
  const dateKey = getDateKey(date);
  const todayDate = React.useMemo(() => getTodayDate(todayKey), [todayKey]);
  const selectedDateLabel = React.useMemo(
    () => getSelectedDateLabel(date),
    [date],
  );
  const isPastDate = dateKey < todayKey;
  const dateQueryKey = React.useMemo(
    () => getDateQueryKey(location.search),
    [location.search],
  );

  React.useEffect(() => {
    if (!dateQueryKey || dateQueryKey === dateKey) {
      return undefined;
    }

    let isCurrent = true;

    queueMicrotask(() => {
      if (isCurrent) {
        setDate(new Date(`${dateQueryKey}T12:00:00`));
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [dateKey, dateQueryKey]);

  const handleOverviewDateChange = React.useCallback(
    (nextDate) => {
      if (!nextDate) {
        return;
      }

      const nextKey = getDateKey(nextDate);
      setDate(nextDate);

      if (location.pathname.startsWith("/user/nutrition/overview")) {
        const params = new URLSearchParams(location.search);
        params.set("date", nextKey);
        navigate(`${location.pathname}?${params.toString()}`, {
          replace: true,
        });
      }
    },
    [location.pathname, location.search, navigate],
  );

  const selectedDay = React.useMemo(() => getSelectedDay(date), [date]);
  const yesterdayKey = React.useMemo(() => getYesterdayKey(date), [date]);
  const dateShortcuts = React.useMemo(
    () => getRelativeDateShortcuts(date, todayKey),
    [date, todayKey],
  );
  const handleDateShortcutChange = React.useCallback(
    (shortcut) => {
      if (!shortcut?.date) {
        return;
      }

      handleOverviewDateChange(shortcut.date);
    },
    [handleOverviewDateChange],
  );

  return {
    date,
    setDate,
    dateKey,
    todayDate,
    selectedDateLabel,
    isPastDate,
    selectedDay,
    yesterdayKey,
    dateShortcuts,
    handleDateShortcutChange,
    handleOverviewDateChange,
  };
};
