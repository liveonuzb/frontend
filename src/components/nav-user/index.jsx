import React from "react";
import join from "lodash/join";
import map from "lodash/map";
import take from "lodash/take";
import toUpper from "lodash/toUpper";
import trim from "lodash/trim";
import split from "lodash/split";
import { useNavigate } from "react-router";
import {
  ChevronsUpDown,
  LogOutIcon,
  UserIcon,
  BellIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/store";
import { usePostQuery } from "@/hooks/api";
import { useQueryClient } from "@tanstack/react-query";
import { useProfileOverlay } from "@/modules/profile/hooks/use-profile-overlay";

const NavUser = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isMobile } = useSidebar();
  const { logout, refreshToken, user } = useAuthStore();
  const { mutateAsync: logoutRequest } = usePostQuery();
  const { openProfile } = useProfileOverlay();
  const { t } = useTranslation();

  const displayName = user?.firstName
    ? trim(`${user.firstName} ${user.lastName || ""}`)
    : t("common.navUser.user");

  const email = user?.email || "user@example.com";

  const initials = toUpper(join(
    take(
      map(split(displayName, " "), (n) => n[0]),
      2,
    ),
    "",
  ));

  const handleLogout = () => {
    const run = async () => {
      try {
        if (refreshToken) {
          await logoutRequest({
            url: "/auth/logout",
            attributes: { refreshToken },
          });
        }
      } finally {
        logout();
        queryClient.clear();
        navigate("/auth/sign-in", { replace: true });
      }
    };

    void run();
  };

  const openProfileEntry = (tab = "profile") => {
    openProfile(tab);
  };

  const handleProfileClick = () => {
    openProfileEntry("profile");
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarImage src={user?.avatar} alt={displayName} />
                <AvatarFallback className="rounded-lg text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{displayName}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {email}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="size-8 rounded-lg">
                  <AvatarImage src={user?.avatar} alt={displayName} />
                  <AvatarFallback className="rounded-lg text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleProfileClick}>
                <UserIcon />
                {t("common.navUser.profile")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("settings")}>
                <BellIcon />
                {t("common.navUser.notifications")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOutIcon />
              {t("common.navUser.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

export default NavUser;
