import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function humanize(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
}
