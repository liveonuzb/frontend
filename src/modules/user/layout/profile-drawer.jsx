import { map, take, find } from "lodash";
import React from "react";
import { ArrowLeftIcon, PencilIcon, XIcon } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerBody,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import ProfileContainer from "@/modules/profile/containers/profile";
import { getProfileTabs } from "@/modules/profile/containers/profile/profile-tabs";
import {
  PROFILE_OVERVIEW_TAB,
  useProfileOverlay,
} from "@/modules/profile/hooks/use-profile-overlay";
import { useAuthStore } from "@/store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const ProfileDrawer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { isProfileOpen, activeProfileTab, closeProfile, setProfileTab } =
    useProfileOverlay();

  const { t } = useTranslation();
  const isOverview = activeProfileTab === PROFILE_OVERVIEW_TAB;
  const tabs = React.useMemo(() => getProfileTabs(t), [t]);
  const activeTabConfig = React.useMemo(
    () => find(tabs, (tab) => tab.id === activeProfileTab) ?? null,
    [activeProfileTab, tabs],
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
  const activeTitle = isOverview
    ? displayName
    : activeTabConfig?.label ?? t("profile.title");
  const activeDescription = isOverview
    ? t("profile.edit")
    : activeTabConfig?.description ?? t("profile.subtitle");

  const handleBack = React.useCallback(() => {
    if (!isOverview) {
      setProfileTab(PROFILE_OVERVIEW_TAB);
      return;
    }

    if (!location.pathname.startsWith("/user/profile")) {
      closeProfile();
      return;
    }

    navigate(-1);
  }, [closeProfile, isOverview, location.pathname, navigate, setProfileTab]);

  return (
    <Drawer
      open={isProfileOpen}
      onOpenChange={(open) => {
        if (!open) {
          closeProfile();
        }
      }}
    >
      <DrawerContent
        className="data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:sm:max-w-md"
        data-vaul-no-drag
      >
        {/* Header */}
        <DrawerHeader className="px-4 py-5 shrink-0 h-20 flex justify-center">
          <div className="flex items-center justify-between gap-2">
            {/* Left: back button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 rounded-full"
              onClick={handleBack}
            >
              <ArrowLeftIcon className="size-5" />
            </Button>

            {/* Center: avatar (overview only) + title + description */}
            <div className="flex flex-1 items-center gap-2.5 min-w-0">
              {isOverview ? (
                <Avatar className="size-10 shrink-0 border">
                  <AvatarImage src={user?.avatar} alt={displayName} />
                  <AvatarFallback className="text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              ) : null}
              <div className="flex flex-col min-w-0">
                <DrawerTitle className="truncate text-sm font-semibold leading-tight">
                  {activeTitle}
                </DrawerTitle>
                <DrawerDescription className="truncate text-xs text-muted-foreground leading-tight mt-0.5">
                  {activeDescription}
                </DrawerDescription>
              </div>
            </div>

            {/* Right: pencil (overview only) + close */}
            <div className="flex items-center gap-1">
              {isOverview ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 rounded-full"
                  onClick={() => setProfileTab("profile")}
                >
                  <PencilIcon className="size-4" />
                </Button>
              ) : null}
              <DrawerClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 rounded-full"
                >
                  <XIcon className="size-5" />
                </Button>
              </DrawerClose>
            </div>
          </div>
        </DrawerHeader>

        <DrawerBody className="min-h-0 px-0 pb-3">
          <ProfileContainer embedded />
        </DrawerBody>
        {isOverview && <DrawerFooter></DrawerFooter>}
      </DrawerContent>
    </Drawer>
  );
};

export default ProfileDrawer;
