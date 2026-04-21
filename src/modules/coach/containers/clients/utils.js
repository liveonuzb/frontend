import {
  get,
  join,
  map,
  split,
  toUpper,
} from "lodash";
import { Call } from "iconsax-reactjs";

export const CLIENT_SORT_FIELDS = [
  "name",
  "goal",
  "currentWeight",
  "progress",
  "lastActivityDate",
  "status",
];

export const CLIENT_SORT_DIRECTIONS = ["asc", "desc"];

export const getInviteMethodOptions = (t) => [
  {
    value: "phone",
    label: t("coach.clients.inviteSteps.method.phone.label"),
    description: t("coach.clients.inviteSteps.method.phone.description"),
    icon: Call,
    placeholder: t("coach.clients.inviteSteps.method.phone.placeholder"),
  },
];

export const getWeekdayOptions = (t) => [
  { value: "monday", label: t("common.weekdays.monday") },
  { value: "tuesday", label: t("common.weekdays.tuesday") },
  { value: "wednesday", label: t("common.weekdays.wednesday") },
  { value: "thursday", label: t("common.weekdays.thursday") },
  { value: "friday", label: t("common.weekdays.friday") },
  { value: "saturday", label: t("common.weekdays.saturday") },
  { value: "sunday", label: t("common.weekdays.sunday") },
];

export const getPaymentDayOptions = () => Array.from({ length: 31 }, (_, index) => ({
  value: String(index + 1),
  label: String(index + 1),
}));

export const getStatusConfig = (t) => ({
  active: { label: t("common.status.active"), className: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800" },
  paused: { label: t("common.status.paused"), className: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800" },
  inactive: { label: t("common.status.inactive"), className: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700" },
  pending: { label: t("common.status.pending"), className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800" },
  declined: { label: t("common.status.declined"), className: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800" },
});

export const getInitials = (name) => {
  const initials = join(
    map(split(get({ v: name }, "v", ""), " "), (part) => get(part, "[0]", "")),
    "",
  );
  return toUpper(initials);
};

export const formatDate = (value, locale = "uz-UZ") =>
  value ? new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value)) : "—";

export const formatPaymentDay = (value, t) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const day = date.getDate();
  return t("coach.clients.cells.payment.dayFormat", { day, defaultValue: `${day}-kun` });
};

export const formatLongDate = (value, locale = "uz-UZ") =>
  value ? new Intl.DateTimeFormat(locale, { day: "2-digit", month: "long", year: "numeric" }).format(new Date(value)) : "—";

export const formatMoney = (value, t, locale = "uz-UZ") => {
  const normalized = Number(value);
  if (!Number.isFinite(normalized) || normalized < 0) return "—";
  return `${new Intl.NumberFormat(locale).format(normalized)} ${t("coach.dashboard.revenue.currency", { defaultValue: "so'm" })}`;
};


export const normalizeProgress = (value) => {
  const nextValue = Number(get({ v: value }, "v", 0));
  return Number.isFinite(nextValue) ? Math.max(0, Math.min(100, nextValue)) : 0;
};
