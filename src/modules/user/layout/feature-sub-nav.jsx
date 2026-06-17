import React from "react";
import { NavLink, useLocation } from "react-router";
import { cn } from "@/lib/utils";

import map from "lodash/map";

const isItemActive = (pathname, item) => {
  if (item.match) {
    return item.match(pathname);
  }

  return pathname === item.to || pathname.startsWith(`${item.to}/`);
};

const FeatureSubNav = ({
  items = [],
  className,
  mobile = false,
  ariaLabel,
}) => {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        mobile && "sticky top-0 z-30 w-full pt-1 transition-[top] duration-200",
        mobile && "top-1",
        className,
      )}
    >
      {mobile ? (
        <div
          data-workout-tab="surface"
          className="rounded-[1.75rem] border bg-background/95 px-1 py-1 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80"
        >
          <div className="overflow-x-auto no-scrollbar">
            <div
              className={cn(
                "flex min-w-max flex-nowrap items-center gap-1.5",
                items.length <= 4 && "min-w-full justify-between",
              )}
            >
              {map(items, (item) => {
                const active = isItemActive(pathname, item);

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-semibold transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <item.icon className="size-3.5" />
                    <span className="text-xs">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div
          data-workout-tab="surface"
          className="rounded-[1.75rem] border bg-background/95 px-1 py-1 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80"
        >
          <div className="overflow-x-auto no-scrollbar">
            <div className="flex min-w-max flex-nowrap items-center gap-1.5">
              {map(items, (item) => {
                const active = isItemActive(pathname, item);

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <item.icon className="size-4" />
                    <span className="text-sm">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default FeatureSubNav;
