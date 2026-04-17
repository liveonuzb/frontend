import { has, get } from "lodash";

export const SOURCE_META = {
  manual: {
    label: "Qo'lda",
    tone: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
  },
  text: {
    label: "Matndan",
    tone: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
  },
  audio: {
    label: "Audio",
    tone: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  camera: {
    label: "Kamera",
    tone: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  "meal-plan": {
    label: "Rejadan",
    tone: "bg-primary/10 text-primary",
  },
};

export const getNutritionSourceMeta = (source, fallback = "manual") => {
  const resolvedKey = has(SOURCE_META, source)
    ? source
    : has(SOURCE_META, fallback)
      ? fallback
      : "manual";

  return {
    key: resolvedKey,
    ...get(SOURCE_META, resolvedKey),
  };
};
