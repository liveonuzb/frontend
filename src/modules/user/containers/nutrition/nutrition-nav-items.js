import {
  BarChart3Icon,
  ClipboardListIcon,
  HistoryIcon,
  HouseIcon,
  SoupIcon,
} from "lucide-react";

export const NUTRITION_NAV_ITEMS = [
  {
    to: "/user/nutrition/home",
    label: "Home",
    icon: HouseIcon,
    match: (pathname) =>
      pathname === "/user/nutrition" || pathname.startsWith("/user/nutrition/home"),
  },
  {
    to: "/user/nutrition/plans",
    label: "Plans",
    icon: ClipboardListIcon,
    match: (pathname) => pathname.startsWith("/user/nutrition/plans"),
  },
  {
    to: "/user/nutrition/meals",
    label: "Meals",
    icon: SoupIcon,
    match: (pathname) => pathname.startsWith("/user/nutrition/meals"),
  },
  {
    to: "/user/nutrition/history",
    label: "History",
    icon: HistoryIcon,
    match: (pathname) => pathname.startsWith("/user/nutrition/history"),
  },
  {
    to: "/user/nutrition/report",
    label: "Report",
    icon: BarChart3Icon,
    match: (pathname) => pathname.startsWith("/user/nutrition/report"),
  },
];
