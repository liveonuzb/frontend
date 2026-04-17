import { map } from "lodash";
import React from "react";
import { Outlet, NavLink } from "react-router";
import {
  FileClockIcon,
  FileSpreadsheetIcon,
  LayoutDashboardIcon,
  UsersIcon,
  UtensilsIcon,
  SettingsIcon,
  TagIcon,
  TrendingUpIcon,
  GlobeIcon,
  MapPinnedIcon,
  DumbbellIcon,
  ShieldCheckIcon,
  CrownIcon,
  GemIcon,
  TrophyIcon,
  WrenchIcon,
  MedalIcon,
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
import ProfileDrawer from "@/modules/user/layout/profile-drawer.jsx";
import PremiumReminderDrawer from "@/modules/user/layout/premium-reminder-drawer.jsx";
import { useAuthStore } from "@/store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  PROFILE_OVERVIEW_TAB,
  useProfileOverlay,
} from "@/modules/profile/hooks/use-profile-overlay";
import LayoutHeader from "@/components/layout-header.jsx";
import { useMobileChromeHidden } from "@/hooks/app/use-mobile-chrome-hidden";

const mainNav = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { to: "/admin/users", label: "Foydalanuvchilar", icon: UsersIcon },
  { to: "/admin/coaches", label: "Murabbiylar", icon: ShieldCheckIcon },
  { to: "/admin/challenges", label: "Musobaqalar", icon: TrophyIcon },
];

const contentNav = [
  {
    to: "/admin/coach-specializations",
    label: "Sport yo'nalishlari",
    icon: MedalIcon,
  },
  { to: "/admin/foods", label: "Ovqatlar bazasi", icon: UtensilsIcon },
  { to: "/admin/locations", label: "Locations", icon: MapPinnedIcon },
  {
    to: "/admin/food-categories",
    label: "Ovqat Kategoriyalari",
    icon: TagIcon,
  },
  { to: "/admin/workouts", label: "Mashg'ulotlar", icon: DumbbellIcon },
  {
    to: "/admin/workout-plans",
    label: "Workout rejalari",
    icon: DumbbellIcon,
  },
  {
    to: "/admin/workout-categories",
    label: "Mashg'ulot Kategoriyalari",
    icon: TagIcon,
  },
  {
    to: "/admin/workout-muscles",
    label: "Mashq muskullari",
    icon: DumbbellIcon,
  },
  {
    to: "/admin/workout-body-parts",
    label: "Tana qismlari",
    icon: TagIcon,
  },
  { to: "/admin/equipments", label: "Jihozlar", icon: WrenchIcon },
];

const premiumNav = [
  { to: "/admin/revenue", label: "Daromad", icon: TrendingUpIcon },
  { to: "/admin/premium", label: "Premium", icon: GemIcon },
  { to: "/admin/premium/subscriptions", label: "Obunalar", icon: CrownIcon },
];

const systemNav = [
  { to: "/admin/reports", label: "Hisobotlar", icon: FileSpreadsheetIcon },
  { to: "/admin/audit-logs", label: "Audit log", icon: FileClockIcon },
  { to: "/admin/languages", label: "Tillar", icon: GlobeIcon },
  { to: "/admin/settings", label: "Sozlamalar", icon: SettingsIcon },
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
  const { user } = useAuthStore();
  const { openProfile } = useProfileOverlay();
  const mobileChromeHidden = useMobileChromeHidden();

  return (
    <SidebarProvider>
      <Sidebar direction={"left"} variant={"floating"} collapsible={"icon"}>
        <SidebarHeader>
          <RoleSwitcher />
        </SidebarHeader>
        <SidebarContent>
          <NavGroup label="Asosiy" items={mainNav} />
          <NavGroup label="Kontent" items={contentNav} />
          <NavGroup label="Premium" items={premiumNav} />
          <NavGroup label="Tizim" items={systemNav} />
        </SidebarContent>
        <SidebarFooter>
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
                  <AvatarImage
                    src={user?.avatar}
                    alt={user?.username || "Admin"}
                  />
                  <AvatarFallback className="text-[10px] font-semibold">
                    {(user?.firstName?.[0] || "") +
                      (user?.lastName?.[0] || "") ||
                      user?.username?.[0]?.toUpperCase() ||
                      "A"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </>
          }
        />
        <div className="relative mt-16 min-w-0 flex-1 overflow-x-auto p-4 pb-24 md:mt-0 md:overflow-visible md:p-6 md:pb-6">
          <Outlet />
        </div>
      </SidebarInset>
      <ProfileDrawer />
      <PremiumReminderDrawer />
    </SidebarProvider>
  );
};

export default Index;
