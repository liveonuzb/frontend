import compact from "lodash/compact";
import {
  LayoutDashboardIcon,
  MedalIcon,
  UtensilsIcon,
  RulerIcon,
  DumbbellIcon,
  TrophyIcon,
  UserPlusIcon,
} from "lucide-react";
import {
  USER_CHALLENGES_ENABLED,
  USER_LEADERBOARD_ENABLED,
} from "@/modules/user/user-feature-flags.js";

export const getUserTrackingNavItems = () =>
  compact([
    {
      to: "/user/dashboard",
      label: "Dashboard",
      icon: LayoutDashboardIcon,
    },
    {
      to: "/user/nutrition/overview",
      label: "Ovqatlanish",
      icon: UtensilsIcon,
    },
    {
      to: "/user/workout/overview",
      label: "Mashg'ulotlar",
      icon: DumbbellIcon,
    },
    {
      to: "/user/measurements",
      label: "O'lchamlar",
      icon: RulerIcon,
    },
    USER_CHALLENGES_ENABLED
      ? {
          to: "/user/challenges",
          label: "Musobaqalar",
          icon: TrophyIcon,
        }
      : null,
    USER_LEADERBOARD_ENABLED
      ? {
          to: "/user/leaderboard",
          label: "Reyting",
          icon: MedalIcon,
        }
      : null,
    {
      to: "/user/friends",
      label: "Do'stlar",
      icon: UserPlusIcon,
    },
  ]);
