import React from "react";
import { Outlet, useLocation } from "react-router";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import KeyboardShortcutsProvider from "@/components/keyboard-shortcuts";
import CalendarBottomDrawer from "@/components/calendar-bottom-drawer.jsx";
import { useAddMealOverlayStore, useAuthStore } from "@/store";
import MobileNav from "./mobile-nav.jsx";
import MobileSidebarEdgeSwipe from "./mobile-sidebar-edge-swipe.jsx";
import PullToRefresh from "@/components/pull-to-refresh";
import { useMobileChromeHidden } from "@/hooks/app/use-mobile-chrome-hidden";
import ProfileDrawer from "./profile-drawer.jsx";
import PremiumGiftReceivedDrawer from "./premium-gift-received-drawer.jsx";
import RewardReminderDrawer from "./reward-reminder-drawer.jsx";
import AddMealOverlay from "./add-meal-overlay.jsx";
import useRealtimeNotifications from "@/hooks/app/use-realtime-notifications";
import { cn } from "@/lib/utils";
import { stripProfileRouteSuffix } from "@/modules/profile/lib/profile-route-state";
import { userCardScopeClassName } from "@/modules/user/lib/card-styles";
import {
  isRunningLiveImmersivePath,
  shouldHideMobileNavForPath,
} from "./layout-route-state.js";
import UserTopBar from "./user-top-bar.jsx";
import { UserLayoutDateProvider } from "./user-layout-date-context.jsx";

const formatLayoutDateLabel = (date) =>
  date.toLocaleDateString("uz-UZ", {
    day: "numeric",
    month: "short",
  });

const Index = () => {
  const location = useLocation();
  const routePathname = React.useMemo(
    () => stripProfileRouteSuffix(location.pathname),
    [location.pathname],
  );
  const mobileChromeHidden = useMobileChromeHidden();
  const user = useAuthStore((state) => state.user);
  const [selectedDate, setSelectedDate] = React.useState(() => new Date());
  const [calendarOpen, setCalendarOpen] = React.useState(false);
  const [maxSelectableDate] = React.useState(() => new Date());
  const selectedDateLabel = React.useMemo(
    () => formatLayoutDateLabel(selectedDate),
    [selectedDate],
  );
  const isMobileChatView = routePathname.startsWith("/user/chat");
  const isRunningImmersiveRoute = isRunningLiveImmersivePath(routePathname);
  const isRunningLiveRoute = routePathname.startsWith(
    "/user/workout/running/live",
  );
  const isWorkoutSessionRoute =
    /^\/user\/workout\/plans\/[^/]+\/days\/[^/]+\/session\/?$/.test(
      routePathname,
    );
  const hideSharedTopBar =
    isMobileChatView ||
    isRunningImmersiveRoute ||
    isRunningLiveRoute ||
    isWorkoutSessionRoute;
  const isDashboardRoute =
    routePathname === "/user/dashboard" ||
    routePathname.startsWith("/user/dashboard/");
  const isWorkoutRoute = routePathname.startsWith("/user/workout");
  const hideMobileNav = shouldHideMobileNavForPath(routePathname);
  const isFeatureScopedMobileNav =
    routePathname.startsWith("/user/workout") ||
    routePathname.startsWith("/user/nutrition");
  const isAddMealOverlayOpen = useAddMealOverlayStore(
    (state) => state.isActionDrawerOpen,
  );

  useRealtimeNotifications();

  return (
    <KeyboardShortcutsProvider>
      <SidebarProvider
        className={cn(
          userCardScopeClassName,
          isWorkoutRoute && !isRunningImmersiveRoute && "workout-layout-theme",
          isRunningLiveRoute && "bg-white [--background:#fff]",
        )}
      >
        <UserLayoutDateProvider
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        >
          <MobileSidebarEdgeSwipe
            enabled={!isRunningImmersiveRoute && !isRunningLiveRoute}
          />
          <SidebarInset
            className={cn(
              "user-phone-shell mx-auto min-h-svh w-full max-w-md min-w-0",
              isFeatureScopedMobileNav ? "overflow-visible" : "overflow-hidden",
              isRunningLiveRoute && "bg-white",
            )}
          >
            <div
              data-testid="user-layout-content"
              className={cn(
                userCardScopeClassName,
                "relative mx-auto min-w-0 w-full max-w-md flex-1",
                !hideSharedTopBar && "space-y-5",
                isRunningImmersiveRoute
                  ? "mt-0 overflow-visible p-0 pb-0"
                  : isMobileChatView
                    ? "mt-0 p-0 pb-0"
                  : isDashboardRoute
                    ? "mt-0 overflow-x-auto px-3 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]"
                    : isRunningLiveRoute
                      ? "mt-0 overflow-visible p-0"
                      : isFeatureScopedMobileNav
                        ? "mt-0 overflow-visible p-3 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]"
                        : "mt-0 overflow-x-auto px-3 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]",
              )}
            >
              {!hideSharedTopBar ? (
                <div
                  className={cn(
                    isMobileChatView &&
                      "px-3 pt-[max(0.75rem,env(safe-area-inset-top))]",
                  )}
                >
                  <UserTopBar
                    user={user}
                    selectedDateLabel={selectedDateLabel}
                    onOpenCalendar={() => setCalendarOpen(true)}
                    showCalendarButton={!isDashboardRoute}
                  />
                </div>
              ) : null}
              <PullToRefresh
                enabled={!isAddMealOverlayOpen}
                onRefresh={() => window.location.reload()}
              >
                <Outlet />
              </PullToRefresh>
            </div>
            {!hideMobileNav ? (
              <MobileNav hidden={mobileChromeHidden} />
            ) : null}
          </SidebarInset>
        </UserLayoutDateProvider>
        <ProfileDrawer />
        <AddMealOverlay />
        <PremiumGiftReceivedDrawer />
        <RewardReminderDrawer />
        <CalendarBottomDrawer
          open={calendarOpen}
          onOpenChange={setCalendarOpen}
          date={selectedDate}
          onChange={setSelectedDate}
          maxDate={maxSelectableDate}
          title="Sana tanlang"
          description="Sahifalar tanlangan kunga moslanadi."
        />
      </SidebarProvider>
    </KeyboardShortcutsProvider>
  );
};

export default Index;
