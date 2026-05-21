export const isRunningLiveImmersivePath = () => false;

export const shouldHideMobileNavForPath = (pathname = "") =>
  pathname.startsWith("/user/chat");
