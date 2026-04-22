import React from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboardIcon,
  UsersIcon,
  UtensilsIcon,
  UserIcon,
  DumbbellIcon,
  BookOpenIcon,
  WalletCardsIcon,
  BotIcon,
  SendIcon,
  ReceiptTextIcon,
  Share2Icon,
  MessageSquareIcon,
} from "lucide-react";
import CoachMobileNav from "./mobile-nav.jsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
import { useAuthStore } from "@/store";
import ProfileDrawer from "@/modules/user/layout/profile-drawer.jsx";
import PremiumReminderDrawer from "@/modules/user/layout/premium-reminder-drawer.jsx";
import {
  PROFILE_OVERVIEW_TAB,
  useProfileOverlay,
} from "@/modules/profile/hooks/use-profile-overlay";
import LayoutHeader from "@/components/layout-header.jsx";
import { useMobileChromeHidden } from "@/hooks/app/use-mobile-chrome-hidden";
import { get, map } from "lodash";
import { cn } from "@/lib/utils";

const mainNav = [
  { to: "/coach/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { to: "/coach/clients", label: "Mijozlar", icon: UsersIcon },
  {
    to: "/coach/meal-plans",
    label: "Ovqatlanish rejalari",
    icon: UtensilsIcon,
  },
  {
    to: "/coach/workout-plans",
    label: "Workout rejalari",
    icon: DumbbellIcon,
  },
  { to: "/coach/courses", label: "Kurslar", icon: BookOpenIcon },
  {
    to: "/coach/course-purchases",
    label: "Kurs xaridlari",
    icon: ReceiptTextIcon,
  },
  { to: "/coach/payments", label: "To'lovlar", icon: WalletCardsIcon },
  { to: "/coach/chat", label: "Chat", icon: MessageSquareIcon },
  { to: "/coach/referrals", label: "Referral", icon: Share2Icon },
  { to: "/coach/telegram-bot", label: "Telegram bot", icon: SendIcon },
  {
    to: "/coach/telegram-groups",
    label: "Telegram guruhlar",
    icon: BotIcon,
  },
];

const NavGroup = ({ label, items }) => (
  <SidebarGroup>
    <SidebarGroupLabel>{label}</SidebarGroupLabel>
    <SidebarGroupContent>
      <SidebarMenu>
        {map(items, (item) => (
          <SidebarMenuItem key={item.to}>
            <SidebarMenuButton asChild>
              <NavLink to={item.to}>
                <item.icon />
                <span>{item.label}</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroupContent>
  </SidebarGroup>
);

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setActiveRole, user } = useAuthStore();
  const { openProfile } = useProfileOverlay();
  const mobileChromeHidden = useMobileChromeHidden();
  const isMobileChatView = location.pathname.startsWith("/coach/chat");

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <RoleSwitcher />
        </SidebarHeader>
        <SidebarContent>
          <NavGroup label="Asosiy" items={mainNav} />
        </SidebarContent>
        <SidebarFooter>
          <NavUser />
        </SidebarFooter>
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
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      setActiveRole("USER");
                      navigate("/user");
                    }}
                  >
                    <UserIcon className="size-4" />
                    <span className="hidden md:inline">User</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-full"
                    onClick={() => openProfile(PROFILE_OVERVIEW_TAB)}
                  >
                    <Avatar className="size-8 border">
                      <AvatarImage
                        src={get(user, "avatar")}
                        alt={get(user, "username") || "Coach"}
                      />
                      <AvatarFallback className="text-[10px] font-semibold">
                        {(get(user, "firstName[0]") || "") +
                          (get(user, "lastName[0]") || "") ||
                          get(user, "username[0]")?.toUpperCase() ||
                          "C"}
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
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    setActiveRole("USER");
                    navigate("/user");
                  }}
                >
                  <UserIcon className="size-4" />
                  <span className="hidden md:inline">User</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full"
                  onClick={() => openProfile(PROFILE_OVERVIEW_TAB)}
                >
                  <Avatar className="size-8 border">
                    <AvatarImage
                      src={get(user, "avatar")}
                      alt={get(user, "username") || "Coach"}
                    />
                    <AvatarFallback className="text-[10px] font-semibold">
                      {(get(user, "firstName[0]") || "") +
                        (get(user, "lastName[0]") || "") ||
                        get(user, "username[0]")?.toUpperCase() ||
                        "C"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </>
            }
          />
        )}
        <div
          className={cn(
            "relative min-w-0 flex-1 overflow-x-auto md:mt-0 md:overflow-visible md:p-6 md:pb-6",
            isMobileChatView ? "mt-0 p-0 pb-0" : "mt-16 p-3 pb-24",
          )}
        >
          <Outlet />
        </div>
        {!isMobileChatView ? (
          <div className="md:hidden">
            <CoachMobileNav hidden={mobileChromeHidden} />
          </div>
        ) : null}
      </SidebarInset>
      <ProfileDrawer />
      <PremiumReminderDrawer />
    </SidebarProvider>
  );
};

export default Index;
