import {
  DropletIcon,
  FlameIcon,
  BeefIcon,
  WheatIcon,
  CroissantIcon,
  FootprintsIcon,
  MoonIcon,
  PizzaIcon,
} from "lucide-react";

import { toNumber } from "lodash";

/* Query keys reused across pages and drawers. */
export const dailyReportQueryKey = (date) => ["report", "daily", date];
export const rangeReportQueryKey = (days, endDate) => [
  "report",
  "range",
  days,
  endDate ?? "today",
];

/* Visual metadata for each metric — icon + label + unit + display
 * formatter. Keeps the pages small and consistent. */
export const METRIC_META = {
  water: {
    icon: DropletIcon,
    label: "Suv",
    color: "text-sky-500",
    bgColor: "bg-sky-500/10",
    formatActual: (v) =>
      v >= 1000 ? `${(v / 1000).toFixed(1)} L` : `${Math.round(v)} ml`,
    formatGoal: (v) =>
      v >= 1000 ? `${(v / 1000).toFixed(1)} L` : `${Math.round(v)} ml`,
    unit: "ml",
  },
  calories: {
    icon: FlameIcon,
    label: "Kaloriya",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    formatActual: (v) => `${Math.round(v)} kcal`,
    formatGoal: (v) => `${Math.round(v)} kcal`,
    unit: "kcal",
  },
  protein: {
    icon: BeefIcon,
    label: "Oqsil",
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
    formatActual: (v) => `${Math.round(v)} g`,
    formatGoal: (v) => `${Math.round(v)} g`,
    unit: "g",
  },
  carbs: {
    icon: WheatIcon,
    label: "Uglevod",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    formatActual: (v) => `${Math.round(v)} g`,
    formatGoal: (v) => `${Math.round(v)} g`,
    unit: "g",
  },
  fat: {
    icon: CroissantIcon,
    label: "Yog'",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    formatActual: (v) => `${Math.round(v)} g`,
    formatGoal: (v) => `${Math.round(v)} g`,
    unit: "g",
  },
  steps: {
    icon: FootprintsIcon,
    label: "Qadam",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    formatActual: (v) => Math.round(v).toLocaleString("uz-UZ"),
    formatGoal: (v) => Math.round(v).toLocaleString("uz-UZ"),
    unit: "qadam",
  },
  sleep: {
    icon: MoonIcon,
    label: "Uyqu",
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
    formatActual: (v) => `${toNumber(v).toFixed(1)} soat`,
    formatGoal: (v) => `${Math.round(v)} soat`,
    unit: "soat",
  },
  fastFood: {
    icon: PizzaIcon,
    label: "Fast food",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    formatActual: (v) => `${Math.round(v)} marta`,
    formatGoal: () => "",
    unit: "marta",
  },
};

const UZ_DAYS = ["Yak", "Du", "Se", "Ch", "Pa", "Ju", "Sh"];

export const formatShortDay = (dateKey) => {
  const date = new Date(dateKey);
  if (Number.isNaN(date.getTime())) return "";
  return UZ_DAYS[date.getDay()];
};

const UZ_MONTHS = [
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

export const formatLongDate = (dateKey) => {
  const date = new Date(dateKey);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getDate()} ${UZ_MONTHS[date.getMonth()]}, ${date.getFullYear()}`;
};

export const formatRangeLabel = (startDate, endDate) => {
  const a = new Date(startDate);
  const b = new Date(endDate);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return "";
  return `${a.getDate()} ${UZ_MONTHS[a.getMonth()]} – ${b.getDate()} ${UZ_MONTHS[b.getMonth()]}, ${b.getFullYear()}`;
};

/** Yesterday in YYYY-MM-DD (local time). */
export const getYesterdayKey = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(0, 0, 0, 0);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
