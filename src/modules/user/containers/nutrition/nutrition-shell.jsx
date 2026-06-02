import React from "react";
import { useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import FeatureModuleShell from "@/modules/user/layout/feature-module-shell.jsx";
import { NUTRITION_NAV_ITEMS } from "./nutrition-nav-items.js";

import includes from "lodash/includes";
import map from "lodash/map";

const PRIMARY_TAB_PATHS = [
  "/user/nutrition/overview",
  "/user/nutrition/plans",
  "/user/nutrition/recipes",
  "/user/nutrition/history",
  "/user/nutrition/report",
];

const NutritionShell = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const shouldHideTabs = !includes(PRIMARY_TAB_PATHS, pathname);
  const navItems = React.useMemo(
    () =>
      map(NUTRITION_NAV_ITEMS, (item) => ({
        ...item,
        label: item.labelKey ? t(item.labelKey) : item.label,
      })),
    [t],
  );

  return (
    <FeatureModuleShell
      items={navItems}
      navVariant="nutrition"
      hideMobileNav={shouldHideTabs}
      hideDesktopNav={shouldHideTabs}
    />
  );
};

export default NutritionShell;
