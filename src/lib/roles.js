import { map, compact, filter, includes, isArray } from "lodash";

const ACTIVE_ROLES = [
  "SUPER_ADMIN",
  "USER",
  "FINANCE",
  "GROWTH",
  "SUPPORT",
  "CONTENT_MANAGER",
  "READONLY_ADMIN",
  "MODERATOR",
];

export const normalizeRoles = (roles) => {
  if (!isArray(roles)) return [];
  return filter(
    compact(
      map(roles, (role) => {
        const normalizedRole =
          typeof role === "string" ? role : role?.name || role?.role;
        return normalizedRole;
      }),
    ),
    (role) => includes(ACTIVE_ROLES, role),
  );
};
