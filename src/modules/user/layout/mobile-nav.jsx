import { get, map } from "lodash";
import { NavLink, useLocation } from "react-router";
import { cn } from "@/lib/utils";
import { isNavItemActive } from "@/lib/navigation";
import { Home2 } from "iconsax-reactjs";
import { Salad, DumbbellIcon, TrophyIcon } from "lucide-react";

import FloatingActionButton from "@/components/fab";

const MobileNav = ({ hidden = false }) => {
  const { pathname } = useLocation();

  const items = [
    { to: "/user/dashboard", icon: Home2, label: "Dashboard" },
    { to: "/user/nutrition/home", icon: Salad, label: "Ovqatlanish" },
    {
      to: "/user/workout/home",
      label: "Mashg'ulotlar",
      icon: DumbbellIcon,
    },
    {
      to: "/user/challenges",
      label: "Musobaqalar",
      icon: TrophyIcon,
    },
  ];

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 flex items-end justify-between px-5 pb-6 pb-safe-or-4 transition-transform duration-200",
        hidden ? "translate-y-[calc(100%+1rem)]" : "translate-y-0",
      )}
    >
      <div className="flex justify-between items-center bg-secondary/70 backdrop-blur-md border border-border/40 shadow-2xl rounded-full px-2 py-1.5 gap-0.5">
        {map(items, (item = {}) => {
          const isActive = isNavItemActive(pathname, item, items);

          return (
            <NavLink
              key={get(item, "to", "")}
              to={get(item, "to", "")}
              title={get(item, "label", "")}
              aria-label={get(item, "label", "")}
              aria-current={isActive ? "page" : undefined}
              className={() =>
                cn(
                  "flex items-center justify-center rounded-full p-[15px] transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )
              }
            >
              <item.icon className="size-[24px]" />
            </NavLink>
          );
        })}
      </div>
      <FloatingActionButton />
    </div>
  );
};

export default MobileNav;
