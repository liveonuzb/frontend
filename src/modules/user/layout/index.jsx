import { map, take, toUpper, trim, split } from "lodash";
import React, { useEffect } from "react";
import { Navigate, Outlet, NavLink, useLocation } from "react-router";
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
import NotificationCenter from "@/components/notification-center";
import KeyboardShortcutsProvider from "@/components/keyboard-shortcuts";
import { useAddMealOverlayStore, useAuthStore } from "@/store";
import MobileNav from "./mobile-nav.jsx";
import MobileSidebarEdgeSwipe from "./mobile-sidebar-edge-swipe.jsx";
import PullToRefresh from "@/components/pull-to-refresh";
import LayoutHeader from "@/components/layout-header.jsx";
import { useMobileChromeHidden } from "@/hooks/app/use-mobile-chrome-hidden";
import ProfileDrawer from "./profile-drawer.jsx";
import PremiumReminderDrawer from "./premium-reminder-drawer.jsx";
import PremiumGiftReceivedDrawer from "./premium-gift-received-drawer.jsx";
import RewardReminderDrawer from "./reward-reminder-drawer.jsx";
import AddMealOverlay from "./add-meal-overlay.jsx";
import useRealtimeNotifications from "@/hooks/app/use-realtime-notifications";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isNavItemActive } from "@/lib/navigation";
import {
  PROFILE_OVERVIEW_TAB,
  useProfileOverlay,
} from "@/modules/profile/hooks/use-profile-overlay";
import { getStandaloneProfileTabPath } from "@/modules/profile/lib/profile-tab-navigation";
import NavUser from "@/components/nav-user/index.jsx";
import {
  isRunningLiveImmersivePath,
  shouldHideMobileNavForPath,
} from "./layout-route-state.js";
import { getUserTrackingNavItems } from "./user-nav-items.js";

const otherNav = [];

const NavGroup = ({ label, items, pathname }) => {
  if (!items || items.length === 0) return null;

  return (
    <SidebarGroup>
      {/*<SidebarGroupLabel>{label}</SidebarGroupLabel>*/}
      <SidebarGroupContent>
        <SidebarMenu>
          {map(items, (item) => {
            const isActive = isNavItemActive(pathname, item, items);

            return (
              <SidebarMenuItem key={item.to ?? item.label}>
                {item.onClick ? (
                  <SidebarMenuButton
                    isActive={item.isActive}
                    onClick={item.onClick}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                ) : (
                  <SidebarMenuButton
                    isActive={isActive}
                    asChild
                    tooltip={item.label}
                  >
                    <NavLink
                      to={item.to}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            );
          })}
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
  const isRunningImmersiveRoute = isRunningLiveImmersivePath(location.pathname);
  const isRunningLiveRoute = location.pathname.startsWith(
    "/user/workout/running/live",
  );
  const isDashboardRoute =
    location.pathname === "/user/dashboard" ||
    location.pathname.startsWith("/user/dashboard/");
  const isWorkoutRoute = location.pathname.startsWith("/user/workout");
  const hideMobileNav = shouldHideMobileNavForPath(location.pathname);
  const isFeatureScopedMobileNav =
    location.pathname.startsWith("/user/workout") ||
    location.pathname.startsWith("/user/nutrition");
  const sharedMobileHeaderClass = "hidden md:block";
  const isAddMealOverlayOpen = useAddMealOverlayStore(
    (state) => state.isActionDrawerOpen,
  );

  const displayName =
    trim(`${user?.firstName || ""} ${user?.lastName || ""}`) ||
    user?.username ||
    "Foydalanuvchi";
  const initials = toUpper(
    take(
      map(split(displayName, " "), (part) => part[0]),
      2,
    ).join(""),
  );
  const standaloneProfilePath = React.useMemo(() => {
    const params = new URLSearchParams(location.search);
    const profileState = params.get("profile");
    const profileTab = params.get("profileTab");

    if (profileState !== "open") {
      return null;
    }

    return getStandaloneProfileTabPath(profileTab, location.search);
  }, [location.search]);

  const trackingNav = React.useMemo(() => getUserTrackingNavItems(), []);

  useRealtimeNotifications();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSidebarOpen(preferredSidebarState !== "collapsed");
  }, [preferredSidebarState]);

  if (standaloneProfilePath) {
    return <Navigate to={standaloneProfilePath} replace />;
  }

  return (
    <KeyboardShortcutsProvider>
      <SidebarProvider
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        className={cn(
          isWorkoutRoute && !isRunningImmersiveRoute && "workout-layout-theme",
        )}
      >
        {!isRunningImmersiveRoute ? (
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
              <NavUser />
            </SidebarFooter>
          </Sidebar>
        ) : null}
        <MobileSidebarEdgeSwipe
          enabled={!isRunningImmersiveRoute && !isRunningLiveRoute}
        />
        <SidebarInset
          className={cn(
            "min-w-0 md:overflow-visible",
            isFeatureScopedMobileNav ? "overflow-visible" : "overflow-hidden",
          )}
        >
          {isRunningImmersiveRoute ? null : isMobileChatView ? (
            <div className="hidden md:block">
              <LayoutHeader
                mobileChromeHidden={mobileChromeHidden}
                user={user}
                onOpenProfile={() => openProfile(PROFILE_OVERVIEW_TAB)}
                className={cn(
                  isWorkoutRoute ? "workout-layout-header" : undefined,
                  sharedMobileHeaderClass,
                )}
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
              className={cn(
                isWorkoutRoute ? "workout-layout-header" : undefined,
                sharedMobileHeaderClass,
              )}
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
            data-testid="user-layout-content"
            className={cn(
              "relative min-w-0 flex-1 md:mt-0 md:overflow-visible md:p-6 md:pb-3",
              isRunningImmersiveRoute
                ? "mt-0 overflow-visible p-0 pb-0 md:p-0 md:pb-0"
                : isMobileChatView
                  ? "mt-0 p-0 pb-0"
                : isDashboardRoute
                  ? "mt-0 overflow-x-auto px-3 pb-12 pt-[max(0.75rem,env(safe-area-inset-top))] md:p-6 md:pb-3"
                  : isFeatureScopedMobileNav
                    ? "mt-0 overflow-visible p-3 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] md:pb-3"
                    : "mt-0 overflow-x-auto px-3 pb-12 pt-[max(0.75rem,env(safe-area-inset-top))]",
            )}
          >
            <PullToRefresh
              enabled={!isAddMealOverlayOpen}
              onRefresh={() => window.location.reload()}
            >
              <Outlet />
            </PullToRefresh>
          </div>
          {!hideMobileNav ? (
            <div className="md:hidden">
              <MobileNav hidden={mobileChromeHidden} />
            </div>
          ) : null}
        </SidebarInset>
        <ProfileDrawer />
        <AddMealOverlay />
        <PremiumReminderDrawer />
        <PremiumGiftReceivedDrawer />
        <RewardReminderDrawer />
      </SidebarProvider>
    </KeyboardShortcutsProvider>
  );
};

export default Index;
