import React from "react";
import { useLocation } from "react-router";
import FeatureModuleShell from "@/modules/user/layout/feature-module-shell.jsx";
import { WORKOUT_NAV_ITEMS } from "./workout-nav-items.js";

const PRIMARY_TAB_PATHS = [
  "/user/workout/home",
  "/user/workout/plans",
  "/user/workout/running",
  "/user/workout/exercises",
  "/user/workout/report",
];

const WorkoutShell = () => {
  const { pathname } = useLocation();
  const shouldHideTabs = !PRIMARY_TAB_PATHS.includes(pathname);

  return (
    <FeatureModuleShell
      items={WORKOUT_NAV_ITEMS}
      hideMobileNav={shouldHideTabs}
      hideDesktopNav={shouldHideTabs}
    />
  );
};

export default WorkoutShell;
