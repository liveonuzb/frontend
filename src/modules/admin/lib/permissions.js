import { useAuthStore } from "@/store";

const CAPABILITY_ROLES = {
  "admin.read": [
    "SUPER_ADMIN",
    "CONTENT_MANAGER",
    "SUPPORT",
    "FINANCE",
    "GROWTH",
    "READONLY_ADMIN",
  ],
  "content.read": ["SUPER_ADMIN", "CONTENT_MANAGER", "READONLY_ADMIN"],
  "content.manage": ["SUPER_ADMIN", "CONTENT_MANAGER"],
  "support.read": ["SUPER_ADMIN", "SUPPORT", "READONLY_ADMIN"],
  "support.manage": ["SUPER_ADMIN", "SUPPORT"],
  "finance.read": ["SUPER_ADMIN", "FINANCE", "READONLY_ADMIN"],
  "finance.manage": ["SUPER_ADMIN", "FINANCE"],
  "growth.read": ["SUPER_ADMIN", "GROWTH", "FINANCE", "READONLY_ADMIN"],
  "growth.manage": ["SUPER_ADMIN", "GROWTH"],
  "settings.manage": ["SUPER_ADMIN"],
};

export const hasAdminCapability = (roles, capability) => {
  const allowedRoles = CAPABILITY_ROLES[capability] || [];
  if (!Array.isArray(roles) || !roles.length || !allowedRoles.length) {
    return false;
  }

  return roles.some((role) => allowedRoles.includes(role));
};

export const useAdminPermissions = () => {
  const roles = useAuthStore((state) => state.roles ?? []);

  return {
    roles,
    canReadContent: hasAdminCapability(roles, "content.read"),
    canManageContent: hasAdminCapability(roles, "content.manage"),
    canReadSupport: hasAdminCapability(roles, "support.read"),
    canManageSupport: hasAdminCapability(roles, "support.manage"),
    canReadFinance: hasAdminCapability(roles, "finance.read"),
    canManageFinance: hasAdminCapability(roles, "finance.manage"),
    canReadGrowth: hasAdminCapability(roles, "growth.read"),
    canManageGrowth: hasAdminCapability(roles, "growth.manage"),
    canManageSettings: hasAdminCapability(roles, "settings.manage"),
    hasCapability: (capability) => hasAdminCapability(roles, capability),
  };
};
