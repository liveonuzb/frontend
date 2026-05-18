import { some, split } from "lodash";
export const normalizeRoutePath = (path = "") => {
  if (!path) return "";

  const normalized = split(String(path), "?")[0].replace(/\/+$/, "");
  return normalized || "/";
};

const getNavMatchPath = (item = {}) => {
  const path = normalizeRoutePath(item.matchTo || item.activeTo || item.to);
  return path.replace(/\/(home|list)$/, "");
};

const matchesPath = (pathname, matchPath) =>
  pathname === matchPath || pathname.startsWith(`${matchPath}/`);

export const isNavItemActive = (pathname, item, items = []) => {
  const currentPath = normalizeRoutePath(pathname);
  const matchPath = getNavMatchPath(item);

  if (!matchPath || !matchesPath(currentPath, matchPath)) {
    return false;
  }

  return !some(items, (candidate) => {
    if (candidate === item) return false;

    const candidateMatchPath = getNavMatchPath(candidate);

    return (
      candidateMatchPath.length > matchPath.length &&
      matchesPath(currentPath, candidateMatchPath)
    );
  });
};
