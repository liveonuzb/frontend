import { DumbbellIcon } from "lucide-react";
import { ChartCircle, Chart1, ClipboardText, Clock } from "iconsax-reactjs";

export const WORKOUT_NAV_ITEMS = [
  {
    to: "/user/workout/overview",
    label: "Overview",
    labelKey: "user.workout.nav.home",
    icon: ChartCircle,
    match: (pathname) =>
      pathname === "/user/workout" ||
      pathname.startsWith("/user/workout/home") ||
      pathname.startsWith("/user/workout/overview"),
  },
  {
    to: "/user/workout/plans",
    label: "Plans",
    labelKey: "user.workout.nav.plans",
    icon: ClipboardText,
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
    icon: Clock,
    match: (pathname) => pathname.startsWith("/user/workout/history"),
  },
  {
    to: "/user/workout/report",
    label: "Report",
    labelKey: "user.workout.nav.report",
    icon: Chart1,
    match: (pathname) => pathname.startsWith("/user/workout/report"),
  },
];
