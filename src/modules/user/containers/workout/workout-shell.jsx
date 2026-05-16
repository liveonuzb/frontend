import React from "react";
import { useLocation } from "react-router";
import FeatureModuleShell from "@/modules/user/layout/feature-module-shell.jsx";
import { WORKOUT_NAV_ITEMS } from "./workout-nav-items.js";

const PRIMARY_TAB_PATHS = [
  "/user/workout/home",
  "/user/workout/plans",
  "/user/workout/running",
  "/user/workout/running/history",
  "/user/workout/exercises",
  "/user/workout/report",
  "/user/workout/history",
];

const WorkoutShell = () => {
  const { pathname } = useLocation();
  const shouldHideTabs = !PRIMARY_TAB_PATHS.includes(pathname);
  const navItems = React.useMemo(
    () =>
      pathname.startsWith("/user/workout/running")
        ? WORKOUT_NAV_ITEMS.filter(
            (item) => item.to !== "/user/workout/report",
          )
        : WORKOUT_NAV_ITEMS,
    [pathname],
  );

  return (
    <FeatureModuleShell
      items={navItems}
      hideMobileNav={shouldHideTabs}
      hideDesktopNav={shouldHideTabs}
    />
  );
};

export default WorkoutShell;
