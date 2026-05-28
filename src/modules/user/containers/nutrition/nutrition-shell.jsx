import React from "react";
import { useLocation } from "react-router";
import FeatureModuleShell from "@/modules/user/layout/feature-module-shell.jsx";
import { NUTRITION_NAV_ITEMS } from "./nutrition-nav-items.js";

import { includes } from "lodash";

const PRIMARY_TAB_PATHS = [
  "/user/nutrition/overview",
  "/user/nutrition/plans",
  "/user/nutrition/history",
  "/user/nutrition/report",
];

const NutritionShell = () => {
  const { pathname } = useLocation();
  const shouldHideTabs = !includes(PRIMARY_TAB_PATHS, pathname);

  return (
    <FeatureModuleShell
      items={NUTRITION_NAV_ITEMS}
      navVariant="nutrition"
      hideMobileNav={shouldHideTabs}
      hideDesktopNav={shouldHideTabs}
    />
  );
};

export default NutritionShell;
