import React from "react";
import { useLocation } from "react-router";
import FeatureModuleShell from "@/modules/user/layout/feature-module-shell.jsx";
import { NUTRITION_NAV_ITEMS } from "./nutrition-nav-items.js";

const PRIMARY_TAB_PATHS = [
  "/user/nutrition/home",
  "/user/nutrition/plans",
  "/user/nutrition/meals",
  "/user/nutrition/report",
];

const NutritionShell = () => {
  const { pathname } = useLocation();
  const shouldHideTabs = !PRIMARY_TAB_PATHS.includes(pathname);

  return (
    <FeatureModuleShell
      items={NUTRITION_NAV_ITEMS}
      hideMobileNav={shouldHideTabs}
      hideDesktopNav={shouldHideTabs}
    />
  );
};

export default NutritionShell;
