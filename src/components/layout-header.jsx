import { map, join } from "lodash";
import React from "react";
import { cn } from "@/lib/utils";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Breadcrumbs from "@/components/breadcrumbs";
import { useTranslation } from "react-i18next";

const LayoutHeader = ({
  mobileChromeHidden,
  user,
  onOpenProfile,
  desktopRightContent,
}) => {
  const { t } = useTranslation();
  const displayName =
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
    user?.username ||
    t("common.navUser.user");
  const initials = join(map(displayName.split(" "), (part) => part[0]), "")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-10 h-16 shrink-0 bg-background/50 px-2 shadow backdrop-blur-2xl transition-transform duration-200 md:static md:border-b md:px-4 md:shadow-none md:translate-y-0",
        mobileChromeHidden ? "-translate-y-full" : "translate-y-0"
      )}
    >
      <div className="flex h-full items-center md:hidden">
        <div className="flex w-full items-center justify-between gap-2">
          <SidebarTrigger className="-ml-1" />
          <img
            src="/logo-mini.png"
            alt="Logo"
            className="pointer-events-none absolute left-1/2 size-8 -translate-x-1/2"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="rounded-full"
            onClick={onOpenProfile}
          >
            <Avatar className="size-8 border">
              <AvatarImage src={user?.avatar} alt={displayName} />
              <AvatarFallback className="text-[10px] font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </div>
      </div>

      <div className="hidden h-full items-center gap-2 md:flex">
        <SidebarTrigger className="-ml-1" />
        <Breadcrumbs />
        <div className="ml-auto flex items-center gap-2">
          {desktopRightContent}
        </div>
      </div>
    </header>
  );
};

export default LayoutHeader;
