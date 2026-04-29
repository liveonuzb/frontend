import {
  BarChart3Icon,
  CompassIcon,
  HouseIcon,
  UserIcon,
} from "lucide-react";

export const CHALLENGE_NAV_ITEMS = [
  {
    to: "/user/challenges/home",
    label: "Bosh sahifa",
    icon: HouseIcon,
    match: (pathname) =>
      pathname === "/user/challenges" ||
      pathname.startsWith("/user/challenges/home"),
  },
  {
    to: "/user/challenges/my",
    label: "Mening",
    icon: UserIcon,
    match: (pathname) => pathname.startsWith("/user/challenges/my"),
  },
  {
    to: "/user/challenges/explore",
    label: "Barcha",
    icon: CompassIcon,
    match: (pathname) => pathname.startsWith("/user/challenges/explore"),
  },
  {
    to: "/user/challenges/report",
    label: "Statistika",
    icon: BarChart3Icon,
    match: (pathname) => pathname.startsWith("/user/challenges/report"),
  },
];
