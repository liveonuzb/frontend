import React from "react";
import { NavLink, useLocation } from "react-router";
import { cn } from "@/lib/utils";
import { useMobileChromeHidden } from "@/hooks/app/use-mobile-chrome-hidden";

import { map } from "lodash";

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
  variant = "default",
}) => {
  const { pathname } = useLocation();
  const mobileChromeHidden = useMobileChromeHidden();
  const isNutrition = variant === "nutrition";

  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        mobile && "sticky top-0 z-30 w-full pt-1 transition-[top] duration-200",
        mobile && (mobileChromeHidden ? "top-1" : "top-[68px]"),
        className,
      )}
    >
      {mobile ? (
        <div
          data-workout-tab="surface"
          className={cn(
            "rounded-[1.75rem] border bg-background/95 px-1 py-1 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80",
            isNutrition && "border-primary/10 bg-card/90 shadow-primary/5",
          )}
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
                      isNutrition && "border border-transparent",
                      active
                        ? cn(
                            "bg-primary/10 text-primary",
                            isNutrition && "border-primary/15 bg-primary/10 shadow-sm shadow-primary/10",
                          )
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
          className={cn(
            "rounded-[1.25rem] border bg-background/80 p-2 backdrop-blur",
            isNutrition && "border-primary/10 bg-card/80 shadow-sm shadow-primary/5",
          )}
        >
          <div className="flex flex-wrap items-center justify-start gap-2 overflow-x-auto no-scrollbar">
            {map(items, (item) => {
              const active = isItemActive(pathname, item);

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-3xl px-8 py-2 text-sm font-semibold transition-colors",
                    isNutrition && "border border-transparent px-5 lg:px-7",
                    active
                      ? cn(
                          "bg-primary/10 text-primary",
                          isNutrition && "border-primary/15 bg-primary/10 shadow-sm shadow-primary/10",
                        )
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
      )}
    </nav>
  );
};

export default FeatureSubNav;
