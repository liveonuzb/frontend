import {
  BarChart3Icon,
  BookOpenIcon,
  ClipboardListIcon,
  HistoryIcon,
  HouseIcon,
} from "lucide-react";

export const NUTRITION_NAV_ITEMS = [
  {
    to: "/user/nutrition/overview",
    label: "Umumiy",
    labelKey: "user.nutrition.nav.overview",
    icon: HouseIcon,
    match: (pathname) =>
      pathname === "/user/nutrition" ||
      pathname.startsWith("/user/nutrition/overview"),
  },
  {
    to: "/user/nutrition/plans",
    label: "Rejalar",
    labelKey: "user.nutrition.nav.plans",
    icon: ClipboardListIcon,
    match: (pathname) => pathname.startsWith("/user/nutrition/plans"),
  },
  {
    to: "/user/nutrition/recipes",
    label: "Retseptlar",
    labelKey: "user.nutrition.nav.recipes",
    icon: BookOpenIcon,
    match: (pathname) => pathname.startsWith("/user/nutrition/recipes"),
  },
  {
    to: "/user/nutrition/history",
    label: "Tarix",
    labelKey: "user.nutrition.nav.history",
    icon: HistoryIcon,
    match: (pathname) => pathname.startsWith("/user/nutrition/history"),
  },
  {
    to: "/user/nutrition/report",
    label: "Hisobot",
    labelKey: "user.nutrition.nav.report",
    icon: BarChart3Icon,
    match: (pathname) => pathname.startsWith("/user/nutrition/report"),
  },
];
