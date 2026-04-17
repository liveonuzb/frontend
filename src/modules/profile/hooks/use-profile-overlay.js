import React from "react";
import { useSearchParams } from "react-router";
import {
  DEFAULT_PROFILE_TAB,
  PROFILE_OVERVIEW_TAB,
  normalizeProfileOverlayTab,
} from "@/modules/profile/lib/profile-tab-registry";

const PROFILE_OPEN_PARAM = "profile";
const PROFILE_TAB_PARAM = "profileTab";
const PROFILE_OPEN_VALUE = "open";

export { DEFAULT_PROFILE_TAB, PROFILE_OVERVIEW_TAB };

export const getNormalizedProfileOverlayState = ({
  profileState,
  profileTab,
}) => {
  const isOpen = profileState === PROFILE_OPEN_VALUE;

  if (!isOpen) {
    return {
      isProfileOpen: false,
      activeProfileTab: PROFILE_OVERVIEW_TAB,
      shouldSanitize: false,
    };
  }

  const activeProfileTab = normalizeProfileOverlayTab(profileTab);

  return {
    isProfileOpen: true,
    activeProfileTab,
    shouldSanitize: profileTab !== activeProfileTab,
  };
};

export const useProfileOverlay = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const overlayState = React.useMemo(
    () =>
      getNormalizedProfileOverlayState({
        profileState: searchParams.get(PROFILE_OPEN_PARAM),
        profileTab: searchParams.get(PROFILE_TAB_PARAM),
      }),
    [searchParams],
  );
  const { isProfileOpen, activeProfileTab, shouldSanitize } = overlayState;

  const updateSearchParams = React.useCallback(
    (updater, options) => {
      setSearchParams((current) => {
        const nextParams = new URLSearchParams(current);
        updater(nextParams);
        return nextParams;
      }, options);
    },
    [setSearchParams],
  );

  React.useEffect(() => {
    if (!shouldSanitize) {
      return;
    }

    updateSearchParams(
      (nextParams) => {
        nextParams.set(PROFILE_OPEN_PARAM, PROFILE_OPEN_VALUE);
        nextParams.set(PROFILE_TAB_PARAM, activeProfileTab);
      },
      { replace: true },
    );
  }, [activeProfileTab, shouldSanitize, updateSearchParams]);

  const openProfile = React.useCallback(
    (tab = DEFAULT_PROFILE_TAB) => {
      updateSearchParams(
        (nextParams) => {
          nextParams.set(PROFILE_OPEN_PARAM, PROFILE_OPEN_VALUE);
          nextParams.set(PROFILE_TAB_PARAM, normalizeProfileOverlayTab(tab));
        },
        { replace: true },
      );
    },
    [updateSearchParams],
  );

  const closeProfile = React.useCallback(() => {
    updateSearchParams(
      (nextParams) => {
        nextParams.delete(PROFILE_OPEN_PARAM);
        nextParams.delete(PROFILE_TAB_PARAM);
      },
      { replace: true },
    );
  }, [updateSearchParams]);

  const setProfileTab = React.useCallback(
    (tab) => {
      updateSearchParams(
        (nextParams) => {
          nextParams.set(PROFILE_OPEN_PARAM, PROFILE_OPEN_VALUE);
          nextParams.set(PROFILE_TAB_PARAM, normalizeProfileOverlayTab(tab));
        },
        { replace: true },
      );
    },
    [updateSearchParams],
  );

  return {
    isProfileOpen,
    activeProfileTab,
    openProfile,
    closeProfile,
    setProfileTab,
  };
};
