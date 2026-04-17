import { map, compact } from "lodash";

export const normalizeRoles = (roles) => {
  if (!Array.isArray(roles)) return [];
  return compact(
    map(roles, (role) => {
      const normalizedRole =
        typeof role === "string" ? role : role?.name || role?.role;
      return normalizedRole === "ADMIN" ? "SUPER_ADMIN" : normalizedRole;
    }),
  );
};
