export const isRunningLiveImmersivePath = (pathname = "") =>
  pathname.startsWith("/user/workout/running/live");

export const shouldHideMobileNavForPath = (pathname = "") =>
  pathname.startsWith("/user/chat") || isRunningLiveImmersivePath(pathname);
