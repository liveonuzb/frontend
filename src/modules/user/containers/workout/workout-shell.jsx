import React from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";
import FeatureModuleShell from "@/modules/user/layout/feature-module-shell.jsx";
import { WORKOUT_NAV_ITEMS } from "./workout-nav-items.js";

import { includes, map, get } from "lodash";

const PRIMARY_TAB_PATHS = [
  "/user/workout/home",
  "/user/workout/plans",
  "/user/workout/exercises",
  "/user/workout/history",
  "/user/workout/report",
];

const WorkoutShell = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const shouldHideTabs = !includes(PRIMARY_TAB_PATHS, pathname);
  const navItems = React.useMemo(
    () =>
      map(WORKOUT_NAV_ITEMS, (item) => ({
        ...item,
        label: get(item, "labelKey") ? t(get(item, "labelKey")) : item.label,
      })),
    [t],
  );

  return (
    <FeatureModuleShell
      items={navItems}
      className="workout-module-shell"
      navClassName="workout-subnav"
      navAriaLabel={t(
        "user.workout.nav.ariaLabel",
        "Workout module sections",
      )}
      hideMobileNav={shouldHideTabs}
      hideDesktopNav={shouldHideTabs}
    />
  );
};

export default WorkoutShell;
