import { find } from "lodash";
export const DEFAULT_CATEGORY_BADGE_CLASS =
  "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700";

export const CUSTOM_CATEGORY_BADGE_PREFIX = "custom:";

export const CATEGORY_BADGE_PRESETS = [
  {
    value:
      "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800",
    label: "Siyohrang",
    swatch: "#6d4ce8",
  },
  {
    value:
      "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
    label: "Indigo",
    swatch: "#4b67e9",
  },
  {
    value:
      "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800",
    label: "Ko'k",
    swatch: "#1d8cf8",
  },
  {
    value:
      "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-800",
    label: "Teal",
    swatch: "#1ca59b",
  },
  {
    value:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    label: "Yashil",
    swatch: "#38a169",
  },
  {
    value:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    label: "Sariq",
    swatch: "#f4c542",
  },
  {
    value:
      "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800",
    label: "To'q sariq",
    swatch: "#ff7a00",
  },
  {
    value:
      "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
    label: "Qizil",
    swatch: "#ef5350",
  },
  {
    value:
      "bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-200 dark:border-pink-800",
    label: "Pushti",
    swatch: "#e63f8b",
  },
  {
    value:
      "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-400 border-fuchsia-200 dark:border-fuchsia-800",
    label: "Magenta",
    swatch: "#b14cc7",
  },
  {
    value:
      "bg-stone-500/10 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700",
    label: "Jigarrang",
    swatch: "#a78978",
  },
  {
    value: DEFAULT_CATEGORY_BADGE_CLASS,
    label: "Neytral",
    swatch: "#9b9b9b",
  },
];

const normalizeHex = (hex) => {
  const value = String(hex ?? "").trim();
  if (!value) {
    return "#64748b";
  }

  if (value.startsWith("#")) {
    if (value.length === 4) {
      return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
    }
    return value;
  }

  return `#${value}`;
};

const hexToRgb = (hex) => {
  const normalized = normalizeHex(hex).replace("#", "");
  const parsed = Number.parseInt(normalized, 16);

  if (Number.isNaN(parsed)) {
    return { r: 100, g: 116, b: 139 };
  }

  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255,
  };
};

const toRgba = (hex, alpha) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const isCustomCategoryBadgeColor = (value) =>
  typeof value === "string" && value.startsWith(CUSTOM_CATEGORY_BADGE_PREFIX);

export const createCustomCategoryBadgeColor = (hex) =>
  `${CUSTOM_CATEGORY_BADGE_PREFIX}${normalizeHex(hex)}`;

export const getCustomCategoryBadgeHex = (value) =>
  isCustomCategoryBadgeColor(value)
    ? normalizeHex(value.slice(CUSTOM_CATEGORY_BADGE_PREFIX.length))
    : "#64748b";

export const getCategoryBadgeAppearance = (value) => {
  if (isCustomCategoryBadgeColor(value)) {
    const hex = getCustomCategoryBadgeHex(value);

    return {
      className: "border-transparent",
      style: {
        backgroundColor: toRgba(hex, 0.14),
        color: hex,
      },
      swatchStyle: {
        backgroundColor: hex,
      },
      label: "Custom",
    };
  }

  const preset =
    find(CATEGORY_BADGE_PRESETS, (item) => item.value === value) ||
    find(CATEGORY_BADGE_PRESETS, (item) => item.value === DEFAULT_CATEGORY_BADGE_CLASS);

  return {
    className: preset?.value ?? DEFAULT_CATEGORY_BADGE_CLASS,
    style: undefined,
    swatchStyle: {
      backgroundColor: preset?.swatch ?? "#64748b",
    },
    label: preset?.label ?? "Preset",
  };
};
