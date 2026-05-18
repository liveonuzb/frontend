import React from "react";
import { get, map, sumBy, toNumber } from "lodash";
import { NavLink, useLocation } from "react-router";
import { cn } from "@/lib/utils";
import { isNavItemActive } from "@/lib/navigation";
import { Home2 } from "iconsax-reactjs";
import { Salad, DumbbellIcon, MessageSquareIcon } from "lucide-react";
import { useChatStore } from "@/store";

import FloatingActionButton from "@/components/fab";

const MobileNav = ({ hidden = false }) => {
  const { pathname } = useLocation();
  const contacts = useChatStore((state) => state.contacts);
  const initSocket = useChatStore((state) => state.initSocket);
  const disconnectSocket = useChatStore((state) => state.disconnectSocket);
  const fetchRooms = useChatStore((state) => state.fetchRooms);
  const totalUnread = React.useMemo(
    () =>
      sumBy(contacts, (contact) =>
        Math.max(0, toNumber(get(contact, "unreadCount", 0)) || 0),
      ),
    [contacts],
  );

  React.useEffect(() => {
    initSocket();
    fetchRooms();

    return () => disconnectSocket();
  }, [disconnectSocket, fetchRooms, initSocket]);

  const items = [
    { to: "/user/dashboard", icon: Home2, label: "Dashboard" },
    { to: "/user/nutrition/home", icon: Salad, label: "Ovqatlanish" },
    {
      to: "/user/workout/home",
      label: "Mashg'ulotlar",
      icon: DumbbellIcon,
    },
    {
      to: "/user/chat",
      label: "Chat",
      icon: MessageSquareIcon,
      unreadCount: totalUnread,
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
          const itemUnreadCount = toNumber(get(item, "unreadCount", 0)) || 0;
          const label = get(item, "label", "");
          const ariaLabel =
            itemUnreadCount > 0
              ? `${label}, ${itemUnreadCount} ta o'qilmagan xabar`
              : label;
          const unreadBadge =
            itemUnreadCount > 99 ? "99+" : String(itemUnreadCount);

          return (
            <NavLink
              key={get(item, "to", "")}
              to={get(item, "to", "")}
              title={label}
              aria-label={ariaLabel}
              aria-current={isActive ? "page" : undefined}
              className={() =>
                cn(
                  "relative flex items-center justify-center rounded-full p-[15px] transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )
              }
            >
              <item.icon className="size-[24px]" />
              {itemUnreadCount > 0 ? (
                <span
                  aria-hidden="true"
                  className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground ring-2 ring-background"
                >
                  {unreadBadge}
                </span>
              ) : null}
            </NavLink>
          );
        })}
      </div>
      <FloatingActionButton />
    </div>
  );
};

export default MobileNav;
