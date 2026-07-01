import { FootprintsIcon, MoonIcon } from "lucide-react";
import { clamp, round, toNumber } from "lodash";

export const toFiniteNumber = (value) => {
  const numericValue = toNumber(value);

  return Number.isFinite(numericValue) ? numericValue : 0;
};

export const METRICS = {
  steps: {
    title: "Qadamlar",
    subtitle: "Kunlik yurish ritmi va maqsad progressi",
    Icon: FootprintsIcon,
    valueLabel: "Bugungi qadamlar",
    goalLabel: "Kunlik qadam maqsadi",
    inputStep: 1,
    valueKey: "steps",
    goalKey: "steps",
    trendKey: "steps",
    chartKey: "steps",
    bestLabel: "Eng yaxshi kun",
    savedMessage: "Qadamlar saqlandi",
    quickActions: [
      { label: "+500", value: 500, mode: "add" },
      { label: "+1,000", value: 1000, mode: "add" },
      { label: "+2,000", value: 2000, mode: "add" },
      { label: "Goal", mode: "goal" },
    ],
    normalizeValue: (value) => Math.max(0, Math.round(toFiniteNumber(value))),
    formatValue: (value) =>
      Math.round(toFiniteNumber(value)).toLocaleString("en-US"),
    formatGoal: (value) =>
      `${Math.round(toFiniteNumber(value)).toLocaleString("en-US")} qadam`,
  },
  sleep: {
    title: "Uyqu",
    subtitle: "Uyqu davomiyligi va haftalik barqarorlik",
    Icon: MoonIcon,
    valueLabel: "Bugungi uyqu",
    goalLabel: "Uyqu maqsadi",
    inputStep: 0.25,
    valueKey: "sleepHours",
    goalKey: "sleepHours",
    trendKey: "sleepHours",
    chartKey: "sleepHours",
    bestLabel: "Eng yaxshi tun",
    savedMessage: "Uyqu saqlandi",
    quickActions: [
      { label: "6h", value: 6, mode: "set" },
      { label: "7h", value: 7, mode: "set" },
      { label: "8h", value: 8, mode: "set" },
      { label: "9h", value: 9, mode: "set" },
    ],
    normalizeValue: (value) => clamp(round(toFiniteNumber(value), 2), 0, 16),
    formatValue: (value) => {
      const safeValue = Math.max(0, toFiniteNumber(value));
      const hours = Math.floor(safeValue);
      const minutes = Math.round((safeValue - hours) * 60);

      return minutes > 0 ? `${hours} soat ${minutes} daq` : `${hours} soat`;
    },
    formatGoal: (value) => {
      const safeValue = toFiniteNumber(value);

      return Number.isInteger(safeValue)
        ? `${safeValue} soat`
        : `${safeValue.toFixed(1)} soat`;
    },
  },
};

export const todayKey = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const isDateKey = (value) =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
