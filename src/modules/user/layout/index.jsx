import { map, take } from "lodash";
import React from "react";
import { Outlet, NavLink, useLocation } from "react-router";
import {
  LayoutDashboardIcon,
  UtensilsIcon,
  GlassWaterIcon,
  RulerIcon,
  MessageSquareIcon,
  DumbbellIcon,
  TrophyIcon,
  UserPlusIcon,
  WalletCardsIcon,
  CompassIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import RoleSwitcher from "@/components/role-switcher";
import NavUser from "@/components/nav-user";
import NotificationCenter from "@/components/notification-center";
import KeyboardShortcutsProvider from "@/components/keyboard-shortcuts";
import GamificationBadges from "@/components/gamification-badges";
import { useAuthStore } from "@/store";
import MobileNav from "./mobile-nav.jsx";
import PullToRefresh from "@/components/pull-to-refresh";
import LayoutHeader from "@/components/layout-header.jsx";
import { useMobileChromeHidden } from "@/hooks/app/use-mobile-chrome-hidden";
import ProfileDrawer from "./profile-drawer.jsx";
import PremiumReminderDrawer from "./premium-reminder-drawer.jsx";
import AddMealOverlay from "./add-meal-overlay.jsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  PROFILE_OVERVIEW_TAB,
  useProfileOverlay,
} from "@/modules/profile/hooks/use-profile-overlay";

const otherNav = [];

const NavGroup = ({ label, items, pathname }) => {
  if (!items || items.length === 0) return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {map(items, (item) => (
            <SidebarMenuItem key={item.to ?? item.label}>
              {item.onClick ? (
                <SidebarMenuButton
                  isActive={item.isActive}
                  onClick={item.onClick}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton
                  isActive={pathname.startsWith(item.to)}
                  asChild
                >
                  <NavLink to={item.to}>
                    <item.icon />
                    <span>{item.label}</span>
                  </NavLink>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

const Index = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  const { openProfile } = useProfileOverlay();
  const preferredSidebarState = user?.settings?.sidebarState ?? "expanded";
  const [sidebarOpen, setSidebarOpen] = React.useState(
    preferredSidebarState !== "collapsed",
  );
  const mobileChromeHidden = useMobileChromeHidden();

  React.useEffect(() => {
    setSidebarOpen(preferredSidebarState !== "collapsed");
  }, [preferredSidebarState]);

  const displayName =
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
    user?.username ||
    "Foydalanuvchi";
  const initials = take(
    map(displayName.split(" "), (part) => part[0]),
    2,
  )
    .join("")
    .toUpperCase();

  const trackingNav = React.useMemo(
    () => [
      {
        to: "/user/dashboard",
        label: "Dashboard",
        icon: LayoutDashboardIcon,
      },
      {
        to: "/user/nutrition",
        label: "Ovqatlanish",
        icon: UtensilsIcon,
      },
      {
        to: "/user/measurements",
        label: "O'lchamlar",
        icon: RulerIcon,
      },
      {
        to: "/user/workout",
        label: "Mashg'ulot",
        icon: DumbbellIcon,
      },
      {
        to: "/user/challenges",
        label: "Musobaqalar",
        icon: TrophyIcon,
      },

      {
        to: "/user/friends",
        label: "Do'stlar",
        icon: UserPlusIcon,
      },
      {
        to: "/user/payments",
        label: "To'lovlar",
        icon: WalletCardsIcon,
      },
      {
        to: "/user/chat",
        label: "Chat",
        icon: MessageSquareIcon,
      },
    ],
    [],
  );

  return (
    <KeyboardShortcutsProvider>
      <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <Sidebar direction={"left"} variant={"floating"} collapsible={"icon"}>
          <SidebarHeader>
            <RoleSwitcher />
          </SidebarHeader>
          <SidebarContent>
            <NavGroup
              label="Kuzatish"
              items={trackingNav}
              pathname={location.pathname}
            />
            <NavGroup
              label="Boshqa"
              items={otherNav}
              pathname={location.pathname}
            />
          </SidebarContent>
          <SidebarFooter>
            <GamificationBadges compact className="px-2 pb-2" />
            <NavUser />
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="min-w-0 overflow-hidden md:overflow-visible">
          <LayoutHeader
            mobileChromeHidden={mobileChromeHidden}
            user={user}
            onOpenProfile={() => openProfile(PROFILE_OVERVIEW_TAB)}
            desktopRightContent={
              <>
                <NotificationCenter />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full"
                  onClick={() => openProfile(PROFILE_OVERVIEW_TAB)}
                >
                  <Avatar className="size-8 border">
                    <AvatarImage src={user?.avatar} alt={displayName} />
                    <AvatarFallback className="text-[10px] font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </>
            }
          />
          <div className="relative mt-16 min-w-0 flex-1 overflow-x-auto p-3 pb-12 md:mt-0 md:overflow-visible md:p-6 md:pb-3">
            <PullToRefresh onRefresh={() => window.location.reload()}>
              <Outlet />
            </PullToRefresh>
          </div>
          <div className="md:hidden">
            <MobileNav hidden={mobileChromeHidden} />
          </div>
        </SidebarInset>
        <ProfileDrawer />
        <AddMealOverlay />
        <PremiumReminderDrawer />
      </SidebarProvider>
    </KeyboardShortcutsProvider>
  );
};

export default Index;
