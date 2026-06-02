import some from "lodash/some";

export const ADMIN_ROLES = [
  "SUPER_ADMIN",
];

const REFERRAL_PATH_PREFIXES = ["/r/", "/ref/"];
const LANGUAGE_PATH = "/auth/select-language";
const MODE_PATH = "/auth/select-mode";

export const isReferralPath = (pathname = "") =>
  some(REFERRAL_PATH_PREFIXES, (path) => pathname.startsWith(path));

export const isLandingPath = (pathname = "") => pathname === "/";

export const getPreAuthRedirectPath = ({
  isAuthenticated,
  isTelegramWebApp,
  hasSelectedLanguage,
  appMode,
  pathname = "",
}) => {
  if (isAuthenticated || isTelegramWebApp) {
    return null;
  }

  if (isReferralPath(pathname) || isLandingPath(pathname)) {
    return null;
  }

  if (!hasSelectedLanguage && pathname !== LANGUAGE_PATH) {
    return LANGUAGE_PATH;
  }

  if (
    hasSelectedLanguage &&
    !appMode &&
    pathname !== MODE_PATH &&
    pathname !== LANGUAGE_PATH
  ) {
    return MODE_PATH;
  }

  return null;
};

export const shouldShowTelegramAuthLoader = ({
  isAuthenticated,
  isTelegramWebApp,
  telegramAuthError,
}) => Boolean(isTelegramWebApp && !isAuthenticated && !telegramAuthError);
