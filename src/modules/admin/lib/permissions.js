import { useAuthStore } from "@/store";
import { get } from "lodash";
import { useGetQuery } from "@/hooks/api";

const CAPABILITY_ROLES = {
  "admin.read": [
    "SUPER_ADMIN",
    "CONTENT_MANAGER",
    "SUPPORT",
    "FINANCE",
    "GROWTH",
    "READONLY_ADMIN",
    "ADMIN",
    "MODERATOR",
    "COACH_MANAGER",
    "NUTRITION_MANAGER",
    "WORKOUT_MANAGER",
  ],
  "content.read": [
    "SUPER_ADMIN",
    "CONTENT_MANAGER",
    "ADMIN",
    "MODERATOR",
    "NUTRITION_MANAGER",
    "WORKOUT_MANAGER",
    "READONLY_ADMIN",
  ],
  "content.manage": [
    "SUPER_ADMIN",
    "CONTENT_MANAGER",
    "NUTRITION_MANAGER",
    "WORKOUT_MANAGER",
  ],
  "support.read": [
    "SUPER_ADMIN",
    "SUPPORT",
    "ADMIN",
    "MODERATOR",
    "COACH_MANAGER",
    "READONLY_ADMIN",
  ],
  "support.manage": ["SUPER_ADMIN", "SUPPORT", "COACH_MANAGER"],
  "support.sensitive": ["SUPER_ADMIN", "SUPPORT"],
  "support.block": ["SUPER_ADMIN", "SUPPORT", "ADMIN"],
  "support.delete": ["SUPER_ADMIN"],
  "support.export": ["SUPER_ADMIN", "SUPPORT"],
  "support.revokeSession": ["SUPER_ADMIN", "SUPPORT"],
  "finance.read": ["SUPER_ADMIN", "FINANCE", "ADMIN", "READONLY_ADMIN"],
  "finance.manage": ["SUPER_ADMIN", "FINANCE"],
  "growth.read": [
    "SUPER_ADMIN",
    "GROWTH",
    "FINANCE",
    "ADMIN",
    "COACH_MANAGER",
    "READONLY_ADMIN",
  ],
  "growth.manage": ["SUPER_ADMIN", "GROWTH", "COACH_MANAGER"],
  "growth.gift": ["SUPER_ADMIN", "GROWTH"],
  "settings.manage": ["SUPER_ADMIN"],
};

export const hasAdminCapability = (roles, capability) => {
  const allowedRoles = CAPABILITY_ROLES[capability] || [];
  if (!Array.isArray(roles) || !roles.length || !allowedRoles.length) {
    return false;
  }

  return roles.some((role) => allowedRoles.includes(role));
};

export const isSuperAdminRole = (roles) =>
  Array.isArray(roles) && roles.includes("SUPER_ADMIN");

export const useAdminPermissions = () => {
  const roles = useAuthStore((state) => state.roles ?? []);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isSuperAdmin = isSuperAdminRole(roles);
  const isAdmin = roles.some((role) =>
    [
      "SUPER_ADMIN",
      "CONTENT_MANAGER",
      "SUPPORT",
      "FINANCE",
      "GROWTH",
      "READONLY_ADMIN",
      "ADMIN",
      "MODERATOR",
      "COACH_MANAGER",
      "NUTRITION_MANAGER",
      "WORKOUT_MANAGER",
    ].includes(role),
  );
  const { data, isLoading } = useGetQuery({
    url: "/admin/me/permissions",
    queryProps: {
      queryKey: ["admin", "me", "permissions", roles],
      enabled: Boolean(isAuthenticated && isAdmin),
      staleTime: 60000,
    },
  });
  const backendCapabilities = get(data, "data.data.capabilities");
  const capabilitySet = Array.isArray(backendCapabilities)
    ? new Set(backendCapabilities)
    : null;
  const hasCapability = (capability) =>
    capabilitySet
      ? capabilitySet.has(capability)
      : hasAdminCapability(roles, capability);

  return {
    roles,
    isSuperAdmin,
    isLoading,
    capabilities: backendCapabilities ?? [],
    canReadContent: hasCapability("content.read"),
    canManageContent: hasCapability("content.manage"),
    canReadSupport: hasCapability("support.read"),
    canManageSupport: hasCapability("support.manage"),
    canViewSensitiveSupportData: hasCapability("support.sensitive"),
    canBlockUsers: hasCapability("support.block"),
    canDeleteUsers: hasCapability("support.delete"),
    canExportUsers: hasCapability("support.export"),
    canRevokeUserSessions: hasCapability("support.revokeSession"),
    canReadFinance: hasCapability("finance.read"),
    canManageFinance: hasCapability("finance.manage"),
    canReadGrowth: hasCapability("growth.read"),
    canManageGrowth: hasCapability("growth.manage"),
    canGiftPremium: hasCapability("growth.gift"),
    canManageSettings: hasCapability("settings.manage"),
    hasCapability,
  };
};
