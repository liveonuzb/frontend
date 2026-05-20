import {
  BarChart3Icon,
  ClipboardListIcon,
  DumbbellIcon,
  HistoryIcon,
  HouseIcon,
} from "lucide-react";

export const WORKOUT_NAV_ITEMS = [
  {
    to: "/user/workout/home",
    label: "Home",
    labelKey: "user.workout.nav.home",
    icon: HouseIcon,
    match: (pathname) =>
      pathname === "/user/workout" || pathname.startsWith("/user/workout/home"),
  },
  {
    to: "/user/workout/plans",
    label: "Plans",
    labelKey: "user.workout.nav.plans",
    icon: ClipboardListIcon,
    match: (pathname) => pathname.startsWith("/user/workout/plans"),
  },
  {
    to: "/user/workout/exercises",
    label: "Exercises",
    labelKey: "user.workout.nav.exercises",
    icon: DumbbellIcon,
    match: (pathname) => pathname.startsWith("/user/workout/exercises"),
  },
  {
    to: "/user/workout/history",
    label: "History",
    labelKey: "user.workout.nav.history",
    icon: HistoryIcon,
    match: (pathname) => pathname.startsWith("/user/workout/history"),
  },
  {
    to: "/user/workout/report",
    label: "Report",
    labelKey: "user.workout.nav.report",
    icon: BarChart3Icon,
    match: (pathname) => pathname.startsWith("/user/workout/report"),
  },
];
