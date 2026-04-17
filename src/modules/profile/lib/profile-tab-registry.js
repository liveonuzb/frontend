export const PROFILE_OVERVIEW_TAB = "overview";
export const DEFAULT_PROFILE_TAB = "profile";

const PROFILE_TAB_REGISTRY = [
  { id: "profile" },
  { id: "general" },
  { id: "appearance" },
  { id: "health" },
  { id: "notifications" },
  { id: "privacy" },
  { id: "security" },
  { id: "premium" },
  { id: "referral" },
];

export const PROFILE_TAB_IDS = PROFILE_TAB_REGISTRY.map(({ id }) => id);

const PROFILE_TAB_ID_SET = new Set(PROFILE_TAB_IDS);

export const isProfileContentTab = (tabId) => PROFILE_TAB_ID_SET.has(tabId);

export const isProfileOverlayTab = (tabId) =>
  tabId === PROFILE_OVERVIEW_TAB || isProfileContentTab(tabId);

export const normalizeProfileContentTab = (
  tabId,
  fallback = DEFAULT_PROFILE_TAB,
) => (isProfileContentTab(tabId) ? tabId : fallback);

export const normalizeProfileOverlayTab = (tabId) =>
  isProfileOverlayTab(tabId) ? tabId : PROFILE_OVERVIEW_TAB;
