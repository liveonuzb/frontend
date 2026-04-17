import { get, map } from "lodash";
import { NavLink, useLocation } from "react-router";
import { cn } from "@/lib/utils";
import { Home2,Messages2 } from "iconsax-reactjs";
import { Salad, Dumbbell, TrophyIcon } from "lucide-react";

import FloatingActionButton from "@/components/fab";

const MobileNav = ({ hidden = false }) => {
  const { pathname } = useLocation();

  const items = [
    { to: "/user/dashboard", icon: Home2, label: "Dashboard" },
    { to: "/user/nutrition", icon: Salad, label: "Ovqatlanish" },
    { to: "/user/workout", icon: Dumbbell, label: "Mashg'ulotlar" },
    { to: "/user/challenges", icon: TrophyIcon, label: "Musobaqalar" },
    { to: "/user/chat", icon: Messages2, label: "Chat" },
  ];

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 flex items-end justify-between px-3 pb-4 pb-safe-or-4 transition-transform duration-200",
        hidden ? "translate-y-[calc(100%+1rem)]" : "translate-y-0",
      )}
    >
      <div className="flex justify-between items-center bg-secondary/70 backdrop-blur-md border border-border/40 shadow-2xl rounded-full px-2 py-1.5 gap-0.5">
        {map(items, (item = {}) => (
          <NavLink
            key={get(item, "to", "")}
            to={get(item, "to", "")}
            className={() =>
              cn(
                "flex items-center justify-center rounded-full transition-all duration-200 p-3.5",
                pathname.startsWith(get(item, "to", ""))
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )
            }
          >
            <item.icon className="size-5" />
          </NavLink>
        ))}
      </div>
      <FloatingActionButton />
    </div>
  );
};

export default MobileNav;
