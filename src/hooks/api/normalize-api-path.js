const LEGACY_API_PATH_RULES = [
  [/^\/onboarding\/status\b/, "/user/onboarding/status"],
  [/^\/onboarding\/coach\b/, "/coach/onboarding/coach"],
  [/^\/onboarding\/user\b/, "/user/onboarding/user"],
  [/^\/users\/profile\b/, "/user/profile"],
  [/^\/users\/search\b/, "/user/search"],
  [/^\/users\b/, "/user"],
  [/^\/daily-tracking\b/, "/user/tracking"],
  [/^\/foods\b/, "/user/foods"],
  [/^\/payments\b/, "/user/billing/payments"],
  [/^\/languages\b/, "/user/languages"],
  [/^\/challenges\b/, "/user/challenges"],
  [/^\/chat\b/, "/user/chat"],
  [/^\/health-goals\b/, "/user/health-goals"],
  [/^\/measurements\b/, "/user/measurements"],
  [/^\/meal-plans\b/, "/user/meal-plans"],
  [/^\/workout-plans\b/, "/user/workout-plans"],
  [/^\/gamification\b/, "/user/gamification"],
  [/^\/referral\b/, "/user/referral"],
  [/^\/storage\/upload-media\b/, "/user/media/upload-media"],
  [/^\/storage\/upload\b/, "/user/media/upload"],
];

export const normalizeApiPath = (url) => {
  if (typeof url !== "string" || !url.startsWith("/")) {
    return url;
  }

  for (const [pattern, replacement] of LEGACY_API_PATH_RULES) {
    if (pattern.test(url)) {
      return url.replace(pattern, replacement);
    }
  }

  return url;
};
