import { find } from "lodash";

export const MOOD_OPTIONS = [
  { emoji: "😴", label: "Juda yomon", value: "bad" },
  { emoji: "😴", label: "Charchagan", value: "tired" },
  { emoji: "😐", label: "Oddiy", value: "neutral" },
  { emoji: "🙂", label: "Yaxshi", value: "good" },
  { emoji: "🔥", label: "Super!", value: "amazing" },
];

export const getMoodMeta = (value) =>
  find(MOOD_OPTIONS, (option) => option.value === value) ?? null;
