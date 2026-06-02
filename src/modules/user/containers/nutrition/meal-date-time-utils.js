import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import "dayjs/locale/ru";
import "dayjs/locale/uz-latn";

dayjs.extend(localizedFormat);

export const resolveDayjsLocale = (language) => {
  if (String(language || "").startsWith("ru")) return "ru";
  if (String(language || "").startsWith("uz")) return "uz-latn";
  return "uz-latn";
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

const getRelativeDateLabel = (dateKey, locale = "uz-latn") => {
  if (!dateKey) {
    return locale === "ru" ? "Сегодня" : locale === "en" ? "Today" : "Bugun";
  }
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

export const getCameraDateOptions = (minDateKey, locale = "uz-latn") => {
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

export const formatMealTime = ({ dateKey, hour, minute, period }, locale = "uz-latn") => {
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
