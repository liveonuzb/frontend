import React from "react";
import { useLocation, useNavigate } from "react-router";
import {
  DEFAULT_PROFILE_TAB,
  PROFILE_OVERVIEW_TAB,
  normalizeProfileOverlayTab,
} from "@/modules/profile/lib/profile-tab-registry";
import {
  PROFILE_DRAWER_IDS_BY_TAB,
  buildProfileRoutePath,
  getProfileRouteState,
  isProfileDrawerId,
} from "@/modules/profile/lib/profile-route-state";
import { useProfileRouteLocation } from "@/modules/profile/lib/profile-route-location-context.jsx";

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
  const routerLocation = useLocation();
  const location = useProfileRouteLocation(routerLocation);
  const navigate = useNavigate();
  const overlayState = React.useMemo(
    () => getProfileRouteState(location.pathname, location.search),
    [location.pathname, location.search],
  );
  const {
    isProfileOpen,
    activeProfileTab,
    activeProfileDrawer,
    basePath,
    shouldSanitize,
    sanitizedPath,
  } = overlayState;

  const getRoutePath = React.useCallback(
    ({ tab = PROFILE_OVERVIEW_TAB, drawer = null } = {}) =>
      buildProfileRoutePath({
        pathname: location.pathname,
        search: location.search,
        tab,
        drawer,
      }),
    [location.pathname, location.search],
  );

  const getBaseRoutePath = React.useCallback(() => {
    const nextParams = new URLSearchParams(location.search);
    nextParams.delete(PROFILE_OPEN_PARAM);
    nextParams.delete(PROFILE_TAB_PARAM);
    const query = nextParams.toString();

    return query ? `${basePath}?${query}` : basePath;
  }, [basePath, location.search]);

  React.useEffect(() => {
    if (!shouldSanitize || !sanitizedPath) {
      return;
    }

    navigate(sanitizedPath, { replace: true });
  }, [navigate, sanitizedPath, shouldSanitize]);

  const openProfile = React.useCallback(
    (tab = DEFAULT_PROFILE_TAB, drawer = null) => {
      navigate(
        getRoutePath({
          tab: normalizeProfileOverlayTab(tab),
          drawer,
        }),
      );
    },
    [getRoutePath, navigate],
  );

  const closeProfile = React.useCallback(() => {
    navigate(getBaseRoutePath(), { replace: true });
  }, [getBaseRoutePath, navigate]);

  const setProfileTab = React.useCallback(
    (tab) => {
      navigate(
        getRoutePath({
          tab: normalizeProfileOverlayTab(tab),
        }),
        { replace: true },
      );
    },
    [getRoutePath, navigate],
  );

  const openProfileDrawer = React.useCallback(
    (drawer, tab) => {
      const targetTab =
        tab ??
        (isProfileDrawerId(activeProfileTab, drawer)
          ? activeProfileTab
          : PROFILE_OVERVIEW_TAB);
      const targetDrawer = isProfileDrawerId(targetTab, drawer) ? drawer : null;

      navigate(
        getRoutePath({
          tab: targetTab,
          drawer: targetDrawer,
        }),
        { replace: true },
      );
    },
    [activeProfileTab, getRoutePath, navigate],
  );

  const closeProfileDrawer = React.useCallback(() => {
    navigate(
      getRoutePath({
        tab: activeProfileTab,
      }),
      { replace: true },
    );
  }, [activeProfileTab, getRoutePath, navigate]);

  const getProfileDrawerIds = React.useCallback(
    (tab = activeProfileTab) => PROFILE_DRAWER_IDS_BY_TAB[tab] ?? [],
    [activeProfileTab],
  );

  return {
    isProfileOpen,
    activeProfileTab,
    activeProfileDrawer,
    baseProfilePath: basePath,
    openProfile,
    closeProfile,
    setProfileTab,
    openProfileDrawer,
    closeProfileDrawer,
    getProfileDrawerIds,
  };
};
