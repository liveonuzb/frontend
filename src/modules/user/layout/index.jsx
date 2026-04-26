import { map, take } from "lodash";
import React, { useEffect } from "react";
import { Navigate, Outlet, NavLink, useLocation } from "react-router";
import {
  LayoutDashboardIcon,
  UtensilsIcon,
  RulerIcon,
  DumbbellIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
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
import NotificationCenter from "@/components/notification-center";
import KeyboardShortcutsProvider from "@/components/keyboard-shortcuts";
import { useAddMealOverlayStore, useAuthStore } from "@/store";
import MobileNav from "./mobile-nav.jsx";
import PullToRefresh from "@/components/pull-to-refresh";
import LayoutHeader from "@/components/layout-header.jsx";
import { useMobileChromeHidden } from "@/hooks/app/use-mobile-chrome-hidden";
import ProfileDrawer from "./profile-drawer.jsx";
import PremiumReminderDrawer from "./premium-reminder-drawer.jsx";
import RewardReminderDrawer from "./reward-reminder-drawer.jsx";
import AddMealOverlay from "./add-meal-overlay.jsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  PROFILE_OVERVIEW_TAB,
  useProfileOverlay,
} from "@/modules/profile/hooks/use-profile-overlay";
import { getStandaloneProfileTabPath } from "@/modules/profile/lib/profile-tab-navigation";

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
  const isMobileChatView = location.pathname.startsWith("/user/chat");
  const isAddMealOverlayOpen = useAddMealOverlayStore(
    (state) => state.isActionDrawerOpen,
  );

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
  const standaloneProfilePath = React.useMemo(() => {
    const params = new URLSearchParams(location.search);
    const profileState = params.get("profile");
    const profileTab = params.get("profileTab");

    if (profileState !== "open") {
      return null;
    }

    return getStandaloneProfileTabPath(profileTab, location.search);
  }, [location.search]);

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
        to: "/user/workout",
        label: "Mashg'ulotlar",
        icon: DumbbellIcon,
      },
      {
        to: "/user/measurements",
        label: "O'lchamlar",
        icon: RulerIcon,
      },
    ],
    [],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSidebarOpen(preferredSidebarState !== "collapsed");
  }, [preferredSidebarState]);

  if (standaloneProfilePath) {
    return <Navigate to={standaloneProfilePath} replace />;
  }

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
        </Sidebar>
        <SidebarInset className="min-w-0 overflow-hidden md:overflow-visible">
          {isMobileChatView ? (
            <div className="hidden md:block">
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
            </div>
          ) : (
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
          )}
          <div
            className={cn(
              "relative min-w-0 flex-1 overflow-x-auto md:mt-0 md:overflow-visible md:p-6 md:pb-3",
              isMobileChatView ? "mt-0 p-0 pb-0" : "mt-16 p-3 pb-12",
            )}
          >
            <PullToRefresh
              enabled={!isAddMealOverlayOpen}
              onRefresh={() => window.location.reload()}
            >
              <Outlet />
            </PullToRefresh>
          </div>
          {!isMobileChatView ? (
            <div className="md:hidden">
              <MobileNav hidden={mobileChromeHidden} />
            </div>
          ) : null}
        </SidebarInset>
        <ProfileDrawer />
        <AddMealOverlay />
        <PremiumReminderDrawer />
        <RewardReminderDrawer />
      </SidebarProvider>
    </KeyboardShortcutsProvider>
  );
};

export default Index;
