import { filter, map, some, includes } from "lodash";
import React from "react";
import { Outlet, NavLink, useLocation } from "react-router";
import {
  FileClockIcon,
  FileSpreadsheetIcon,
  LayoutDashboardIcon,
  UsersIcon,
  UtensilsIcon,
  SoupIcon,
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
  AwardIcon,
  WrenchIcon,
  MedalIcon,
  BotIcon,
  HeartPulseIcon,
  WalletCardsIcon,
  ClipboardCheckIcon,
  TargetIcon,
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
import { isNavItemActive } from "@/lib/navigation";

const mainNav = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  {
    to: "/admin/users/list",
    label: "Foydalanuvchilar",
    icon: UsersIcon,
    roles: ["SUPER_ADMIN", "SUPPORT", "READONLY_ADMIN"],
  },
  {
    to: "/admin/coaches",
    label: "Murabbiylar",
    icon: ShieldCheckIcon,
    roles: ["SUPER_ADMIN", "SUPPORT", "READONLY_ADMIN"],
  },
  {
    to: "/admin/challenges/list",
    label: "Musobaqalar",
    icon: TrophyIcon,
    roles: ["SUPER_ADMIN", "CONTENT_MANAGER", "GROWTH", "READONLY_ADMIN"],
  },
];

const contentNav = [
  {
    to: "/admin/content-quality",
    label: "Content Quality",
    icon: ClipboardCheckIcon,
  },
  {
    to: "/admin/food-categories/list",
    label: "Ovqat Kategoriyalari",
    icon: TagIcon,
  },
  { to: "/admin/foods/list", label: "Ovqatlar bazasi", icon: UtensilsIcon },
  { to: "/admin/ingredients/list", label: "Ingredientlar", icon: SoupIcon },
  { to: "/admin/cuisines/list", label: "Oshxonalar", icon: GlobeIcon },
  { to: "/admin/locations", label: "Locations", icon: MapPinnedIcon },
  {
    to: "/admin/coach-specializations/list",
    label: "Sport yo'nalishlari",
    icon: MedalIcon,
  },
  { to: "/admin/achievements/list", label: "Achievements", icon: AwardIcon },
  {
    to: "/admin/health-constraints/list",
    label: "Health Constraints",
    icon: HeartPulseIcon,
  },
  {
    to: "/admin/user-goals/list",
    label: "Maqsadlar",
    icon: TargetIcon,
  },

  { to: "/admin/workouts/list", label: "Mashg'ulotlar", icon: DumbbellIcon },
  {
    to: "/admin/workout-plans",
    label: "Workout rejalari",
    icon: DumbbellIcon,
  },
  {
    to: "/admin/workout-categories/list",
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
  { to: "/admin/equipments/list", label: "Jihozlar", icon: WrenchIcon },
];

const premiumNav = [
  {
    to: "/admin/revenue",
    label: "Daromad",
    icon: TrendingUpIcon,
    roles: ["SUPER_ADMIN", "FINANCE", "READONLY_ADMIN"],
  },
  {
    to: "/admin/withdrawals",
    label: "Yechib olishlar",
    icon: WalletCardsIcon,
    roles: ["SUPER_ADMIN", "FINANCE", "READONLY_ADMIN"],
  },
  {
    to: "/admin/premium",
    label: "Premium",
    icon: GemIcon,
    roles: ["SUPER_ADMIN", "GROWTH", "FINANCE", "READONLY_ADMIN"],
  },
  {
    to: "/admin/premium/subscriptions",
    label: "Obunalar",
    icon: CrownIcon,
    roles: ["SUPER_ADMIN", "GROWTH", "FINANCE", "READONLY_ADMIN"],
  },
];

const systemNav = [
  {
    to: "/admin/reports",
    label: "Hisobotlar",
    icon: FileSpreadsheetIcon,
    roles: [
      "SUPER_ADMIN",
      "CONTENT_MANAGER",
      "SUPPORT",
      "FINANCE",
      "READONLY_ADMIN",
    ],
  },
  {
    to: "/admin/audit-logs",
    label: "Audit log",
    icon: FileClockIcon,
    roles: ["SUPER_ADMIN", "READONLY_ADMIN"],
  },
  {
    to: "/admin/platform-bot",
    label: "Platform Bot",
    icon: BotIcon,
    roles: ["SUPER_ADMIN", "GROWTH"],
  },
  {
    to: "/admin/languages",
    label: "Tillar",
    icon: GlobeIcon,
    roles: ["SUPER_ADMIN", "CONTENT_MANAGER"],
  },
  {
    to: "/admin/settings",
    label: "Sozlamalar",
    icon: SettingsIcon,
    roles: ["SUPER_ADMIN"],
  },
];

const NavGroup = ({ label, items }) => {
  const { pathname } = useLocation();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {map(items, (item) => {
            const isActive = isNavItemActive(pathname, item, items);

            return (
              <SidebarMenuItem key={item.to}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
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
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

const CONTENT_ROLES = ["SUPER_ADMIN", "CONTENT_MANAGER", "READONLY_ADMIN"];
const ADMIN_ROLES = [
  "SUPER_ADMIN",
  "CONTENT_MANAGER",
  "SUPPORT",
  "FINANCE",
  "GROWTH",
  "READONLY_ADMIN",
];

const canSeeNavItem = (roles, item) => {
  const allowedRoles = item.roles || ADMIN_ROLES;
  return some(allowedRoles, (role) => includes(roles, role));
};

const getVisibleNavItems = (items, roles) =>
  filter(
    map(items, (item) => ({
      ...item,
      roles: item.roles || CONTENT_ROLES,
    })),
    (item) => canSeeNavItem(roles, item),
  );

const Index = () => {
  const { user, roles } = useAuthStore();
  const { openProfile } = useProfileOverlay();
  const mobileChromeHidden = useMobileChromeHidden();

  const visibleMainNav = React.useMemo(
    () =>
      filter(
        mainNav,
        (item) => canSeeNavItem(roles, item.roles ? item : { ...item, roles: ADMIN_ROLES }),
      ),
    [roles],
  );
  const visibleContentNav = React.useMemo(
    () => getVisibleNavItems(contentNav, roles),
    [roles],
  );
  const visiblePremiumNav = React.useMemo(
    () => filter(premiumNav, (item) => canSeeNavItem(roles, item)),
    [roles],
  );
  const visibleSystemNav = React.useMemo(
    () => filter(systemNav, (item) => canSeeNavItem(roles, item.roles ? item : { ...item, roles: ADMIN_ROLES })),
    [roles],
  );

  return (
    <SidebarProvider>
      <Sidebar direction={"left"} variant={"floating"} collapsible={"icon"}>
        <SidebarHeader>
          <RoleSwitcher />
        </SidebarHeader>
        <SidebarContent>
          {visibleMainNav.length ? (
            <NavGroup label="Asosiy" items={visibleMainNav} />
          ) : null}
          {visibleContentNav.length ? (
            <NavGroup label="Kontent" items={visibleContentNav} />
          ) : null}
          {visiblePremiumNav.length ? (
            <NavGroup label="Premium" items={visiblePremiumNav} />
          ) : null}
          {visibleSystemNav.length ? (
            <NavGroup label="Tizim" items={visibleSystemNav} />
          ) : null}
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
