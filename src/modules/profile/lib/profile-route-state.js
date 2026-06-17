import { filter, includes, join, lastIndexOf, size, slice, split, trim } from "lodash";
import {
  PROFILE_OVERVIEW_TAB,
  normalizeProfileOverlayTab,
} from "./profile-tab-registry";

export const PROFILE_ROUTE_SEGMENT = "profile";

export const PROFILE_DRAWER_IDS_BY_TAB = {
  [PROFILE_OVERVIEW_TAB]: [
    "mode",
    "theme",
    "language",
    "notifications",
    "xp",
    "xp-history",
    "gender",
    "age",
    "weight",
    "height",
    "goals",
    "macros",
    "delete-account",
  ],
  profile: ["contact", "otp"],
  notifications: ["settings"],
  security: ["2fa-setup", "2fa-disable", "2fa-regenerate"],
  referral: ["qr", "withdraw"],
};

const PROFILE_QUERY_OPEN_VALUE = "open";

const toPathSegments = (pathname = "") =>
  filter(split(trim(String(pathname || ""), "/"), "/"), Boolean);

const toPathname = (segments) => {
  const path = join(segments, "/");
  return path ? `/${path}` : "/";
};

const cleanProfileSearch = (search = "") => {
  const nextParams = new URLSearchParams(search);
  nextParams.delete("profile");
  nextParams.delete("profileTab");
  const query = nextParams.toString();

  return query ? `?${query}` : "";
};

export const isProfileDrawerId = (tabId, drawerId) =>
  includes(PROFILE_DRAWER_IDS_BY_TAB[tabId] ?? [], drawerId);

export const getProfileRouteState = (pathname = "", search = "") => {
  const segments = toPathSegments(pathname);
  const profileIndex = lastIndexOf(segments, PROFILE_ROUTE_SEGMENT);
  const profileState = new URLSearchParams(search).get("profile");
  const profileTab = new URLSearchParams(search).get("profileTab");
  const hasLegacyProfileState = profileState === PROFILE_QUERY_OPEN_VALUE;

  if (profileIndex < 0) {
    if (!hasLegacyProfileState) {
      return {
        isProfileOpen: false,
        basePath: pathname || "/",
        activeProfileTab: PROFILE_OVERVIEW_TAB,
        activeProfileDrawer: null,
        shouldSanitize: false,
        sanitizedPath: pathname || "/",
      };
    }

    const legacyTab = normalizeProfileOverlayTab(profileTab);
    const sanitizedPath = buildProfileRoutePath({
      pathname,
      search: cleanProfileSearch(search),
      tab: legacyTab,
    });

    return {
      isProfileOpen: true,
      basePath: pathname || "/",
      activeProfileTab: legacyTab,
      activeProfileDrawer: null,
      shouldSanitize: true,
      sanitizedPath,
    };
  }

  const baseSegments = slice(segments, 0, profileIndex);
  const suffixSegments = slice(segments, profileIndex + 1);
  const basePath = toPathname(baseSegments);
  const rawTab = suffixSegments[0] ?? PROFILE_OVERVIEW_TAB;
  const activeProfileTab = normalizeProfileOverlayTab(rawTab);
  const rawDrawer = suffixSegments[1] ?? null;
  const activeProfileDrawer = isProfileDrawerId(activeProfileTab, rawDrawer)
    ? rawDrawer
    : null;
  const expectedPath = buildProfileRoutePath({
    pathname: basePath,
    tab: activeProfileTab,
    drawer: activeProfileDrawer,
  });
  const expectedSuffixLength = activeProfileDrawer
    ? 2
    : activeProfileTab === PROFILE_OVERVIEW_TAB
      ? 0
      : 1;
  const hasUnexpectedSuffix = size(suffixSegments) > expectedSuffixLength;
  const shouldSanitize =
    rawTab !== activeProfileTab ||
    rawDrawer !== activeProfileDrawer ||
    hasUnexpectedSuffix ||
    hasLegacyProfileState;

  return {
    isProfileOpen: true,
    basePath,
    activeProfileTab,
    activeProfileDrawer,
    shouldSanitize,
    sanitizedPath: expectedPath,
  };
};

export const stripProfileRouteSuffix = (pathname = "") =>
  getProfileRouteState(pathname).basePath;

export const buildProfileRoutePath = ({
  pathname = "/",
  search = "",
  tab = PROFILE_OVERVIEW_TAB,
  drawer = null,
}) => {
  const basePath = stripProfileRouteSuffix(pathname);
  const activeProfileTab = normalizeProfileOverlayTab(tab);
  const activeProfileDrawer = isProfileDrawerId(activeProfileTab, drawer)
    ? drawer
    : null;
  const segments = [
    ...toPathSegments(basePath),
    PROFILE_ROUTE_SEGMENT,
    ...(activeProfileTab !== PROFILE_OVERVIEW_TAB || activeProfileDrawer
      ? [activeProfileTab]
      : []),
    ...(activeProfileDrawer ? [activeProfileDrawer] : []),
  ];

  return `${toPathname(segments)}${cleanProfileSearch(search)}`;
};
