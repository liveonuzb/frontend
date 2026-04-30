import { NavLink, useLocation } from "react-router";
import { cn } from "@/lib/utils";
import { isNavItemActive } from "@/lib/navigation";
import {
  LayoutDashboardIcon,
  UsersIcon,
  UtensilsIcon,
  DumbbellIcon,
  MessageSquareIcon,
} from "lucide-react";

const navItems = [
  { to: "/coach/dashboard", icon: LayoutDashboardIcon, label: "Dashboard" },
  { to: "/coach/clients", icon: UsersIcon, label: "Mijozlar" },
  { to: "/coach/meal-plans", icon: UtensilsIcon, label: "Ovqatlanish" },
  { to: "/coach/workout-plans", icon: DumbbellIcon, label: "Workout" },
  { to: "/coach/chat", icon: MessageSquareIcon, label: "Chat" },
];

export default function CoachMobileNav({ hidden = false }) {
  const { pathname } = useLocation();

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 flex items-end justify-center px-8 pb-8 pb-safe-or-4 transition-transform duration-200",
        hidden ? "translate-y-[calc(100%+1rem)]" : "translate-y-0",
      )}
    >
      <div className="flex items-center justify-between bg-secondary/70 backdrop-blur-md border border-border/40 shadow-2xl rounded-full px-2 py-1.5 gap-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            title={item.label}
            aria-current={
              isNavItemActive(pathname, item, navItems) ? "page" : undefined
            }
            className={() =>
              cn(
                "flex items-center justify-center rounded-full p-[15px] transition-all duration-200",
                isNavItemActive(pathname, item, navItems)
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )
            }
          >
            <item.icon className="size-[24px]" />
          </NavLink>
        ))}
      </div>
    </div>
  );
}
