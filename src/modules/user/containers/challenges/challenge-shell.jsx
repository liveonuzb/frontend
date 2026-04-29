import React from "react";
import { useLocation } from "react-router";
import FeatureModuleShell from "@/modules/user/layout/feature-module-shell.jsx";
import { CHALLENGE_NAV_ITEMS } from "./challenge-nav-items.js";

const PRIMARY_TAB_PATHS = [
  "/user/challenges/home",
  "/user/challenges/my",
  "/user/challenges/explore",
  "/user/challenges/report",
];

const ChallengeShell = () => {
  const { pathname } = useLocation();
  const shouldHideTabs = !PRIMARY_TAB_PATHS.includes(pathname);

  return (
    <FeatureModuleShell
      items={CHALLENGE_NAV_ITEMS}
      hideMobileNav={shouldHideTabs}
      hideDesktopNav={shouldHideTabs}
    />
  );
};

export default ChallengeShell;
