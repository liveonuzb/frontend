const STANDALONE_PROFILE_TAB_ROUTES = {
  health: "/user/health",
};

export const isStandaloneProfileTab = (tabId) =>
  Object.prototype.hasOwnProperty.call(STANDALONE_PROFILE_TAB_ROUTES, tabId);

export const getStandaloneProfileTabPath = (tabId, search = "") => {
  const basePath = STANDALONE_PROFILE_TAB_ROUTES[tabId];

  if (!basePath) {
    return null;
  }

  const nextParams = new URLSearchParams(search);
  nextParams.delete("profile");
  nextParams.delete("profileTab");
  nextParams.delete("tab");

  const query = nextParams.toString();

  return query ? `${basePath}?${query}` : basePath;
};
