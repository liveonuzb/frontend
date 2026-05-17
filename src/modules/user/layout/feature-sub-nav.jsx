import React from "react";
import { NavLink, useLocation } from "react-router";
import { cn } from "@/lib/utils";
import { useMobileChromeHidden } from "@/hooks/app/use-mobile-chrome-hidden";

const isItemActive = (pathname, item) => {
  if (item.match) {
    return item.match(pathname);
  }

  return pathname === item.to || pathname.startsWith(`${item.to}/`);
};

const FeatureSubNav = ({ items = [], className, mobile = false }) => {
  const { pathname } = useLocation();
  const mobileChromeHidden = useMobileChromeHidden();

  return (
    <div
      className={cn(
        mobile && "sticky top-0 z-30 w-full pt-1 transition-[top] duration-200",
        mobile && (mobileChromeHidden ? "top-1" : "top-[68px]"),
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
              {items.map((item) => {
                const active = isItemActive(pathname, item);

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
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
          className="rounded-[1.25rem] border bg-background/80 p-2 backdrop-blur"
        >
          <div className="flex flex-wrap items-center justify-start gap-2 overflow-x-auto no-scrollbar">
            {items.map((item) => {
              const active = isItemActive(pathname, item);

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-3xl px-8 py-2 text-sm font-semibold transition-colors",
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
      )}
    </div>
  );
};

export default FeatureSubNav;
