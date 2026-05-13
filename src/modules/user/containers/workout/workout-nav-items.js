import {
  BarChart3Icon,
  ClipboardListIcon,
  DumbbellIcon,
  HouseIcon,
  RouteIcon,
} from "lucide-react";
import { config } from "@/config.js";

const WORKOUT_NAV_ITEMS_BASE = [
  {
    to: "/user/workout/home",
    label: "Home",
    icon: HouseIcon,
    match: (pathname) =>
      pathname === "/user/workout" || pathname.startsWith("/user/workout/home"),
  },
  {
    to: "/user/workout/plans",
    label: "Plans",
    icon: ClipboardListIcon,
    match: (pathname) => pathname.startsWith("/user/workout/plans"),
  },
  {
    to: "/user/workout/running",
    label: "Running",
    icon: RouteIcon,
    feature: "running",
    match: (pathname) => pathname.startsWith("/user/workout/running"),
  },
  {
    to: "/user/workout/exercises",
    label: "Exercises",
    icon: DumbbellIcon,
    match: (pathname) => pathname.startsWith("/user/workout/exercises"),
  },
  {
    to: "/user/workout/report",
    label: "Report",
    icon: BarChart3Icon,
    match: (pathname) =>
      pathname.startsWith("/user/workout/report") ||
      pathname.startsWith("/user/workout/history"),
  },
];

export const WORKOUT_NAV_ITEMS = WORKOUT_NAV_ITEMS_BASE.filter(
  (item) => item.feature !== "running" || config.runningFeatureEnabled,
);
