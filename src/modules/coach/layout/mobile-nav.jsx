import { NavLink } from "react-router";
import { cn } from "@/lib/utils";
import {
  LayoutDashboardIcon,
  UsersIcon,
  UtensilsIcon,
  WalletCardsIcon,
  DumbbellIcon,
  BotIcon,
} from "lucide-react";

const navItems = [
  { to: "/coach/dashboard", icon: LayoutDashboardIcon, label: "Dashboard" },
  { to: "/coach/clients", icon: UsersIcon, label: "Mijozlar" },
  { to: "/coach/meal-plans", icon: UtensilsIcon, label: "Ovqatlanish" },
  { to: "/coach/workout-plans", icon: DumbbellIcon, label: "Workout" },
  { to: "/coach/payments", icon: WalletCardsIcon, label: "To'lovlar" },
  { to: "/coach/telegram-groups", icon: BotIcon, label: "Telegram" },
];

export default function CoachMobileNav({ hidden = false }) {
  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 flex items-end justify-center pb-safe-or-4 pb-4 px-3 transition-transform duration-200",
        hidden ? "translate-y-[calc(100%+1rem)]" : "translate-y-0",
      )}
    >
      <div className="flex-1 flex items-center bg-background/95 backdrop-blur-md border border-border/40 shadow-2xl rounded-full px-4 py-1.5 gap-2 overflow-x-auto overflow-y-hidden scrollbar-hide">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            title={item.label}
            className={({ isActive }) =>
              cn(
                "flex flex-col flex-shrink-0 items-center justify-center w-[72px] h-14 rounded-2xl transition-all duration-200",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )
            }
          >
            <item.icon className="size-5 mb-1" />
            <span className="text-[10px] font-medium leading-none">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}
