import { find } from "lodash";
import React from "react";
import { ArrowLeftIcon } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Drawer,
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
import { isProfileNestedDrawerTab } from "@/modules/profile/lib/profile-tab-registry";
import { cn } from "@/lib/utils";

const ProfileDrawer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isProfileOpen, activeProfileTab, closeProfile, setProfileTab } =
    useProfileOverlay();

  const { t } = useTranslation();
  const visibleProfileTab = isProfileNestedDrawerTab(activeProfileTab)
    ? PROFILE_OVERVIEW_TAB
    : activeProfileTab;
  const isOverview = visibleProfileTab === PROFILE_OVERVIEW_TAB;
  const tabs = React.useMemo(() => getProfileTabs(t), [t]);
  const activeTabConfig = React.useMemo(
    () => find(tabs, (tab) => tab.id === visibleProfileTab) ?? null,
    [tabs, visibleProfileTab],
  );

  const activeTitle = isOverview
    ? "Profile"
    : activeTabConfig?.label ?? "Profile";
  const activeDescription = isOverview
    ? t("profile.subtitle")
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
      direction="bottom"
      open={isProfileOpen}
      onOpenChange={(open) => {
        if (!open) {
          closeProfile();
        }
      }}
    >
      <DrawerContent
        className="data-[vaul-drawer-direction=bottom]:!mx-auto data-[vaul-drawer-direction=bottom]:!max-w-md"
        data-vaul-no-drag
      >
        <DrawerHeader
          className={cn(
            "px-4 shrink-0 flex justify-center",
            isOverview ? "h-14 py-3" : "h-20 py-5",
          )}
        >
          <div className="relative flex w-full items-center justify-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute left-0 shrink-0 rounded-full"
              onClick={handleBack}
            >
              <ArrowLeftIcon className="size-5" />
            </Button>

            {!isOverview ? (
              <div className="flex min-w-0 flex-col px-12 text-center">
                <DrawerTitle className="truncate text-sm font-semibold leading-tight">
                  {activeTitle}
                </DrawerTitle>
                <DrawerDescription className="truncate text-xs text-muted-foreground leading-tight mt-0.5">
                  {activeDescription}
                </DrawerDescription>
              </div>
            ) : (
              <div className="min-w-0 px-12 text-center">
                <DrawerTitle className="truncate text-base font-semibold">
                  {activeTitle}
                </DrawerTitle>
                <DrawerDescription className="sr-only">
                  {activeDescription}
                </DrawerDescription>
              </div>
            )}

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
