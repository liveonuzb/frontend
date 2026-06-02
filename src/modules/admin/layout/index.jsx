import filter from "lodash/filter";
import map from "lodash/map";
import some from "lodash/some";
import includes from "lodash/includes";
import toUpper from "lodash/toUpper";
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
  CrownIcon,
  GemIcon,
  TrophyIcon,
  AwardIcon,
  WrenchIcon,
  BotIcon,
  HeartPulseIcon,
  WalletCardsIcon,
  ClipboardCheckIcon,
  TargetIcon,
  LeafIcon,
  CalendarDaysIcon,
  BrainCircuitIcon,
  BellRingIcon,
  BarChart3Icon,
  BookOpenIcon,
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
import { useAdminPermissions } from "@/modules/admin/lib/permissions.js";

const mainNav = [
  {
    to: "/admin/dashboard",
    label: "Dashboard",
    icon: LayoutDashboardIcon,
    capability: "admin.read",
  },
  {
    to: "/admin/users/list",
    label: "Foydalanuvchilar",
    icon: UsersIcon,
    capability: "support.read",
  },
  {
    to: "/admin/tracking",
    label: "Tracking overview",
    icon: BarChart3Icon,
    capability: "support.read",
  },
  {
    to: "/admin/challenges/list",
    label: "Musobaqalar",
    icon: TrophyIcon,
    capability: "content.read",
  },
];

export const contentNav = [
  {
    to: "/admin/content-quality",
    label: "Content Quality",
    icon: ClipboardCheckIcon,
    capability: "content.read",
  },
  {
    to: "/admin/food-categories/list",
    label: "Ovqat Kategoriyalari",
    icon: TagIcon,
    capability: "content.read",
  },
  {
    to: "/admin/foods/list",
    label: "Ovqatlar bazasi",
    icon: UtensilsIcon,
    capability: "content.read",
  },
  {
    to: "/admin/recipes/list",
    label: "Retseptlar",
    icon: BookOpenIcon,
    capability: "content.read",
  },
  {
    to: "/admin/ingredients/list",
    label: "Ingredientlar",
    icon: SoupIcon,
    capability: "content.read",
  },
  {
    to: "/admin/cuisines/list",
    label: "Oshxonalar",
    icon: GlobeIcon,
    capability: "content.read",
  },
  {
    to: "/admin/locations",
    label: "Locations",
    icon: MapPinnedIcon,
    capability: "content.read",
  },
  {
    to: "/admin/achievements/list",
    label: "Achievements",
    icon: AwardIcon,
    capability: "content.read",
  },
  {
    to: "/admin/health-constraints/list",
    label: "Health Constraints",
    icon: HeartPulseIcon,
    capability: "content.read",
  },
  {
    to: "/admin/user-goals/list",
    label: "Maqsadlar",
    icon: TargetIcon,
    capability: "content.read",
  },
  {
    to: "/admin/nutrition-preferences/list",
    label: "Ovqatlanish talablari",
    icon: LeafIcon,
    capability: "content.read",
  },
  {
    to: "/admin/meal-plans/list",
    label: "Meal plan shablonlari",
    icon: CalendarDaysIcon,
    capability: "content.read",
  },

  {
    to: "/admin/workouts/list",
    label: "Mashg'ulotlar",
    icon: DumbbellIcon,
    capability: "content.read",
  },
  {
    to: "/admin/workout-plans",
    label: "Workout rejalari",
    icon: DumbbellIcon,
    capability: "content.read",
  },
  {
    to: "/admin/workout-categories/list",
    label: "Mashg'ulot Kategoriyalari",
    icon: TagIcon,
    capability: "content.read",
  },
  {
    to: "/admin/workout-muscles",
    label: "Mashq muskullari",
    icon: DumbbellIcon,
    capability: "content.read",
  },
  {
    to: "/admin/workout-body-parts",
    label: "Tana qismlari",
    icon: TagIcon,
    capability: "content.read",
  },
  {
    to: "/admin/equipments/list",
    label: "Jihozlar",
    icon: WrenchIcon,
    capability: "content.read",
  },
];

const premiumNav = [
  {
    to: "/admin/revenue",
    label: "Daromad",
    icon: TrendingUpIcon,
    capability: "finance.read",
  },
  {
    to: "/admin/withdrawals",
    label: "Yechib olishlar",
    icon: WalletCardsIcon,
    capability: "finance.read",
  },
  {
    to: "/admin/premium",
    label: "Premium",
    icon: GemIcon,
    capability: "growth.read",
  },
  {
    to: "/admin/premium/subscriptions",
    label: "Obunalar",
    icon: CrownIcon,
    capability: "growth.read",
  },
];

const systemNav = [
  {
    to: "/admin/reports",
    label: "Hisobotlar",
    icon: FileSpreadsheetIcon,
    capability: "admin.read",
  },
  {
    to: "/admin/audit-logs",
    label: "Audit log",
    icon: FileClockIcon,
    capability: "admin.read",
  },
  {
    to: "/admin/platform-bot",
    label: "Platform Bot",
    icon: BotIcon,
    capability: "growth.read",
  },
  {
    to: "/admin/ai",
    label: "AI Admin",
    icon: BrainCircuitIcon,
    capability: "settings.manage",
  },
  {
    to: "/admin/notifications",
    label: "Notifications",
    icon: BellRingIcon,
    capability: "support.read",
  },
  {
    to: "/admin/languages",
    label: "Tillar",
    icon: GlobeIcon,
    capability: "content.read",
  },
  {
    to: "/admin/settings",
    label: "Sozlamalar",
    icon: SettingsIcon,
    capability: "settings.manage",
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

const CONTENT_ROLES = ["SUPER_ADMIN"];
const ADMIN_ROLES = ["SUPER_ADMIN"];

const canSeeNavItem = (roles, item, permissions) => {
  if (item.capability) {
    return permissions.hasCapability(item.capability);
  }

  const allowedRoles = item.roles || ADMIN_ROLES;
  return some(allowedRoles, (role) => includes(roles, role));
};

const getVisibleNavItems = (items, roles, permissions) =>
  filter(
    map(items, (item) => ({
      ...item,
      roles: item.roles || CONTENT_ROLES,
    })),
    (item) => canSeeNavItem(roles, item, permissions),
  );

const Index = () => {
  const { user, roles } = useAuthStore();
  const permissions = useAdminPermissions();
  const { openProfile } = useProfileOverlay();
  const mobileChromeHidden = useMobileChromeHidden();

  const visibleMainNav = React.useMemo(
    () =>
      filter(mainNav, (item) =>
        canSeeNavItem(
          roles,
          item.roles ? item : { ...item, roles: ADMIN_ROLES },
          permissions,
        ),
      ),
    [permissions, roles],
  );
  const visibleContentNav = React.useMemo(
    () => getVisibleNavItems(contentNav, roles, permissions),
    [permissions, roles],
  );
  const visiblePremiumNav = React.useMemo(
    () => filter(premiumNav, (item) => canSeeNavItem(roles, item, permissions)),
    [permissions, roles],
  );
  const visibleSystemNav = React.useMemo(
    () =>
      filter(systemNav, (item) =>
        canSeeNavItem(
          roles,
          item.roles ? item : { ...item, roles: ADMIN_ROLES },
          permissions,
        ),
      ),
    [permissions, roles],
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
                      toUpper(user?.username?.[0]) ||
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
