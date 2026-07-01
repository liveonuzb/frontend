import find from "lodash/find";
import React from "react";
import { ArrowLeftIcon, LeafIcon } from "lucide-react";
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
import { userCardScopeClassName } from "@/modules/user/lib/card-styles";
import { cn } from "@/lib/utils";

const ProfileDrawer = () => {
  const {
    isProfileOpen,
    activeProfileTab,
    closeProfile,
    openProfileDrawer,
    setProfileTab,
  } = useProfileOverlay();

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

    closeProfile();
  }, [closeProfile, isOverview, setProfileTab]);

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
        className={cn(
          "data-[vaul-drawer-direction=bottom]:max-h-[100vh] data-[vaul-drawer-direction=bottom]:md:max-w-sm",
          userCardScopeClassName,
        )}
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

            {isOverview ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Open app vibe"
                className="absolute right-0 shrink-0 rounded-full"
                onClick={() => openProfileDrawer("mode", PROFILE_OVERVIEW_TAB)}
              >
                <LeafIcon className="size-5" />
              </Button>
            ) : null}

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
              <>
                <DrawerTitle className="sr-only">Profile</DrawerTitle>
                <DrawerDescription className="sr-only">
                  {activeDescription}
                </DrawerDescription>
              </>
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
