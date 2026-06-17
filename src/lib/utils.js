import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import toLower from "lodash/toLower";
import toUpper from "lodash/toUpper";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function humanize(str) {
  if (!str) return "";
  return toLower(str)
    .replace(/[_-]/g, " ")
    .replace(/(^\w|\s\w)/g, (m) => toUpper(m));
}
