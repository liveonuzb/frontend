import React from "react";
import { Outlet, useLocation } from "react-router";
import { cn } from "@/lib/utils";
import FeatureSubNav from "./feature-sub-nav.jsx";

const resolveVisibility = (value, pathname) =>
  typeof value === "function" ? value(pathname) : Boolean(value);

const FeatureModuleShell = ({
  items = [],
  className,
  contentClassName,
  navClassName,
  navAriaLabel,
  navVariant,
  hideDesktopNav = false,
  hideMobileNav = false,
}) => {
  const { pathname } = useLocation();
  const shouldHideDesktopNav = resolveVisibility(hideDesktopNav, pathname);
  const shouldHideMobileNav = resolveVisibility(hideMobileNav, pathname);

  return (
    <div className={cn("flex min-h-full flex-col gap-y-5", className)}>
      {!shouldHideDesktopNav ? (
        <div className="mb-4 hidden md:block">
          <FeatureSubNav
            items={items}
            className={navClassName}
            ariaLabel={navAriaLabel}
            variant={navVariant}
          />
        </div>
      ) : null}
      {!shouldHideMobileNav ? (
        <FeatureSubNav
          items={items}
          mobile
          className={cn("md:hidden", navClassName)}
          ariaLabel={navAriaLabel}
          variant={navVariant}
        />
      ) : null}
      <div className={cn("flex-1", contentClassName)}>
        <Outlet />
      </div>
    </div>
  );
};

export default FeatureModuleShell;
